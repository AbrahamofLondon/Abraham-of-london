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

export function sendInnerCircleEmail(
  payload: InnerCircleEmailPayload
): Promise<void>;

export function sendInnerCircleEmail(
  email: string,
  key: string,
  name?: string
): Promise<void>;