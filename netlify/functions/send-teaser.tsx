// netlify/functions/send-teaser.ts
import type { Handler } from "@netlify/functions";
import {
  ok,
  bad,
  readJson,
  withSecurity,
} from "./_utils";

type TeaserType = "book" | "course" | "venture" | "other";

interface TeaserBody {
  email: string;
  teaserType: TeaserType;
  contentPreference?: "pdf" | "video" | "audio";
}

export const handler: Handler = withSecurity(
  async (event) => {
    const origin = event.headers.origin || event.headers.Origin || "*";

    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Access-Control-Max-Age": "86400",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "POST") {
      return bad("Method Not Allowed", 405, origin);
    }

    const body = await readJson<TeaserBody>({
      headers: event.headers,
      body: event.body || "",
    });

    const email = (body.email || "").trim();
    const teaserType = body.teaserType;
    const contentPreference = body.contentPreference || "pdf";

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return bad("Valid email is required", 400, origin);
    }

    if (!teaserType) {
      return bad("Teaser type is required", 400, origin);
    }

    console.log("🎯 [send-teaser] Request received", {
      email,
      teaserType,
      contentPreference,
      timestamp: new Date().toISOString(),
    });

    // TODO: integrate with your email/CRM / asset delivery system
    // e.g. sendTeaserEmail(email, teaserType, contentPreference)

    return ok(
      "Teaser content scheduled for delivery",
      {
        success: true,
        email,
        teaserType,
        contentPreference,
        deliveryMethod: "email",
        timestamp: new Date().toISOString(),
      },
      origin
    );
  },
  {
    requireRecaptcha: false,
    requireHoneypot: true,
  }
);