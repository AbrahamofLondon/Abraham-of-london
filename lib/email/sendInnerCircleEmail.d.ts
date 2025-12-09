// lib/email/sendInnerCircleEmail.d.ts
declare module "@/lib/email/sendInnerCircleEmail" {
  export function sendInnerCircleEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void>;
}
