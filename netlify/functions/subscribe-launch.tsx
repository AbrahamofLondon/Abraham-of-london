// netlify/functions/subscribe-launch.tsx
import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { Resend } from "resend";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import WelcomeLaunchEmail from "../emails/WelcomeLaunchEmail";

const JSON_HEADERS: Record<string, string | number | boolean> = {
  "Content-Type": "application/json",
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://www.abrahamoflondon.org";

const json = (statusCode: number, body: any): HandlerResponse => ({
  statusCode,
  headers: JSON_HEADERS as Record<string, string>,
  body: JSON.stringify(body),
});

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...JSON_HEADERS, Allow: "POST" } as Record<string, string>,
      body: JSON.stringify({ ok: false, message: "Method Not Allowed" }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const email = String(body.email || "").trim
