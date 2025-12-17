import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  combinedRateLimit, 
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
  getClientIp 
} from '@/lib/server/rateLimit';
import { getMemberByEmail, getActiveKeysForMember } from '@/lib/server/innerCircleStore';
import { sendInnerCircleEmail } from '@/lib/inner-circle'; // Unified email dispatcher

type ResponseData = {
  ok: boolean;
  message?: string;
  error?: string;
};

/**
 * THE RESEND ENGINE - Unified Production Version
 * Hardened for security-first recovery and institutional reliability.
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ResponseData>
) {
  // 1. Method Authority
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method requires POST for secure dispatch.' });
  }

  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ ok: false, error: 'Identity (email) is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Multi-Layer Rate Limiting
    // Protects the SMTP server and prevents email enumeration or flooding.
    const rateLimitResult = combinedRateLimit(
      req,
      normalizedEmail,
      'inner-circle-resend',
      RATE_LIMIT_CONFIGS.INNER_CIRCLE_RESEND,
      RATE_LIMIT_CONFIGS.INNER_CIRCLE_RESEND_EMAIL
    );

    // Apply Rate Limit Headers regardless of result for transparency
    const headers = createRateLimitHeaders(rateLimitResult.ipResult);
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));

    if (!rateLimitResult.allowed) {
      return res.status(429).json({ 
        ok: false, 
        error: 'Too many requests. Please wait before requesting another dispatch.' 
      });
    }

    // 3. Privacy-First Member Verification
    const member = await getMemberByEmail(normalizedEmail);
    
    // SECURITY: Always return success even if the email doesn't exist.
    // This prevents malicious actors from probing which emails are registered.
    const GENERIC_SUCCESS = 'If your email is registered, your security key will be dispatched shortly.';

    if (!member) {
      return res.status(200).json({ ok: true, message: GENERIC_SUCCESS });
    }

    // 4. Key Recovery & Dispatch
    const activeKeys = await getActiveKeysForMember(normalizedEmail);
    
    if (!activeKeys || activeKeys.length === 0) {
      // Logic for an existing member who has no keys (rare edge case)
      console.warn(`[InnerCircle Resend] Member ${normalizedEmail} found but has no active keys.`);
      return res.status(200).json({ ok: true, message: GENERIC_SUCCESS });
    }

    // Identify the most recent active key
    const latestKey = activeKeys.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    // 5. Professional Re-dispatch
    await sendInnerCircleEmail({
      to: normalizedEmail,
      type: "resend",
      data: {
        name: member.name || "Builder",
        accessKey: latestKey.key,
        unlockUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/inner-circle?key=${latestKey.key}`
      }
    });

    console.info(`[InnerCircle Resend] Key suffix ...${latestKey.key_suffix} resent to ${normalizedEmail}`);

    return res.status(200).json({ ok: true, message: GENERIC_SUCCESS });

  } catch (error) {
    console.error('[InnerCircle Resend] System Exception:', error);
    return res.status(500).json({ ok: false, error: 'Dispatch failed. Subsystem offline.' });
  }
}