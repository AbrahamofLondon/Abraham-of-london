import type { NextApiRequest, NextApiResponse } from "next";

type Ok = { ok: true; message: string };
type Err = { ok: false; error: string };

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function esc(s: string) {
  return String(s).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!)
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    // Next’s body parser handles JSON & urlencoded by default
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = String(body.name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase();
    const subject = String(body.subject || "Website contact").trim().slice(0, 120);
    const message = String(body.message || "").trim();
    const honeypot = String((body as any)["bot-field"] || (body as any).botField || "").trim();

    // Honeypot: silently succeed if bots fill it
    if (honeypot) return res.status(200).json({ ok: true, message: "Message received." });

    // Validation
    if (!email || !message) return res.status(400).json({ ok: false, error: "Required: email and message." });
    if (!isEmail(email))   return res.status(400).json({ ok: false, error: "Invalid email format." });
    if (message.length < 10) return res.status(400).json({ ok: false, error: "Message too short." });

    if (process.env.NODE_ENV !== "production") {
      const masked = email.replace(/^(.).+(@.*)$/, "$1***$2");
      console.log("[contact] name=%s email=%s len=%d", name || "—", masked, message.length);
    }

    // Optional provider: Resend
    if ((process.env.CONTACT_PROVIDER || "").toLowerCase() === "resend") {
      const apiKey = process.env.RESEND_API_KEY || "";
      const to = process.env.MAIL_TO || "info@abrahamoflondon.org";
      const from = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";
      if (!apiKey) return res.status(500).json({ ok: false, error: "Email provider not configured." });

      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:16px;line-height:1.5;color:#111">
          <h2>New website inquiry</h2>
          <p><strong>Name:</strong> ${esc(name || "—")}</p>
          <p><strong>Email:</strong> ${esc(email)}</p>
          <p><strong>Subject:</strong> ${esc(subject)}</p>
          <p><strong>Message:</strong></p>
          <pre style="white-space:pre-wrap">${esc(message)}</pre>
        </div>
      `.trim();

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
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

      // Resend returns JSON with error details on 4xx/5xx
      if (!r.ok) {
        let detail = "";
        try { detail = (await r.json())?.error?.message || ""; } catch {}
        console.error("[contact] Resend failed %s %s", r.status, detail);
        return res.status(502).json({ ok: false, error: "Email provider error." });
      }
    }

    return res.status(200).json({ ok: true, message: "Message sent successfully!" });
  } catch (e) {
    console.error("[contact] unexpected error", e);
    return res.status(500).json({ ok: false, error: "Internal Server Error." });
  }
}
