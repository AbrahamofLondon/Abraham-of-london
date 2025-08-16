// netlify/functions/subscribe.ts
import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const { email } = JSON.parse(event.body || "{}");
  if (!email) return { statusCode: 400, body: JSON.stringify({ message: "Email is required" }) };

  // Add email to a service (e.g., Mailchimp) or log it
  console.log("Subscribed:", email);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Subscription successful" }),
  };
};