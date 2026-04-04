/* app/api/sovereign/auth/route.ts — SOVEREIGN AUTH GATE (COOKIE-BASED) */

import { NextResponse } from "next/server";
import crypto from "crypto";

const COOKIE_NAME = "ogr_sovereign_session";
const COOKIE_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function signSession(value: string, secret: string): string {
  const mac = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${mac}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const providedKey = typeof body?.key === "string" ? body.key : "";

    const serverKey = process.env.OGR_SOVEREIGN_KEY;
    const sessionSecret = process.env.OGR_SESSION_SECRET;

    if (!serverKey) {
      return NextResponse.json(
        { ok: false, error: "SOVEREIGN_KEY_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    if (!sessionSecret) {
      return NextResponse.json(
        { ok: false, error: "OGR_SESSION_SECRET_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    if (providedKey !== serverKey) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED_ACCESS_BLOCK" },
        { status: 403 }
      );
    }

    const issuedAt = Date.now().toString();
    const nonce = crypto.randomUUID();
    const payload = `${issuedAt}:${nonce}`;
    const signed = signSession(payload, sessionSecret);

    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: COOKIE_NAME,
      value: signed,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("[SOVEREIGN_AUTH_FAILURE]", error);
    return NextResponse.json(
      { ok: false, error: "AUTH_GATE_FAILURE" },
      { status: 500 }
    );
  }
}