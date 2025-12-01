// netlify/functions/ping.ts
import type { Handler } from "@netlify/functions";
import {
  ok,
  bad,
  handleOptions,
  readJson,
} from "./_utils";

type PingBody = {
  ping?: unknown;
};

export const handler: Handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || "*";
  const timestamp = new Date().toISOString();

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return handleOptions(origin);
  }

  if (event.httpMethod === "GET") {
    return ok(
      "Ping OK",
      {
        method: "GET",
        received: "pong",
        timestamp,
        environment: process.env.NODE_ENV || "development",
      },
      origin
    );
  }

  if (event.httpMethod === "POST") {
    const body = await readJson<PingBody>({
      headers: event.headers,
      body: event.body || "",
    });

    return ok(
      "Ping OK",
      {
        method: "POST",
        received: body.ping ?? null,
        timestamp,
        environment: process.env.NODE_ENV || "development",
      },
      origin
    );
  }

  return bad("Method Not Allowed", 405, origin);
};