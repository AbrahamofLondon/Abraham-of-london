// pages/api/inner-circle/register.ts - Inline stub
import type { NextApiRequest, NextApiResponse } from "next";

// Stub functions
const sendInnerCircleEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> => {
  console.log("Stub: sendInnerCircleEmail called to:", to, "subject:", subject);
};

const createOrUpdateMemberAndIssueKey = async (args: {
  email: string;
  name?: string;
  ipAddress?: string;
  context?: string;
}): Promise<{
  key: string;
  keySuffix: string;
  createdAt: string;
  status: string;
}> => {
  console.log("Stub: createOrUpdateMemberAndIssueKey called with:", args);
  
  // Generate a realistic-looking key
  const keySuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const key = `IC-${args.email.substring(0, 3).toUpperCase()}-${keySuffix}-${Date.now().toString(36).substring(4, 8).toUpperCase()}`;
  
  return {
    key: key,
    keySuffix: keySuffix,
    createdAt: new Date().toISOString(),
    status: "active"
  };
};

// Simple rate limit stub
const rateLimited = (fn: Function, options?: any) => {
  return async (...args: any[]) => {
    return fn(...args);
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: boolean; message?: string; accessKey?: string; keySuffix?: string } | { ok: false; error: string }>
) {
  // Apply rate limiting stub
  const handlerFunc = rateLimited(async () => {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    let body;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      res.status(400).json({ ok: false, error: "Invalid JSON body" });
      return;
    }

    const { email, name } = body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ ok: false, error: "Email is required" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ ok: false, error: "Invalid email format" });
      return;
    }

    try {
      const keyRecord = await createOrUpdateMemberAndIssueKey({
        email,
        name,
        ipAddress: Array.isArray(req.headers["x-forwarded-for"]) 
          ? req.headers["x-forwarded-for"][0] 
          : req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        context: "api-register"
      });

      // Send welcome email stub
      await sendInnerCircleEmail(
        email,
        "Welcome to the Inner Circle",
        `<h1>Welcome!</h1><p>Your access key: ${keyRecord.key}</p><p>Keep this key safe!</p>`,
        `Welcome! Your access key: ${keyRecord.key}\n\nKeep this key safe!`
      );

      res.status(200).json({
        ok: true,
        message: "Registration successful. Check your email for access key.",
        accessKey: keyRecord.key,
        keySuffix: keyRecord.keySuffix
      });
    } catch (error) {
      console.error("Error in inner circle registration:", error);
      res.status(500).json({ ok: false, error: "Internal server error" });
    }
  });

  await handlerFunc();
}
