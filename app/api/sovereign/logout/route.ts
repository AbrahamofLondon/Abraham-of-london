/* app/api/sovereign/logout/route.ts — SOVEREIGN LOGOUT */

import { NextResponse } from "next/server";

const COOKIE_NAME = "ogr_sovereign_session";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}