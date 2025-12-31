// netlify/functions/test-email.ts
import type {
  Handler,
  HandlerEvent,
  HandlerContext,
  HandlerResponse,
} from "@netlify/functions";

// ---------------------------------------------------------------------------
// Local helpers (inlined so we don't depend on ./_utils)
// ---------------------------------------------------------------------------

type JsonInput = {
  headers: Record<string, string | undefined>;
  body: string;
};

async function readJson<T = unknown>(input: JsonInput): Promise<T> {
  const raw = input.body?.trim();
  if (!raw) return {} as T;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("Invalid JSON payload");
  }
}

function buildCorsHeaders(origin: string) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
    "Access-Control-Allow-Headers":
      "Content-Type,Authorization,X-Requested-With,X-Recaptcha-Token",
    "Access-Control-Max-Age": "86400",
  };
}

function ok(message: string, data: unknown, origin: string): HandlerResponse {
  return {
    statusCode: 200,
    headers: buildCorsHeaders(origin),
    body: JSON.stringify({
      ok: true,
      message,
      data,
    }),
  };
}

function bad(
  message: string,
  statusCode = 400,
  origin: string,
): HandlerResponse {
  return {
    statusCode,
    headers: buildCorsHeaders(origin),
    body: JSON.stringify({
      ok: false,
      error: message,
    }),
  };
}

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

type SecurityOptions = {
  requireRecaptcha?: boolean;
  requireHoneypot?: boolean;
};

function withSecurity(
  handler: (
    event: HandlerEvent,
    context: HandlerContext,
  ) => Promise<HandlerResponse>,
  options: SecurityOptions = {},
): Handler {
  return async (
    event: HandlerEvent,
    context: HandlerContext,
  ): Promise<HandlerResponse> => {
    const origin = event.headers.origin || event.headers.Origin || "*";

    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: buildCorsHeaders(origin),
        body: "",
      };
    }

    // Honeypot validation
    if (options.requireHoneypot && event.body) {
      try {
        const body = JSON.parse(event.body) as Record<string, unknown>;
        const honeypotFields = ["website", "middleName", "botField", "url"];

        for (const field of honeypotFields) {
          const val = body[field];
          if (typeof val === "string" && val.trim().length > 0) {
            // Pretend success but don't process - silent drop
            return ok("Success", {}, origin);
          }
        }
      } catch {
        // If we can't parse body for honeypot, continue but be cautious
      }
    }

    return handler(event, context);
  };
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

const EMAIL_TEMPLATES = {
  welcome: {
    subject: "Welcome to Abraham of London",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Abraham of London</h1>
            </div>
            <div class="content">
              <h2>Welcome!</h2>
              <p>Thank you for your interest in Abraham of London.</p>
              <p>We're dedicated to providing thoughtful content and resources.</p>
              <p>Best regards,<br>The Abraham of London Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Abraham of London. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Abraham of London!\n\nThank you for your interest in Abraham of London.\n\nWe're dedicated to providing thoughtful content and resources.\n\nBest regards,\nThe Abraham of London Team`,
  },
  test: {
    subject: "Test Email from Abraham of London",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Abraham of London</h1>
            </div>
            <div class="content">
              <h2>Test Email Successful! ✅</h2>
              <p>This is a test email from your Abraham of London website.</p>
              <p><strong>Timestamp:</strong> {{timestamp}}</p>
              <p><strong>Environment:</strong> {{environment}}</p>
              <p>If you're receiving this, your email system is working correctly.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Abraham of London. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Test Email Successful!\n\nThis is a test email from your Abraham of London website.\n\nTimestamp: {{timestamp}}\nEnvironment: {{environment}}\n\nIf you're receiving this, your email system is working correctly.`,
  },
};

// ---------------------------------------------------------------------------
// Mock email sender
// ---------------------------------------------------------------------------

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const emailService = process.env.EMAIL_SERVICE || "console";

    console.log("📧 Email Details:");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("HTML Length:", html.length);
    console.log("Text Length:", text.length);
    console.log("Email service:", emailService);
    console.log("--- End Email ---");

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  } catch (error) {
    console.error("Email sending error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown email error",
    };
  }
}

// ---------------------------------------------------------------------------
// Netlify handler
// ---------------------------------------------------------------------------

export const handler: Handler = withSecurity(
  async (
    event: HandlerEvent,
    _context: HandlerContext,
  ): Promise<HandlerResponse> => {
    const origin = event.headers.origin || event.headers.Origin || "*";

    try {
      const body = await readJson<{
        template?: string;
        to?: string;
        subject?: string;
        html?: string;
        text?: string;
        data?: Record<string, string>;
      }>({
        headers: event.headers as Record<string, string | undefined>,
        body: event.body || "",
      });

      if (!body.to || !isValidEmail(body.to)) {
        return bad("Valid 'to' email address is required", 422, origin);
      }

      const templateName = body.template || "test";
      const templateData = body.data || {};

      let subject: string;
      let html: string;
      let text: string;

      if (
        body.template &&
        EMAIL_TEMPLATES[body.template as keyof typeof EMAIL_TEMPLATES]
      ) {
        const template =
          EMAIL_TEMPLATES[body.template as keyof typeof EMAIL_TEMPLATES];
        subject = body.subject || template.subject;
        html = body.html || template.html;
        text = body.text || template.text;
      } else if (body.subject && body.html) {
        subject = body.subject;
        html = body.html;
        text = body.text || body.subject;
      } else {
        const template = EMAIL_TEMPLATES.test;
        subject = template.subject;
        html = template.html;
        text = template.text;
      }

      const timestamp = new Date().toISOString();
      const environment = process.env.NODE_ENV || "production";

      html = html
        .replace(/{{timestamp}}/g, timestamp)
        .replace(/{{environment}}/g, environment)
        .replace(/{{to}}/g, body.to);

      text = text
        .replace(/{{timestamp}}/g, timestamp)
        .replace(/{{environment}}/g, environment)
        .replace(/{{to}}/g, body.to);

      Object.entries(templateData).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        html = html.replace(regex, value);
        text = text.replace(regex, value);
      });

      const result = await sendEmail(body.to, subject, html, text);

      if (!result.success) {
        return bad(`Failed to send email: ${result.error}`, 500, origin);
      }

      console.log(
        `Email sent successfully to: ${body.to}, Template: ${templateName}, MessageID: ${result.messageId}`,
      );

      return ok(
        "Email sent successfully",
        {
          to: body.to,
          template: templateName,
          messageId: result.messageId,
          timestamp,
          environment,
        },
        origin,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error processing request";
      console.error("Error in test-email function:", message);
      return bad("Internal server error", 500, origin);
    }
  },
  {
    requireRecaptcha: false,
    requireHoneypot: true,
  },
);
