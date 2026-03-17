// netlify/functions_src/functions/clear-cache.ts

import {
  ok,
  bad,
  readJson,
  withSecurity,
  type Handler,
} from "../_utils";

type ClearCacheBody = {
  secret?: string;
};

export const handler: Handler = withSecurity(
  async (event) => {
    const originHeader = event.headers.origin ?? event.headers.Origin ?? "*";
    const origin = Array.isArray(originHeader)
      ? (originHeader[0] ?? "*")
      : (originHeader || "*");

    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST,OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Requested-With",
          "Access-Control-Max-Age": "86400",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "POST") {
      return bad("Method Not Allowed", 405, origin);
    }

    const body = await readJson<ClearCacheBody>({
      headers: event.headers,
      body: event.body || "",
    });

    const validSecret = process.env.CLEAR_CACHE_SECRET;
    if (!validSecret) {
      return bad("Clear cache functionality not configured", 500, origin);
    }

    if (!body.secret || body.secret !== validSecret) {
      return bad("Invalid secret", 401, origin);
    }

    console.log("🧹 Cache clear requested at:", new Date().toISOString());

    return ok(
      "Cache cleared successfully",
      {
        timestamp: new Date().toISOString(),
        cleared: true,
      },
      origin
    );
  },
  {
    requireRecaptcha: false,
    requireHoneypot: true,
  }
);