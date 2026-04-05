/* app/api/auth/sovereign/route.ts — SOVEREIGN AUTH GATE (COMPAT SAFE, NO DRIFT) */

import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

const PRIMARY_COOKIE_NAME = "ogr_sovereign_session";
const COMPAT_COOKIE_NAME = "sovereign_session";
const COOKIE_TTL_SECONDS = 60 * 60 * 8; // 8 hours

type AuthorityLevel =
  | "OBSERVER"
  | "PARTICIPANT"
  | "DELEGATE"
  | "AUTHORITY"
  | "SOVEREIGN";

function normalizeKey(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function getConfiguredKeys(): string[] {
  return [
    process.env.OGR_SOVEREIGN_KEY || "",
    ...(process.env.SOVEREIGN_KEYS || "").split(","),
    process.env.SOVEREIGN_ACCESS_KEY || "",
  ]
    .map((key) => normalizeKey(key))
    .filter(Boolean);
}

function signValue(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function buildSignedSession(secret: string): string {
  const issuedAt = Date.now().toString();
  const nonce = crypto.randomUUID();
  const payload = `${issuedAt}:${nonce}`;
  const mac = signValue(payload, secret);
  return `${payload}.${mac}`;
}

function buildCompatAuthorityCookie(args: {
  userId: string;
  campaignId: string;
  authorityLevel: AuthorityLevel;
  secret: string;
}): string {
  const seed = `${args.userId}:${args.campaignId}:${args.authorityLevel}:${Date.now()}`;
  const signature = signValue(seed, args.secret);

  return [
    args.userId,
    args.campaignId,
    args.authorityLevel,
    signature,
  ].join(":");
}

function cookieBase() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_TTL_SECONDS,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const providedKey = normalizeKey((body as { key?: unknown })?.key);

    const configuredKeys = getConfiguredKeys();
    const sessionSecret = String(process.env.OGR_SESSION_SECRET || "").trim();

    if (!configuredKeys.length) {
      return NextResponse.json(
        { ok: false, error: "SOVEREIGN_KEY_NOT_CONFIGURED" },
        { status: 500 },
      );
    }

    if (!sessionSecret) {
      return NextResponse.json(
        { ok: false, error: "OGR_SESSION_SECRET_NOT_CONFIGURED" },
        { status: 500 },
      );
    }

    if (!providedKey || !configuredKeys.includes(providedKey)) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED_ACCESS_BLOCK" },
        { status: 403 },
      );
    }

    const primarySession = buildSignedSession(sessionSecret);
    const compatAuthority = buildCompatAuthorityCookie({
      userId: "sovereign-user",
      campaignId: "system",
      authorityLevel: "SOVEREIGN",
      secret: sessionSecret,
    });

    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: PRIMARY_COOKIE_NAME,
      value: primarySession,
      ...cookieBase(),
    });

    response.cookies.set({
      name: COMPAT_COOKIE_NAME,
      value: compatAuthority,
      ...cookieBase(),
    });

    return response;
  } catch (error) {
    console.error("[SOVEREIGN_AUTH_FAILURE]", error);
    return NextResponse.json(
      { ok: false, error: "AUTH_GATE_FAILURE" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Use POST to initialize sovereign authentication.",
    },
    { status: 405 },
  );
}