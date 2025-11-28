// pages/api/inner-circle/unlock.ts
import type { NextApiRequest, NextApiResponse } from "next";

type UnlockPostSuccess = {
  ok: true;
  redirectTo: string;
};

type UnlockPostFailure = {
  ok: false;
  error: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<UnlockPostSuccess | UnlockPostFailure | void>,
) {
  const accessKey = process.env.INNER_CIRCLE_ACCESS_KEY;
  if (!accessKey) {
    if (req.method === "POST") {
      return res.status(500).json({
        ok: false,
        error: "Inner Circle is not configured on the server",
      });
    }
    return res.status(500).end();
  }

  if (req.method === "GET") {
    const key = String(req.query.key || "");
    const returnToRaw = String(req.query.returnTo || "/canon");

    if (!key || key !== accessKey) {
      return res.status(302).redirect("/inner-circle?error=invalid-key");
    }

    const returnTo =
      returnToRaw.startsWith("/") && !returnToRaw.startsWith("//")
        ? returnToRaw
        : "/canon";

    res.setHeader("Set-Cookie", buildAccessCookie());
    return res.status(302).redirect(returnTo);
  }

  if (req.method === "POST") {
    const { key, returnTo: bodyReturnTo } = (req.body ?? {}) as {
      key?: string;
      returnTo?: string;
    };

    if (!key || key !== accessKey) {
      return res.status(400).json({ ok: false, error: "Invalid key" });
    }

    const returnTo =
      typeof bodyReturnTo === "string" &&
      bodyReturnTo.startsWith("/") &&
      !bodyReturnTo.startsWith("//")
        ? bodyReturnTo
        : "/canon";

    res.setHeader("Set-Cookie", buildAccessCookie());
    return res.status(200).json({ ok: true, redirectTo: returnTo });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "Method not allowed" });
}

function buildAccessCookie(): string {
  const isProd = process.env.NODE_ENV === "production";

  const parts = [
    "innerCircleAccess=true",
    "Path=/",
    "SameSite=Lax",
    "HttpOnly",
  ];

  if (isProd) parts.push("Secure");

  // 30 days – adjust if you like
  const maxAgeSeconds = 60 * 60 * 24 * 30;
  parts.push(`Max-Age=${maxAgeSeconds}`);

  return parts.join("; ");
}