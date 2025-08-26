import type { NextApiRequest, NextApiResponse } from "next";

type Ok = { ok: true; message: string };
type Err = { ok: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? safeParse(req.body) : (req.body || {});
    const name = String((body as any).name || "").trim().slice(0, 100);
    const email = String((body as any).email || "").trim().toLowerCase();
    const subject = String((body as any).subject || "Website contact").trim().slice(0, 120);
    const message = String((body as any).message || "").trim();
    const honeypot = String((body as any)["bot-field"] || (body as any).botField || "").trim();

    if (honeypot) return res.status(200).json({ ok: true, message: "Message sent successfully!" });

    if (!email || !message) return res.status(400).json({ ok: false, message: "Required: email, message" });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, message: "Invalid email format" });
    if (message.length < 5) return res.status(400).json({ ok: false, message: "Message is too short" });

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

      if (!apiKey) return res.status(500).json({ ok: false, message: "Email provider not configured" });

      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:16px;line-height:1.5;color:#111">
          <h2>New website inquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(name || "—")}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p><strong>Message:</strong></p>
          <pre style="white-space:pre-wrap">${escapeHtml(message)}</pre>
        </div>`.trim();

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
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
        console.error("[contact] Resend send failed with status:", r.status);
        return res.status(502).json({ ok: false, message: "Email provider error" });
      }
    }

    return res.status(200).json({ ok: true, message: "Message sent successfully!" });
  } catch {
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}

function escapeHtml(str: string) {
  return String(str).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as const)[m] || m
  );
}
