// netlify/functions/subscribe-launch.ts
import { Handler } from "@netlify/functions";

interface LaunchSubscribeBody {
  email: string;
  venture?: string;
  interest?: string[];
}

export const handler: Handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

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
    const body: LaunchSubscribeBody = JSON.parse(event.body || "{}");
    const { email, venture = "general", interest = [] } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Valid email is required" }),
      };
    }

    // TODO: Add to launch list in your CRM or database
    console.log(`Launch list subscription: ${email} for venture: ${venture}, interests: ${interest.join(", ")}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: "Joined launch list successfully",
        email,
        venture,
        interest
      }),
    };
  } catch (error) {
    console.error("Launch subscribe error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
