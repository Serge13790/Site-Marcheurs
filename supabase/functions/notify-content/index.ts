import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const brevoApiKey = Deno.env.get("BREVO_API_KEY")?.trim();
const adminEmail = Deno.env.get("ADMIN_EMAIL")?.trim();
const senderEmail = Deno.env.get("SENDER_EMAIL")?.trim() || adminEmail;
const siteUrl = Deno.env.get("SITE_URL")?.replace(/\/$/, "") ?? "http://localhost:5173";
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Initialize Supabase Client (if keys are present)
const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    const payload = await req.json();
    const { table, type, record, old_record, schema } = payload;

    // Safety checks
    if (!brevoApiKey || !adminEmail) {
      console.error("Missing config: BREVO_API_KEY or ADMIN_EMAIL");
      return new Response("Config Error", { status: 500 });
    }

    if (!supabase) {
      console.error("Missing config: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response("Config Error: Database access required", { status: 500 });
    }

    console.log(`Event received: ${type} on ${table}`);

    let subject = "";
    let title = "";
    let message = "";
    let detailsHtml = "";
    let recipientsPayload: any = null;

    // ----------------------------------------------------
    // CASE 1: HIKE EVENTS (INSERT OR UPDATE OR DELETE)
    // ----------------------------------------------------
    if (table === "hikes") {

      if (type === "DELETE") {
        // --- CASE E: DELETION (Crucial: Admin Alert) ---
        // old_record is guaranteed on DELETE in Supabase Webhooks
        subject = `🗑️ Rando SUPPRIMÉE : ${old_record?.title || 'Titre inconnu'}`;
        title = "Randonnée Supprimée";

        // Try to fetch deleter if possible, but usually not in payload. We just say "supprimée".
        message = `La randonnée "<strong>${old_record?.title}</strong>" a été <strong>définitivement supprimée</strong> de la base de données.`;
        detailsHtml = `
                <div class="info-row"><span class="label">Titre :</span> <span class="value">${old_record?.title}</span></div>
                <div class="info-row"><span class="label">Date :</span> <span class="value">${old_record?.date || '-'}</span></div>
                <div class="info-row"><span class="label">Statut :</span> <span class="value">${old_record?.status} (Avant suppression)</span></div>
             `;

      } else {
        // INSERT OR UPDATE
        // Detect state change
        const isPublished = record.status === "published" || record.status === "Publiée";
        const wasPublished = old_record && (old_record.status === "published" || old_record.status === "Publiée");
        const isNewPublication = isPublished && !wasPublished;
        const isUnpublished = !isPublished && wasPublished;

        // Fetch creator
        let creatorName = "L'équipe";
        if (record.created_by) {
          const { data: profile } = await supabase.from("profiles").select("first_name, last_name, email, display_name").eq("id", record.created_by).single();
          if (profile) {
            creatorName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.display_name || profile.email;
          }
        }

        if (isNewPublication) {
          // Check date (avoid spam for past hikes)
          const today = new Date().toISOString().split('T')[0];
          const hikeDate = record.date || today;

          if (hikeDate < today) {
            console.log(`Skipped broadcast: Hike ${record.title} is published but date (${hikeDate}) is in the past.`);
            return new Response("Skipped (past hike published)", { status: 200 });
          }

          // --- CASE A: PUBLIC BROADCAST (New Publication) ---
          subject = `🥾 Nouvelle Rando : ${record.title}`;
          title = "Nouvelle Rando à venir !";
          message = `Une nouvelle randonnée "<strong>${record.title}</strong>" a été publiée par <strong>${creatorName}</strong>.<br>Connectez-vous pour voir les détails et vous inscrire.`;

          // Fetch ALL approved members for broadcast
          console.log("Fetching approved members for broadcast...");
          const { data: members, error: membersError } = await supabase
            .from("profiles")
            .select("email, role, approved")
            .eq("approved", true)
            .not("email", "is", null);

          if (membersError) {
            console.error("Error fetching members:", membersError);
          } else if (members) {
            console.log(`Found ${members.length} approved members.`);
            // Debug: Log all found emails to check for missing ones
            console.log("Member emails found:", members.map(m => `${m.email} (${m.role})`).join(", "));

            const memberEmails = members.map(m => ({ email: m.email }));
            recipientsPayload = {
              sender: { name: "Les Joyeux Marcheurs", email: senderEmail },
              to: [{ email: senderEmail }], // Send to sender (admin) as primary to hide BCC list
              bcc: memberEmails,
              subject: subject,
              htmlContent: null // Will be filled below
            };
          }
        } else if (isUnpublished) {
          // --- CASE B: ADMIN NOTICE (Published -> Draft) ---
          subject = `⚠️ Rando Dépubliée : ${record.title}`;
          title = "Rando Remise en Brouillon";
          message = `La randonnée "<strong>${record.title}</strong>" a été retirée de la publication (remise en brouillon) par <strong>${creatorName}</strong>.`;

        } else if (isPublished && wasPublished) {
          // --- CASE C: ADMIN NOTICE (Published -> Published) ---
          // Avoid spam if just one field changed? For now notify on any update to published hike.
          subject = `✏️ Mise à jour Rando (Publiée) : ${record.title}`;
          title = "Randonnée Mise à Jour";
          message = `La randonnée "<strong>${record.title}</strong>" (déjà publiée) a été modifiée par <strong>${creatorName}</strong>.`;

        } else {
          // --- CASE D: ADMIN NOTICE (Draft -> Draft) ---
          subject = `📝 Mise à jour Rando (Brouillon) : ${record.title}`;
          title = "Randonnée Modifiée (Brouillon)";
          message = `<strong>${creatorName}</strong> a modifié le brouillon : "<strong>${record.title}</strong>".`;
        }

        detailsHtml = `
                    <div class="info-row"><span class="label">Titre :</span> <span class="value">${record.title}</span></div>
                    <div class="info-row"><span class="label">Statut :</span> <span class="value">${record.status} ${isNewPublication ? '(NOUVEAU)' : ''}</span></div>
                    <div class="info-row"><span class="label">Date :</span> <span class="value">${record.date || 'Non définie'}</span></div>
                    <div class="info-row"><span class="label">Lieu :</span> <span class="value">${record.location || '-'}</span></div>
                    <div class="info-row"><span class="label">Action :</span> <span class="value">${type}</span></div>
                    `;
      }
    }
    // ----------------------------------------------------
    // CASE 2: NEW PHOTO & CASE 3 DELETED (No changes needed, they use default admin target)
    // ----------------------------------------------------
    else if (table === "photos" && type === "INSERT") {
      // ... (Keep existing logic)
      subject = `📸 Nouvelle Photo ajoutée`;
      title = "Nouvelle Photo";

      // Fetch User
      let userName = "Un membre";
      if (record.user_id) {
        const { data: profile } = await supabase.from("profiles").select("first_name, last_name, display_name, email").eq("id", record.user_id).single();
        if (profile) userName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.display_name || profile.email;
      }

      // Fetch Hike
      let hikeTitle = "une randonnée";
      if (record.hike_id) {
        const { data: hike } = await supabase.from("hikes").select("title").eq("id", record.hike_id).single();
        if (hike) hikeTitle = hike.title;
      }

      message = `<strong>${userName}</strong> a ajouté une photo à la randonnée "<strong>${hikeTitle}</strong>".`;
      const photoUrl = `${siteUrl}/storage/v1/object/public/photos/${record.storage_path}`;

      detailsHtml = `
          <div class="info-row"><span class="label">Auteur :</span> <span class="value">${userName}</span></div>
          <div class="info-row"><span class="label">Rando :</span> <span class="value">${hikeTitle}</span></div>
          <div class="info-row"><span class="label">Image :</span> <a href="${siteUrl}/admin/photos" style="color:#2563eb">Modérer dans l'admin</a></div>
        `;
    }
    else if (table === "photos" && type === "DELETE") {
      subject = `🗑️ Photo supprimée`;
      title = "Photo Supprimée";

      // Fetch User (from old_record)
      let userName = "Un membre";
      if (old_record && old_record.user_id) {
        const { data: profile } = await supabase.from("profiles").select("first_name, last_name, display_name, email").eq("id", old_record.user_id).single();
        if (profile) userName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.display_name || profile.email;
      }

      // Fetch Hike (might create error if hike deleted? We handle null)
      let hikeTitle = "une randonnée";
      if (old_record && old_record.hike_id) {
        const { data: hike } = await supabase.from("hikes").select("title").eq("id", old_record.hike_id).single();
        if (hike) hikeTitle = hike.title;
      }

      message = `Une photo de <strong>${userName}</strong> sur la randonnée "<strong>${hikeTitle}</strong>" a été supprimée.`;
      detailsHtml = `
          <div class="info-row"><span class="label">Auteur :</span> <span class="value">${userName}</span></div>
          <div class="info-row"><span class="label">Rando :</span> <span class="value">${hikeTitle}</span></div>
        `;
    }
    else {
      return new Response("Skipped (unhandled event)", { status: 200 });
    }

    // ----------------------------------------------------
    // SEND EMAIL
    // ----------------------------------------------------

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { 
          background-image: url('${siteUrl}/panorama.jpg'); 
          background-size: cover; 
          background-position: center; 
          height: 160px; 
          position: relative; 
          background-color: #2563eb; 
        }
        .header-overlay { background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6)); position: absolute; inset: 0; }
        .header-text { position: absolute; bottom: 20px; left: 30px; color: white; font-size: 24px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .content { padding: 40px 30px; color: #333333; }
        .h1 { font-size: 20px; font-weight: 700; color: #1e293b; margin-top: 0; }
        .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin-bottom: 10px; font-size: 14px; }
        .label { color: #64748b; font-weight: 600; width: 80px; display: inline-block; }
        .value { color: #0f172a; font-weight: 500; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; margin-top: 10px; }
        .btn:visited { color: #ffffff !important; }
        .btn:hover { background-color: #1d4ed8; color: #ffffff !important; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-overlay"></div>
          <div class="header-text">Les Joyeux Marcheurs</div>
        </div>
        <div class="content">
          <p class="h1">${title}</p>
          <p style="color: #475569; line-height: 1.5;">
            ${message}
          </p>
          
          <div class="info-box">
             ${detailsHtml}
          </div>

          <div style="text-align: center;">
            <a href="${siteUrl}" class="btn">Voir sur le site</a>
          </div>
        </div>
        <div class="footer">
          Ceci est un message automatique.<br>
          © ${new Date().getFullYear()} Joyeux marcheurs de Châteauneuf-le-rouge<br>
          <span style="color: #cbd5e1; font-size: 10px;">ID: ${Date.now().toString(36)}</span>
        </div>
      </div>
    </body>
    </html>
    `;

    // Construct final payload
    const finalPayload = recipientsPayload ? {
      ...recipientsPayload,
      htmlContent: htmlContent // Inject content
    } : {
      sender: { name: "Les Joyeux Marcheurs", email: senderEmail },
      to: [{ email: adminEmail }],
      subject: subject,
      htmlContent: htmlContent,
    };

    // Send to Admin
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(finalPayload),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Brevo Error:", err);
      return new Response("Brevo Error", { status: 500 });
    }

    return new Response("Email sent", { status: 200 });

  } catch (err: any) {
    console.error("Critical Error", err);
    return new Response(err.message, { status: 500 });
  }
});
