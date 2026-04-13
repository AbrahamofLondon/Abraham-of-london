// lib/resend.ts — Resend email client (singleton)
// Package: resend@^6.9.3 — confirmed in package.json
// API key: RESEND_API_KEY confirmed in .env

import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error(
    "[RESEND] RESEND_API_KEY is not set. Email sending will fail."
  );
}

export const resend = new Resend(process.env.RESEND_API_KEY);