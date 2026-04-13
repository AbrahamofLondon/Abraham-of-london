// lib/auth/ogr-session.ts
import crypto from "crypto";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

const OGR_COOKIE_NAME = "ogr_sovereign_session";

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

export function hasValidOgrSession(cookieValue: string | undefined): boolean {
  const secret = process.env.OGR_SESSION_SECRET;
  if (!secret) return false;
  if (!cookieValue) return false;

  const lastDot = cookieValue.lastIndexOf(".");
  if (lastDot <= 0) return false;

  const payload = cookieValue.slice(0, lastDot);
  const providedMac = cookieValue.slice(lastDot + 1);

  const expected = signSession(payload, secret);
  const expectedMac = expected.slice(expected.lastIndexOf(".") + 1);

  return timingSafeEqual(providedMac, expectedMac);
}

export async function getOgrSession(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(OGR_COOKIE_NAME)?.value;
}

export async function validateOgrSessionFromRequest(req: NextRequest): Promise<boolean> {
  const cookieValue = req.cookies.get(OGR_COOKIE_NAME)?.value;
  return hasValidOgrSession(cookieValue);
}