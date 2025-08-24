// pages/api/contact.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const body = (req.body ?? {});
    const name = String(body.name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase();
    const subject = String(body.subject || "Website contact").trim().slice(0, 120);
    const message = String(body.message || "").trim();
    const honeypot = String(body["bot-field"] || body.botField || "").trim();

    // Honeypot: quietly succeed if a bot fills it
    if (honeypot) {
      return res.status(200).json({ ok: true, message: "Message sent successfully!" });
    }

    // Basic validation
    if (!email || !message) {
      return res.status(400).json({ message: "Required: email, message" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (message.length < 5) {
      return res.status(400).json({ message: "Message is too short" });
    }

    // Minimal masked dev log (never log secrets)
    if (process.env.NODE_ENV !== "production") {
      const maskedEmail = email.replace(/^(.).+(@.*)$/, "$1***$2");
      console.log("[contact] submission:", {
        name: name || "—",
        email: maskedEmail,
        subject,
        messageLength: message.length,
      });
    }

    // Optional: send via Resend if configured
    if ((process.env.CONTACT_PROVIDER || "").toLowerCase() === "resend") {
      const apiKey = process.env.RESEND_API_KEY;
      const to = process.env.MAIL_TO || "info@abrahamoflondon.org";
      const from = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";

      if (!apiKey) {
        return res.status(500).json({ message: "Email provider not configured" });
      }

      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:16px;line-height:1.5;color:#111">
          <h2>New website inquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(name || "—")}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p><strong>Message:</strong></p>
          <pre style="white-space:pre-wrap">${escapeHtml(message)}</pre>
        </div>`.trim();

      // Build headers without ever logging them
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.set("Authorization", `Bearer ${apiKey}`);

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers,
        body: JSON.stringify({
          from,
          to,
          subject: `New contact: ${name || "Anonymous"}`,
          html,
          // Resend supports reply_to (array or string). Use array to include name.
          reply_to: [{ email, name: name || email }],
        }),
      });

      if (!r.ok) {
        // Don’t echo secrets; keep the message generic
        console.error("[contact] Resend send failed with status:", r.status);
        return res.status(502).json({ message: "Email provider error" });
      }
    }

    return res.status(200).json({ ok: true, message: "Message sent successfully!" });
  } catch {
    // Never include request/secret details in errors
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

// Basic HTML escaping for email body
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));
}
