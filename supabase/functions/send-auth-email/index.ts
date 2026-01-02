import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "no-reply@nazarian.ovh";
const resendFromName = Deno.env.get("RESEND_FROM_NAME") || "Les Joyeux Marcheurs";
const siteUrl = Deno.env.get("SITE_URL")?.replace(/\/$/, "") ?? "http://localhost:5173";
const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");

serve(async (req) => {
  // 1. Basic Security Check
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    console.log("📨 Received Auth Webhook Payload:", JSON.stringify(payload));

    const { user, email_data } = payload;

    // Validate payload structure
    if (!user || !user.email || !email_data) {
      console.error("Missing user or email_data in payload");
      return new Response("Invalid payload", { status: 400 });
    }

    const { token, token_hash, redirect_to, email_action_type } = email_data;

    // 2. Construct Action URL
    // Use 'email_action_type' from payload
    const actionType = email_action_type || "magiclink";

    const emailParams = new URLSearchParams({
      token: token_hash, // Supabase /verify endpoint expects 'token' param (containing the hash)
      type: actionType,
      redirect_to: redirect_to || siteUrl,
    });

    // Construct the verification URL pointing to Supabase Auth API
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?${emailParams.toString()}`;

    // 3. Customize Content based on Email Type
    let subject = "Connexion aux Joyeux Marcheurs";
    let title = "Connexion à l'espace membre";
    let message = "Vous avez demandé à vous connecter aux Joyeux Marcheurs. Cliquez sur le bouton ci-dessous pour accéder directement à votre compte.";
    let buttonText = "Me Connecter";

    switch (actionType) {
      case "signup":
        subject = "Confirmez votre inscription 🥾";
        title = "Bienvenue chez les Joyeux Marcheurs !";
        message = "Merci de vous être inscrit. Pour valider votre compte et rejoindre l'aventure, veuillez confirmer votre adresse email en cliquant ci-dessous.";
        buttonText = "Confirmer mon inscription";
        break;
      case "recovery":
        subject = "Réinitialisation de mot de passe 🔒";
        title = "Mot de passe oublié ?";
        message = "Une demande de réinitialisation de mot de passe a été effectuée pour votre compte. Si c'est bien vous, cliquez ci-dessous pour créer un nouveau mot de passe.";
        buttonText = "Réinitialiser le mot de passe";
        break;
      case "magiclink":
      case "magic_link":
        subject = "Votre lien de connexion ✨";
        title = "Connexion rapide";
        message = "Vous avez demandé à vous connecter sans mot de passe. Cliquez sur le bouton pour accéder directement à l'espace membre.";
        buttonText = "Me Connecter";
        break;
      case "email_change":
        subject = "Confirmation de changement d'email 📧";
        title = "Changement d'adresse email";
        message = "Vous avez demandé à changer votre adresse email. Veuillez confirmer ce changement en cliquant ci-dessous.";
        buttonText = "Confirmer le changement";
        break;
      case "invite":
        subject = "Invitation à rejoindre les Joyeux Marcheurs 👋";
        title = "Vous êtes invité !";
        message = "Un administrateur vous a invité à rejoindre l'espace membre des Joyeux Marcheurs. Créez votre compte en cliquant ci-dessous.";
        buttonText = "Accepter l'invitation";
        break;
    }

    // 4. Build HTML using the User's Template
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { 
      background-image: url('${siteUrl}/panorama.jpg');
      background-size: cover;
      background-position: center;
      height: 160px;
      position: relative;
      background-color: #2563eb;
    }
    .header-overlay { background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6)); position: absolute; inset: 0; }
    .header-text { position: absolute; bottom: 20px; left: 30px; color: white; font-size: 24px; font-weight: bold; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); }
    .content { padding: 40px 30px; color: #333333; }
    .h1 { font-size: 20px; font-weight: 700; color: #1e293b; margin-top: 0; }
    .text { color: #475569; line-height: 1.6; margin-bottom: 24px; }
    .code-box { background: #f1f5f9; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 24px; letter-spacing: 5px; text-align: center; color: #0f172a; margin: 20px 0; font-weight: bold; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; }
    .btn:visited { color: #ffffff !important; }
    .btn:hover { background-color: #1d4ed8; color: #ffffff !important; }
    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
    .link { color: #2563eb; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-text">Les Joyeux Marcheurs de Châteauneuf-le-Rouge</div>
    </div>
    <div class="content">
      <p class="h1">${title}</p>
      <p class="text">
        ${message}
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${confirmationUrl}" class="btn">${buttonText}</a>
      </div>
      
      <!-- Only show Token Code if it's strictly numbers (OTP) usually, but hook sends token_hash mostly. 
           The user template showed a token code box. 
           If the token is a short code (OTP), show it. If it's a long hash, it's not useful as a code. 
           Supabase 'token' field in hook is usually the OTP if enabled, or the link token.
           We'll verify string length to decide if it's an OTP code to display. -->
      ${token && token.length <= 8 ? `
      <p class="text" style="text-align: center; font-size: 14px;">
        Ou utilisez ce code de vérification si demandé :
      </p>
      <div class="code-box">${token}</div>
      ` : ''}

      <p class="text" style="font-size: 13px; color: #94a3b8; margin-top: 30px;">
        Si le bouton ne fonctionne pas, copiez ce lien :<br>
        <span class="link">${confirmationUrl}</span>
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Les Joyeux Marcheurs de Châteauneuf-le-rouge<br>
      Ce lien est valide pour une courte durée. Ne le partagez pas.
    </div>
  </div>
</body>
</html>`;

    // 5. Send Email via Resend
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set");
      return new Response("Server Configuration Error", { status: 500 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${resendFromName} <${resendFromEmail}>`,
        to: [user.email],
        subject: subject,
        html: html,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Email sent successfully:", data);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const error = await res.text();
      console.error("Resend API Error:", error);
      return new Response(error, { status: 400 });
    }

  } catch (err: any) {
    console.error("Function Error:", err.message);
    return new Response(err.message, { status: 500 });
  }
});
