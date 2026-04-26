/**
 * POST /api/decision-instruments/send-purchase-email
 *
 * Sends purchase confirmation email with interactive instrument link + PDF link.
 * Called after successful checkout.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { sendEmail } from "@/lib/email/core/sendEmail";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

const INSTRUMENT_NAMES: Record<string, string> = {
  "decision-exposure-instrument": "Decision Exposure Instrument",
  "mandate-clarity-framework": "Mandate Clarity Framework",
  "intervention-path-selector": "Intervention Path Selector",
  "operator-decision-pack": "Operator Decision Pack",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, slug } = req.body ?? {};
  if (!email || !slug) return res.status(400).json({ error: "Missing email or slug" });

  const name = INSTRUMENT_NAMES[slug] ?? slug;
  const runUrl = `${SITE_URL}/decision-instruments/${slug}/run`;
  const pdfUrl = slug === "operator-decision-pack"
    ? null
    : `${SITE_URL}/api/downloads/instrument-pdf?slug=${slug}`;

  const html = `
<div style="font-family: 'Georgia', serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #e0e0e0; background: #0a0a0f;">
  <div style="border-bottom: 1px solid rgba(201,169,110,0.2); padding-bottom: 16px; margin-bottom: 24px;">
    <span style="font-family: monospace; font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(201,169,110,0.6);">Purchase Confirmed</span>
  </div>
  <h1 style="font-size: 22px; font-weight: 300; color: #f5f5f5; margin: 0 0 16px;">Your ${name} is ready.</h1>
  <p style="font-size: 15px; line-height: 1.8; color: rgba(255,255,255,0.5);">
    Run the interactive instrument for live scoring and automatic result persistence.
  </p>
  <div style="margin: 24px 0;">
    <a href="${runUrl}" style="display: inline-block; padding: 14px 28px; border: 1px solid rgba(201,169,110,0.5); background: rgba(201,169,110,0.08); color: #C9A96E; font-family: monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none;">
      Start interactive instrument
    </a>
  </div>
  ${pdfUrl ? `<p style="font-size: 13px; color: rgba(255,255,255,0.3);">PDF worksheet: <a href="${pdfUrl}" style="color: rgba(201,169,110,0.5); text-decoration: underline;">Download</a></p>` : ""}
  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);">
    <p style="font-size: 13px; line-height: 1.7; color: rgba(255,255,255,0.3);">
      <strong>What to do next:</strong> Complete the instrument in one sitting. Your result will be saved automatically and feed into downstream analysis (Executive Reporting, Strategy Room).
    </p>
  </div>
  <div style="margin-top: 20px; font-family: monospace; font-size: 7px; color: rgba(255,255,255,0.12); letter-spacing: 0.15em; text-transform: uppercase;">
    Abraham of London · Decision Intelligence · info@abrahamoflondon.org
  </div>
</div>`.trim();

  const text = `Your ${name} is ready.\n\nStart: ${runUrl}\n${pdfUrl ? `PDF: ${pdfUrl}\n` : ""}Complete the instrument in one sitting. Result saves automatically.\n\nAbraham of London · info@abrahamoflondon.org`;

  try {
    const result = await sendEmail({
      type: "TRANSACTIONAL",
      to: email,
      subject: `Your ${name} is ready`,
      html,
      text,
      meta: { source: "instrument-purchase", journeyId: slug },
    });

    if (!result.ok) {
      console.error(`[instrument-email] Failed for ${email}:`, result.error);
      return res.status(200).json({ ok: false, error: result.error });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[instrument-email] Error:", error);
    return res.status(200).json({ ok: false, error: "Email send failed" });
  }
}
