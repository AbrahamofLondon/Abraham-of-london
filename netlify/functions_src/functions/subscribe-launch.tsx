// netlify/functions_src/functions/subscribe-launch.tsx

import type { Handler, HandlerResponse } from "./_utils";

interface LaunchSubscribeBody {
  email: string;
  venture?: string;
  interest?: string[];
}

function jsonResponse(
  statusCode: number,
  body: unknown,
  origin = "*"
): HandlerResponse {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
}

export const handler: Handler = async (event): Promise<HandlerResponse> => {
  const originHeader = event.headers.origin ?? event.headers.Origin ?? "*";
  const origin = Array.isArray(originHeader)
    ? (originHeader[0] ?? "*")
    : (originHeader || "*");

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" }, origin);
  }

  try {
    const body: LaunchSubscribeBody = JSON.parse(event.body || "{}");
    const email = String(body.email || "").trim();
    const venture = String(body.venture || "general").trim() || "general";
    const interest = Array.isArray(body.interest)
      ? body.interest.map((item) => String(item)).filter(Boolean)
      : [];

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse(400, { error: "Valid email is required" }, origin);
    }

    console.log(
      `Launch list subscription: ${email} for venture: ${venture}, interests: ${interest.join(", ")}`
    );

    return jsonResponse(
      200,
      {
        success: true,
        message: "Joined launch list successfully",
        email,
        venture,
        interest,
      },
      origin
    );
  } catch (error) {
    console.error("Launch subscribe error:", error);
    return jsonResponse(500, { error: "Internal server error" }, origin);
  }
};