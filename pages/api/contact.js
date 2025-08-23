// pages/api/contact.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};
    const name = String(body.name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase();
    const subject = String(body.subject || "Website contact").trim().slice(0, 120);
    const message = String(body.message || "").trim();
    const honeypot = String(body["bot-field"] || body.botField || "").trim();

    // Honeypot: pretend success if a bot fills it
    if (honeypot) {
      return res.status(200).json({ ok: true, message: "Message sent successfully!" });
    }

    if (!email || !message) {
      return res.status(400).json({ message: "Required: email, message" });
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (message.length < 5) {
      return res.status(400).json({ message: "Message is too short" });
    }

    // Default: log (useful in dev or if no provider configured)
    const payload = { name, email, subject, messageLength: message.length };
    console.log("[contact] submission:", payload);

    // Optional: send via Resend if configured
    const provider = process.env.CONTACT_PROVIDER || "none";
    if (provider === "resend" && process.env.RESEND_API_KEY) {
      const to = process.env.MAIL_TO || "info@abrahamoflondon.org";
      const from = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";

      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:16px;line-height:1.5;color:#111">
          <h2>New website inquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(name || "—")}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p><strong>Message:</strong></p>
          <pre style="white-space:pre-wrap">${escapeHtml(message)}</pre>
        </div>`;

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          subject: `New contact: ${name || "Anonymous"}`,
          html,
          reply_to: [{ email, name: name || email }],
        }),
      });

      if (!r.ok) {
        const txt = await r.text();
        console.error("[contact] Resend error:", r.status, txt);
        return res.status(502).json({ message: "Email provider error" });
      }
    }

    return res.status(200).json({ ok: true, message: "Message sent successfully!" });
  } catch (err) {
    console.error("Contact API error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

// Simple HTML escaper to avoid HTML injection in emailed content
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));
}
