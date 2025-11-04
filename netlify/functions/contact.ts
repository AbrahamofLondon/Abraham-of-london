import type { Handler } from "@netlify/functions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
} as const;

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};

    // TODO: your existing business logic (email/send/validate) can be re-added here.

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, received: !!event.body, payload })
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: message })
    };
  }
};
