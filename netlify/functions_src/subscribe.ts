// netlify/functions_src/subscribe.ts

import type { Handler, HandlerResponse } from "./_utils";

interface SubscribeBody {
  email: string;
  list?: string;
  source?: string;
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function firstHeader(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function getAllowedOrigin(origin: string): string {
  if (ALLOWED_ORIGINS.includes("*")) return "*";
  return ALLOWED_ORIGINS.includes(origin) ? origin : "null";
}

function jsonResponse(
  statusCode: number,
  body: unknown,
  allowedOrigin: string
): HandlerResponse {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
}

export const handler: Handler = async (event): Promise<HandlerResponse> => {
  const origin = firstHeader(event.headers.origin ?? event.headers.Origin);
  const allowedOrigin = getAllowedOrigin(origin);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" }, allowedOrigin);
  }

  try {
    const body: SubscribeBody = JSON.parse(event.body || "{}");

    const email = String(body.email || "").trim();
    const list = String(body.list || "general").trim() || "general";
    const source = String(body.source || "website").trim() || "website";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse(400, { error: "Valid email is required" }, allowedOrigin);
    }

    console.log(
      `Subscription received: ${email} for list: ${list} from source: ${source}`
    );

    return jsonResponse(
      200,
      {
        success: true,
        message: "Successfully subscribed to updates",
        email,
        list,
      },
      allowedOrigin
    );
  } catch (error) {
    console.error("Subscribe error:", error);
    return jsonResponse(500, { error: "Internal server error" }, allowedOrigin);
  }
};