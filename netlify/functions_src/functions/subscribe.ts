// netlify/functions/subscribe.ts
import { Handler } from "@netlify/functions";

interface SubscribeBody {
  email: string;
  list?: string;
  source?: string;
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*").split(",").map(s => s.trim());

export const handler: Handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes("*") ? "*" : 
                       ALLOWED_ORIGINS.includes(origin) ? origin : "null";

  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const body: SubscribeBody = JSON.parse(event.body || "{}");
    const { email, list = "general", source = "website" } = body;

    // Validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Valid email is required" }),
      };
    }

    // TODO: Integrate with your email service (Mailchimp, ConvertKit, etc.)
    console.log(`Subscription received: ${email} for list: ${list} from source: ${source}`);

    // Example: Save to database or call email service API
    // await fetch('https://api.your-email-service.com/subscribe', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${process.env.EMAIL_API_KEY}` },
    //   body: JSON.stringify({ email, list })
    // });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: "Successfully subscribed to updates",
        email,
        list
      }),
    };
  } catch (error) {
    console.error("Subscribe error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

