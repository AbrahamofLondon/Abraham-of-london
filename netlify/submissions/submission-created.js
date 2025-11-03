import { Resend } from "resend";

export const handler = async (event) => {
  try {
    const payload = JSON.parse(event.body || "{}");

    // Only handle your contact form
    const formName =
      payload.form_name || payload.payload?.form_name || payload.data?.form_name;
    if (formName !== "contact-form") {
      return { statusCode: 200, body: "Ignored (not contact-form)" };
     }

    // Field data
    const data = payload.payload?.data || payload.data || {};
    const name = data.name || "";
    const email = data.email || "";
    const subject = data.subject || `New contact from ${name || email}`;
    const message = data.message || "";

    // Resend client (API key from env)
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Build a simple HTML summary
    const html = `
      <h2>New contact submission</h2>
      <p><strong>Name:</strong> ${name || "(none)"}</p>
      <p><strong>Email:</strong> ${email || "(none)"} </p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:system-ui,Segoe UI,Arial">${String(message).trim()}</pre>
    `;

    await resend.emails.send({
      from: process.env.MAIL_FROM,           // e.g. "Abraham of London <no-reply@abrahamoflondon.org>"
      to: process.env.MAIL_TO,               // e.g. "info@abrahamoflondon.org"
      reply_to: email || undefined,
      subject,
      html,
    });

    return { statusCode: 200, body: "Mail sent" };
  } catch (err) {
    console.error("submission-created error:", err);
    return { statusCode: 500, body: "Error" };
  }
