import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { logAccessAudit } from "@/lib/access/audit";

const COOKIE_NAMES = [
  "aol_access",
  "aol_session",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
];

function expiredCookie(name: string) {
  const secure = name.startsWith("__Secure-") || name.startsWith("__Host-") ? "; Secure" : "";
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await getServerSession(req, res, authOptions);

  await logAccessAudit({
    actorType: session?.user?.id ? "USER" : "SYSTEM",
    actorUserId: session?.user?.id ?? null,
    actorEmail: session?.user?.email ?? null,
    action: "session.logout",
    targetType: "session",
    targetKey: session?.user?.id ?? null,
    success: true,
  });

  res.setHeader("Set-Cookie", COOKIE_NAMES.map(expiredCookie));
  return res.status(200).json({ ok: true });
}
