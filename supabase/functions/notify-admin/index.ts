import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "no-reply@nazarian.ovh";
const resendFromName = Deno.env.get("RESEND_FROM_NAME") || "Les Joyeux Marcheurs";
const siteUrl = Deno.env.get("SITE_URL")?.replace(/\/$/, "") ?? "http://localhost:5173";
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    const payload = await req.json();
    const record = payload.record;
    const oldRecord = payload.old_record;

    if (!record || !record.email) return new Response("No user record", { status: 400 });

    // CHECK: Only send if profile became completed
    const wasCompleted = oldRecord?.is_profile_completed === true;
    const isCompleted = record.is_profile_completed === true;

    if (!isCompleted) return new Response("Skipped (Not completed)", { status: 200 });
    if (wasCompleted && isCompleted) return new Response("Skipped (Already completed)", { status: 200 });

    if (!resendApiKey) {
      console.error("Config Error: RESEND_API_KEY missing");
      return new Response("Config Error: RESEND_API_KEY missing", { status: 500 });
    }

    if (!supabase) {
      console.error("Config Error: Supabase credentials missing");
      return new Response("Config Error: DB access required", { status: 500 });
    }

    // Dynamic Admin Fetching
    const { data: admins, error: adminError } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "admin")
      .not("email", "is", null);

    if (adminError || !admins || admins.length === 0) {
      console.error("Error fetching admins or no admins found:", adminError);
      return new Response("No admins found to notify", { status: 500 });
    }

    const adminEmails = admins.map(a => a.email);
    console.log(`Notifying ${adminEmails.length} admins: ${adminEmails.join(", ")}`);

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
          <div class="header-text">Les Joyeux Marcheurs de Châteauneuf-le-Rouge</div>
        </div>
        <div class="content">
          <p class="h1">Nouvelle Adhésion à Valider</p>
          <p style="color: #475569; line-height: 1.5;">
            Le profil de <strong>${record.display_name || 'Utilisateur'}</strong> a été complété par l'utilisateur.<br>
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
          © ${new Date().getFullYear()} Les Joyeux Marcheurs de Châteauneuf-le-rouge<br>
          <span style="color: #cbd5e1; font-size: 10px;">ID: ${Date.now().toString(36)}</span>
        </div>
      </div>
    </body>
    </html>
    `;

    // Resend API Call
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${resendFromName} <${resendFromEmail}>`,
        to: adminEmails,
        subject: `✅ Profil complété : ${record.display_name || record.email}`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API Error:", error);
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    const data = await res.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Function Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});