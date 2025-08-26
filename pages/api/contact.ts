// pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from "next";

type Ok = { ok: true; message: string };
type Err = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = String(body.name ?? "").trim().slice(0, 100);
    const email = String(body.email ?? "").trim().toLowerCase();
    const subject = String(body.subject ?? "Website contact").trim().slice(0, 120);
    const message = String(body.message ?? "").trim();
    const honeypot = String((body as any)["bot-field"] ?? (body as any).botField ?? "").trim();

    // Honeypot → pretend success
    if (honeypot) {
      return res.status(200).json({ ok: true, message: "Message sent successfully!" });
    }

    // Basic validation
    if (!email || !message) {
      return res.status(400).json({ ok: false, error: "Required: email, message" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: "Invalid email format" });
    }
    if (message.length < 5) {
      return res.status(400).json({ ok: false, error: "Message is too short" });
    }

    // Minimal masked dev log
    if (process.env.NODE_ENV !== "production") {
      const maskedEmail = email.replace(/^(.).+(@.*)$/, "$1***$2");
      // eslint-disable-next-line no-console
      console.log("[contact] submission:", {
        name: name || "—",
        email: maskedEmail,
        subject,
        messageLength: message.length,
      });
    }

    // Optional Resend
    if ((process.env.CONTACT_PROVIDER || "").toLowerCase() === "resend") {
      const apiKey = process.env.RESEND_API_KEY;
      const to = process.env.MAIL_TO || "info@abrahamoflondon.org";
      const from = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";

      if (!apiKey) {
        return res.status(500).json({ ok: false, error: "Email provider not configured" });
      }

      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:16px;line-height:1.5;color:#111">
          <h2>New website inquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(name || "—")}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p><strong>Message:</strong></p>
          <pre style="white-space:pre-wrap">${escapeHtml(message)}</pre>
        </div>
      `.trim();

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
        // eslint-disable-next-line no-console
        console.error("[contact] Resend send failed with status:", r.status);
        return res.status(502).json({ ok: false, error: "Email provider error" });
      }
    }

    return res.status(200).json({ ok: true, message: "Message sent successfully!" });
  } catch {
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}

function escapeHtml(str: string) {
  return String(str).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m] as string)
  );
}
