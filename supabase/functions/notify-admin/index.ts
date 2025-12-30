import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const brevoApiKey = Deno.env.get("BREVO_API_KEY")?.trim();
const adminEmail = Deno.env.get("ADMIN_EMAIL")?.trim();
const siteUrl = Deno.env.get("SITE_URL")?.replace(/\/$/, "") ?? "http://localhost:5173";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // Debug: Check config (without leaking full key)
    console.log("Config Check:");
    console.log("Admin Email:", adminEmail);
    console.log("Brevo Key Length:", brevoApiKey?.length);
    console.log("Brevo Key Start:", brevoApiKey?.substring(0, 5));

    const payload = await req.json();
    const record = payload.record;
    const oldRecord = payload.old_record;

    if (!record || !record.email) return new Response("No user record", { status: 400 });

    // CHECK: Only send if profile became completed
    const wasCompleted = oldRecord?.is_profile_completed === true;
    const isCompleted = record.is_profile_completed === true;

    console.log(`Status Check: Old=${oldRecord?.is_profile_completed}, New=${record.is_profile_completed}`);

    if (!isCompleted) {
      console.log("Skipped: Profile not completed.");
      return new Response("Skipped (Not completed)", { status: 200 });
    }

    if (wasCompleted && isCompleted) {
      console.log("Skipped: Profile ALREADY completed.");
      return new Response("Skipped (Already completed)", { status: 200 });
    }

    if (!adminEmail) {
      console.error("Config Error: ADMIN_EMAIL missing");
      return new Response("Config Error: ADMIN_EMAIL missing", { status: 500 });
    }

    const fullName = [record.first_name, record.last_name].filter(Boolean).join(" ");
    const displayName = fullName || record.display_name || record.email;

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
          <p class="h1">Nouvelle Adhésion à Valider</p>
          <p style="color: #475569; line-height: 1.5;">
            Le profil de <strong>${displayName}</strong> a complété son profil.<br>
            Il attend votre validation.
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
          Ceci est un message automatique.<br>
          © ${new Date().getFullYear()} Joyeux marcheurs de Châteauneuf-le-rouge<br>
          <span style="color: #cbd5e1; font-size: 10px;">ID: ${Date.now().toString(36)}</span>
        </div>
      </div>
    </body>
    </html>
    `;

    // Use SENDER_EMAIL if set, otherwise default to ADMIN_EMAIL (which is likely verified)
    const senderEmail = Deno.env.get("SENDER_EMAIL") || adminEmail;

    // Call Brevo API
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Les Joyeux Marcheurs", email: senderEmail },
        to: [{ email: adminEmail }],
        subject: `✅ Profil complété : ${displayName}`,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo Error:", errorData);
      return new Response(JSON.stringify({ error: errorData }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("Email Sent Successfully:", data);
    return new Response(JSON.stringify({ message: "Email sent", data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Function Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
