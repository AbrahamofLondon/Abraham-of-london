// lib/email/sendInnerCircleEmail.d.ts
export type InnerCircleEmailPayload = {
  to: string | string[];
  type: "welcome" | "resend";
  data: {
    name: string;
    accessKey: string;
    unlockUrl: string;
  };
};

export type InnerCircleEmailSendResult = {
  ok: boolean;
  provider: "resend";
  error?: string;
};

export function sendInnerCircleEmail(
  payload: InnerCircleEmailPayload
): Promise<InnerCircleEmailSendResult>;

export function sendInnerCircleEmail(
  email: string,
  key: string,
  name?: string
): Promise<InnerCircleEmailSendResult>;

