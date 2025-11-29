// lib/email/sendInnerCircleEmail.ts
import { Resend } from "resend";
import { InnerCircleEmail } from "./templates/InnerCircleEmail";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey && process.env.NODE_ENV === "production") {
  // eslint-disable-next-line no-console
  console.warn("[InnerCircleEmail] RESEND_API_KEY is not configured.");
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendInnerCircleEmailArgs {
  email: string;
  name?: string;
  accessKey: string;
  unlockUrl: string;
  mode?: "register" | "resend";
}

export async function sendInnerCircleEmail(
  args: SendInnerCircleEmailArgs
): Promise<void> {
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[InnerCircleEmail] Simulated email:", {
        to: args.email,
        unlockUrl: args.unlockUrl,
        key: args.accessKey,
      });
      return;
    }
    throw new Error("Email sending is not configured.");
  }

  const fromAddress =
    process.env.INNER_CIRCLE_FROM_EMAIL ??
    "Inner Circle <innercircle@abrahamoflondon.org>";

  const subject =
    args.mode === "resend"
      ? "Your Canon Inner Circle access link (resent)"
      : "Your Canon Inner Circle access key";

  await resend.emails.send({
    from: fromAddress,
    to: args.email,
    subject,
    react: InnerCircleEmail({
      name: args.name,
      accessKey: args.accessKey,
      unlockUrl: args.unlockUrl,
      mode: args.mode ?? "register",
    }),
  });
}
