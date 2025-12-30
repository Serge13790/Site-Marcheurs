import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const adminEmail = Deno.env.get("ADMIN_EMAIL")?.trim();
const siteUrl = Deno.env.get("SITE_URL")?.replace(/\/$/, "") ?? "http://localhost:5173";

serve(async (req) => {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const payload = await req.json();
        const record = payload.record;
        const oldRecord = payload.old_record;

        if (!record || !record.email) return new Response("No user record", { status: 400 });

        // Logic: Only send if profile became completed
        const wasCompleted = oldRecord?.is_profile_completed === true;
        const isCompleted = record.is_profile_completed === true;

        if (!isCompleted || (wasCompleted && isCompleted)) {
            return new Response("Skipped", { status: 200 });
        }

        if (!adminEmail) return new Response("Config Error", { status: 500 });

        // Premium Template
        const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nouvelle Adhésion à Valider</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { 
          background-image: url('${siteUrl}/panorama.jpg'); 
          background-size: cover; 
          background-position: center; 
          height: 160px; 
          position: relative; 
        }
        .header-overlay { background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6)); position: absolute; inset: 0; }
        .header-text { position: absolute; bottom: 20px; left: 30px; color: white; font-size: 24px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .content { padding: 40px 30px; color: #333333; }
        .h1 { font-size: 20px; font-weight: 700; color: #1e293b; margin-top: 0; }
        .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin-bottom: 10px; font-size: 14px; }
        .label { color: #64748b; font-weight: 600; width: 80px; display: inline-block; }
        .value { color: #0f172a; font-weight: 500; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; margin-top: 10px; }
        .btn:hover { background-color: #1d4ed8; }
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
          <p class="h1">Nouvelle Adhésion à Valider</p>
          <p style="color: #475569; line-height: 1.5;">
            Le profil de <strong>${record.display_name || 'Utilisateur'}</strong> a été complété avec succès.<br>
            Il est en attente de votre validation pour accéder à l'espace membre.
          </p>
          
          <div class="info-box">
             <div class="info-row"><span class="label">Email :</span> <span class="value">${record.email}</span></div>
             <div class="info-row"><span class="label">Nom :</span> <span class="value">${record.last_name || '-'} ${record.first_name || '-'}</span></div>
             <div class="info-row"><span class="label">Ville :</span> <span class="value">${record.city || '-'}</span></div>
             <div class="info-row"><span class="label">Mobile :</span> <span class="value">${record.phone_mobile || '-'}</span></div>
          </div>

          <div style="text-align: center;">
            <a href="${siteUrl}/admin/users" class="btn">Gérer les Utilisateurs</a>
          </div>
        </div>
        <div class="footer">
          Ceci est un message automatique envoyé par votre application.<br>
          © ${new Date().getFullYear()} Joyeux marcheurs de Châteauneuf-le-rouge
        </div>
      </div>
    </body>
    </html>
    `;

        const { data, error } = await resend.emails.send({
            from: "Les Marcheurs Notification <onboarding@resend.dev>",
            to: [adminEmail],
            subject: `✅ Profil complété : ${record.display_name || record.email}`,
            html: htmlContent,
        });

        if (error) throw error;

        return new Response(JSON.stringify({ message: "Email sent", data }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        console.error("Function Error:", err);
        // Return 200 to avoid retrying loop on Supabase side if it's a logic/template error
        return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
});
