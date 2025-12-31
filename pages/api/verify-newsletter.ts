import type { NextApiRequest, NextApiResponse } from "next";

interface VerifyResponseBody {
  ok: boolean;
  message: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponseBody>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      message: "Method Not Allowed",
    });
  }

  try {
    const { token, email } = req.query;

    if (!token || !email || typeof token !== 'string' || typeof email !== 'string') {
      return res.status(400).json({
        ok: false,
        message: "Invalid verification link",
        error: "INVALID_PARAMETERS",
      });
    }

    // In production, retrieve from your database
    // const verificationData = await getVerificationData(token, email);
    
    // For now, we'll simulate verification
    // Replace this with actual database lookup
    const isValid = true; // Replace with actual verification logic
    
    if (!isValid) {
      return res.status(400).json({
        ok: false,
        message: "Invalid or expired verification link",
        error: "INVALID_TOKEN",
      });
    }

    // Send success notification to Abraham
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Newsletter System <system@fatheringwithoutfear.com>',
          to: 'Abraham@AbrahamofLondon.com',
          subject: 'New Verified Newsletter Subscriber',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c5530;">🎉 New Verified Subscriber!</h2>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Verified At:</strong> ${new Date().toISOString()}</p>
              <p style="color: #2c5530; font-weight: bold;">
                This subscriber has successfully verified their email and is now fully subscribed!
              </p>
            </div>
          `,
        }),
      });
    } catch (_error) {
      console.error("Failed to send notification:", _error);
      // Continue even if notification fails
    }

    // Redirect to success page or return success
    return res.status(200).json({
      ok: true,
      message: "Successfully verified! You are now subscribed to our newsletter.",
    });

  } catch (_error) {
    console.error("Verification endpoint error:", _error);
    
    return res.status(500).json({
      ok: false,
      message: "Verification failed. Please try again.",
      error: "VERIFICATION_FAILED",
    });
  }
}
