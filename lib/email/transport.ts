import { Resend } from "resend";

export type EmailTransportPayload = {
  to: string;
  subject: string;
  html: string;
};

export type EmailTransportResult = {
  status: "SENT" | "FAILED" | "DRY_RUN";
  provider: "RESEND" | "DRY_RUN";
  providerMessageId?: string | null;
  failureReason?: string | null;
};

let resendClient: Resend | null = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

export function getEmailTransportStatus() {
  return getResendClient() ? "PROVIDER_READY" as const : "TEST_MODE_READY" as const;
}

export async function sendEmailTransport(payload: EmailTransportPayload): Promise<EmailTransportResult> {
  const resend = getResendClient();
  if (!resend) {
    return {
      status: "DRY_RUN",
      provider: "DRY_RUN",
      providerMessageId: null,
      failureReason: "RESEND_API_KEY is not configured.",
    };
  }

  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "info@abrahamoflondon.org",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    if (response.error) {
      return {
        status: "FAILED",
        provider: "RESEND",
        providerMessageId: null,
        failureReason: response.error.message || "Unknown Resend error.",
      };
    }

    return {
      status: "SENT",
      provider: "RESEND",
      providerMessageId: response.data?.id ?? null,
      failureReason: null,
    };
  } catch (error) {
    return {
      status: "FAILED",
      provider: "RESEND",
      providerMessageId: null,
      failureReason: error instanceof Error ? error.message : "Unknown transport failure.",
    };
  }
}
