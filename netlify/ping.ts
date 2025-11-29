// netlify/functions/ping.ts
import type { Handler } from "@netlify/functions";
import {
  ok,
  bad,
  handleOptions,
  methodNotAllowed,
  readJson,
} from "../../patches/fix/common/errors";

export const handler: Handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || "*";

  if (event.httpMethod === "OPTIONS") return handleOptions(origin);
  if (event.httpMethod !== "POST") return methodNotAllowed(origin);

  try {
    const body = await readJson<{ ping?: string }>({
      headers: event.headers as Record<string, string>,
      body: event.body || "",
    });

    if (body.ping !== "pong") return bad("Expected 'pong' value", 422, origin);
    return ok("Pong response", { time: new Date().toISOString() }, origin);
  } catch (err) {
    return bad((err as Error).message, 400, origin);
  }
};
