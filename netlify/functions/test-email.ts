// netlify/functions/test-email.ts
import type { Handler } from "@netlify/functions";
import { Resend } from "resend";

const bool = (v?: string) => Boolean(v && v.trim().length > 0);

export const handler: Handler = async (event) => {
  try {
    // Health probe
    const isHealth = event.httpMethod === "GET" && /(^|[?&])health=1($|&)/.test(event.rawQuery || "");
    const resendKey = process.env.RESEND_API_KEY || "";
    const FROM = process.env.MAIL_FROM || "";
    const TO = process.env.MAIL_TO || "";
    const GUARD = process.env.EMAIL_TASK_TOKEN || "";

    if (isHealth) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          ok: true,
          env: {
            RESEND_API_KEY: bool(resendKey),
            MAIL_FROM: bool(FROM),
            MAIL_TO: bool(TO),
            EMAIL_TASK_TOKEN: bool(GUARD),
          },
        }),
      };
    }

    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    if (GUARD) {
      const header = event.headers["x-task-token"] || event.headers["X-Task-Token"];
      if (!header || header !== GUARD) return { statusCode: 401, body: "Unauthorized" };
    }

    if (!resendKey || !FROM || !TO) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ ok: false, error: "Missing RESEND_API_KEY, MAIL_FROM or MAIL_TO" }),
      };
    }

    const payload = event.body ? JSON.parse(event.body) : {};
    const subject = String(payload.subject || "Resend smoke test");
    const text = String(payload.text || "If you see this, the Resend setup works.");
    const html =
      payload.html ||
      `<p style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
         If you see this, the Resend setup works.<br/>
         <small>Sent from Netlify Function “test-email”.</small>
       </p>`;

    const resend = new Resend(resendKey);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [TO],
      subject,
      text,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ ok: false, error }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok: true, id: data?.id || null }),
    };
  } catch (err: any) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok: false, error: { message: err?.message || "Unknown error" } }),
    };
  }
