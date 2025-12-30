import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const brevoApiKey = Deno.env.get("BREVO_API_KEY")?.trim();
const adminEmail = Deno.env.get("ADMIN_EMAIL")?.trim();
const senderEmail = Deno.env.get("SENDER_EMAIL")?.trim() || adminEmail;
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

        // CHECK: Only send if approved changed from false to true
        const wasApproved = oldRecord?.approved === true;
        const isApproved = record.approved === true;

        console.log(`Approval Check: Old=${oldRecord?.approved}, New=${record.approved}, User=${record.email}`);

        if (!isApproved) {
            return new Response("Skipped (Not approved)", { status: 200 });
        }

        if (wasApproved && isApproved) {
            return new Response("Skipped (Already approved)", { status: 200 });
        }

        if (!brevoApiKey) return new Response("Config Error: BREVO_API_KEY missing", { status: 500 });

        const fullName = [record.first_name, record.last_name].filter(Boolean).join(" ");
        const displayName = fullName || record.display_name || record.email;

        const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Votre compte est validé !</title>
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
        .text { color: #475569; line-height: 1.6; margin-bottom: 24px; }
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
          <p class="h1">Félicitations ${displayName} !</p>
          <p class="text">
            Votre compte a été validé par un administrateur.<br>
            Vous pouvez dès maintenant accéder à l'espace membre et vous inscrire aux prochaines randonnées.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}" class="btn">Accéder au site</a>
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
                to: [{ email: record.email }],
                subject: `🎉 Compte validé : Bienvenue chez les Joyeux Marcheurs !`,
                htmlContent: htmlContent,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Brevo Error:", errorData);
            return new Response(JSON.stringify({ error: errorData }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        const data = await response.json();
        console.log("Approval Email Sent:", data);

        return new Response(JSON.stringify({ message: "Email sent", data }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("Function Error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
});
