/**
 * POST /api/tools/send-to-self
 *
 * Sends a one-off email containing the user's diagnostic or calculator result.
 * This is a send-to-self bridge for users who do not want to create an account.
 *
 * Principles:
 * - Does not create a governed case or account
 * - Does not subscribe the user to marketing
 * - Does not store the email beyond the send transaction (unless already captured)
 * - Rate limited: max 3 sends per IP per hour
 * - Only sends non-sensitive summary content
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { sendAppEmail } from "@/lib/server/email";
import { consumePersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";
import { writeSecurityAudit } from "@/lib/security/audit-log";
import { createHash } from "crypto";

const schema = z.object({
  email: z.string().trim().email().max(320),
  source: z.enum(["decision_delay_calculator", "fast_diagnostic"]),
  content: z.object({
    title: z.string().trim().max(200).optional().default(""),
    summary: z.string().trim().max(2000).optional().default(""),
    nextMove: z.string().trim().max(500).optional().default(""),
    exposureSummary: z.string().trim().max(1000).optional().default(""),
  }),
}).strict();

const MAX_PER_WINDOW = 3;
const WINDOW_MS = 60 * 60 * 1000;

function getIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  return (Array.isArray(xf) ? xf[0] : xf)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "0.0.0.0";
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const contentType = String(req.headers["content-type"] || "");
  if (!/application\/json/i.test(contentType)) {
    return res.status(415).json({ ok: false, error: "UNSUPPORTED_MEDIA_TYPE" });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid request", details: parsed.error.flatten() });
  }

  try {
    const ip = getIp(req);
    const rateLimitKey = [
      "send-to-self",
      `ip:${sha256Hex(ip).slice(0, 16)}`,
      `email:${sha256Hex(parsed.data.email.trim().toLowerCase()).slice(0, 16)}`,
    ].join(":");

    const rateLimit = await consumePersistentRateLimit({
      key: rateLimitKey,
      limit: MAX_PER_WINDOW,
      windowMs: WINDOW_MS,
      failClosed: true,
    });

    if (!rateLimit.allowed) {
      await writeSecurityAudit({
        action: "send_to_self_rate_limited",
        severity: "warn",
        status: "BLOCKED",
        ip,
        resourceId: "/api/tools/send-to-self",
      });
      return res.status(429).json({ ok: false, error: "Too many requests. Try again later." });
    }

    const { email, source, content } = parsed.data;
    const sourceLabel = source === "decision_delay_calculator"
      ? "Decision Delay Exposure Calculator"
      : "Fast Diagnostic";

    const subject = `Your ${sourceLabel} result — Abraham of London`;

    const html = [
      `<!DOCTYPE html><html><body style="font-family: Georgia, serif; background: #030305; color: #EAEAEA; padding: 32px; max-width: 560px; margin: 0 auto;">`,
      `<h1 style="font-size: 20px; font-weight: 400; color: #C9A96E; margin-bottom: 16px;">${sourceLabel}</h1>`,
      content.title ? `<p style="font-size: 16px; line-height: 1.6; margin-bottom: 12px; color: #EAEAEA;"><strong>${content.title}</strong></p>` : "",
      content.summary ? `<p style="font-size: 14px; line-height: 1.6; margin-bottom: 12px; color: rgba(255,255,255,0.65);">${content.summary}</p>` : "",
      content.exposureSummary ? `<p style="font-size: 14px; line-height: 1.6; margin-bottom: 12px; color: rgba(255,255,255,0.65);">${content.exposureSummary}</p>` : "",
      content.nextMove ? `<div style="border-left: 2px solid #C9A96E; padding-left: 14px; margin: 16px 0;"><p style="font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.75);"><strong>Next move:</strong> ${content.nextMove}</p></div>` : "",
      `<hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;" />`,
      `<p style="font-size: 12px; line-height: 1.6; color: rgba(255,255,255,0.30);">`,
      `This result was sent at your request. It does not create a governed case or account. `,
      `To carry this forward, run the <a href="https://abrahamoflondon.org/diagnostics/fast" style="color: #C9A96E;">Fast Diagnostic</a> or create an account to save it in <a href="https://abrahamoflondon.org/decision-centre" style="color: #C9A96E;">Decision Centre</a>.`,
      `</p>`,
      `<p style="font-size: 11px; line-height: 1.5; color: rgba(255,255,255,0.18); margin-top: 16px;">`,
      `Abraham of London · Governed Decision Infrastructure`,
      `</p>`,
      `</body></html>`,
    ].join("\n");

    const text = [
      `${sourceLabel}`,
      ``,
      content.title ? `${content.title}` : "",
      ``,
      content.summary || "",
      content.exposureSummary || "",
      content.nextMove ? `Next move: ${content.nextMove}` : "",
      ``,
      `---`,
      `This result was sent at your request. It does not create a governed case or account.`,
      `To carry this forward, run the Fast Diagnostic at https://abrahamoflondon.org/diagnostics/fast`,
      `or create an account to save it in Decision Centre at https://abrahamoflondon.org/decision-centre`,
      ``,
      `Abraham of London · Governed Decision Infrastructure`,
    ].filter(Boolean).join("\n");

    const result = await sendAppEmail({
      to: email,
      subject,
      html,
      text,
    });

    if (!result.success) {
      console.error("[send-to-self] Email delivery failed:", result.error);
      await writeSecurityAudit({
        action: "send_to_self_failed",
        severity: "warn",
        status: "FAILED",
        ip,
        resourceId: "/api/tools/send-to-self",
        metadata: { source, error: result.error },
      });
      return res.status(500).json({ ok: false, error: "Email could not be sent. Try again later." });
    }

    await writeSecurityAudit({
      action: "send_to_self_sent",
      severity: "info",
      status: "SUCCESS",
      ip,
      resourceId: "/api/tools/send-to-self",
      metadata: { source },
    });

    return res.status(200).json({ ok: true, sent: true });
  } catch (error) {
    console.error("[send-to-self]", error);
    return res.status(500).json({ ok: false, error: "Send failed" });
  }
}
