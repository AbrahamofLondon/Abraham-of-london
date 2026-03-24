import { cookies } from "next/headers";

const COOKIE_NAME = "aol_alignment_session";

function randomKey(): string {
  return `pas_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export async function getOrCreatePurposeAlignmentSessionKey(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;

  if (existing) return existing;

  const next = randomKey();

  store.set(COOKIE_NAME, next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return next;
}