/* lib/ogr/server-auth.ts — SERVER-SIDE OGR AUTH HELPERS */

import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "ogr_sovereign_session";

function signSession(value: string, secret: string): string {
  const mac = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${mac}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function hasValidOgrSession(): Promise<boolean> {
  const secret = process.env.OGR_SESSION_SECRET;
  if (!secret) return false;

  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return false;

  const lastDot = raw.lastIndexOf(".");
  if (lastDot <= 0) return false;

  const payload = raw.slice(0, lastDot);
  const providedMac = raw.slice(lastDot + 1);

  const expected = signSession(payload, secret);
  const expectedMac = expected.slice(expected.lastIndexOf(".") + 1);

  return timingSafeEqual(providedMac, expectedMac);
}