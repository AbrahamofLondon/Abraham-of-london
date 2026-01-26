// app/api/admin/dev-login/route.ts  (name it clearly)
import { NextRequest, NextResponse } from "next/server";
import crypto, { timingSafeEqual } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const password = typeof body?.password === "string" ? body.password : "";

    const devPassword = process.env.DEV_ADMIN_PASSWORD || "";
    if (!devPassword) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Timing-safe compare
    const a = Buffer.from(password, "utf8");
    const b = Buffer.from(devPassword, "utf8");

    const isValid =
      a.length === b.length ? timingSafeEqual(a, b) : false;

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const res = NextResponse.json({
      success: true,
      token,
      expires: expires.toISOString(),
    });

    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires,
    });

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    console.error("Dev admin login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}