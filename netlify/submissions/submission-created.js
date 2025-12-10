// netlify/functions/submissions/submissions-created.ts
import type { Handler } from "@netlify/functions";
import {
  ok,
  bad,
  readJson,
  withSecurity,
  normalizeEmail,
  escapeHtml,
  getSiteUrl,
  validateRequiredFields,
} from "../_utils";

export const handler: Handler = withSecurity(
  async (event) => {
    const origin = event.headers.origin || event.headers.Origin || "*";

    try {
      const body = await readJson<{
        email?: string;
        name?: string;
        message?: string;
        subject?: string;
        data?: Record<string, unknown>;
      }>({
        headers: event.headers,
        body: event.body || "",
      });

      const { email, name, message, subject, data } = body;

      console.log("New form submission received:", {
        email: email ? normalizeEmail(email) : "No email",
        name: name ? escapeHtml(name) : "No name",
        subject: subject || "No subject",
        timestamp: new Date().toISOString(),
      });

      const validation = validateRequiredFields(body, [
        "email",
        "name",
        "message",
      ]);
      if (!validation.isValid) {
        return bad(
          `Missing required fields: ${validation.missing.join(", ")}`,
          422,
          origin
        );
      }

      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        return bad("Invalid email address", 422, origin);
      }

      await processSubmission({
        email: normalizedEmail,
        name: escapeHtml(name!),
        message: escapeHtml(message!),
        subject: escapeHtml(subject || "Contact Form Submission"),
        additionalData: data,
        submittedAt: new Date().toISOString(),
        siteUrl: getSiteUrl(),
      });

      return ok(
        "Submission processed successfully",
        {
          receivedAt: new Date().toISOString(),
        },
        origin
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error processing request";
      console.error("Error processing submission:", message);
      return bad("Internal server error", 500, origin);
    }
  },
  {
    requireRecaptcha: true,
    expectedAction: "contact_form",
    requireHoneypot: true,
  }
);

async function processSubmission(submission: {
  email: string;
  name: string;
  message: string;
  subject: string;
  additionalData?: Record<string, unknown>;
  submittedAt: string;
  siteUrl: string;
}): Promise<void> {
  console.log("Processing submission:", {
    email: submission.email,
    name: submission.name,
    subject: submission.subject,
    timestamp: submission.submittedAt,
  });

  // TODO:
  // 1. Send confirmation email
  // 2. Store in external database / CRM
  // 3. Send admin notification
}