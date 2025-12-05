// lib/email/templates/InnerCircleEmail.tsx
import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface InnerCircleEmailProps {
  name?: string;
  accessKey: string;
  unlockUrl: string;
  mode?: "register" | "resend";
}

export function InnerCircleEmail({
  name,
  accessKey,
  unlockUrl,
  mode = "register",
}: InnerCircleEmailProps): JSX.Element {
  const greetingName = name && name.trim().length > 0 ? name.trim() : "Friend";
  const previewText =
    mode === "register"
      ? "Your Canon Inner Circle access key and unlock link."
      : "Your Inner Circle access link has been resent.";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>Abraham of London · Canon Inner Circle</Text>
          </Section>

          <Section style={content}>
            <Text style={salutation}>Dear {greetingName},</Text>

            <Text style={paragraph}>
              Thank you for stepping into the Canon Inner Circle. This key gives
              you access to restricted Canon volumes and commentary reserved for
              serious builders and stewards.
            </Text>

            <Text style={paragraph}>
              To unlock this device, simply click the button below. A secure
              cookie will be set in your browser, and you&apos;ll be taken
              straight back to the Canon.
            </Text>

            <Section style={buttonRow}>
              <Button href={unlockUrl} style={button}>
                Unlock Inner Circle on this device
              </Button>
            </Section>

            <Text style={paragraph}>
              If the button doesn&apos;t work, you can also paste this access
              key manually on the Inner Circle page:
            </Text>

            <Section style={codeBox}>
              <Text style={code}>{accessKey}</Text>
            </Section>

            <Text style={paragraphMuted}>
              Keep this key private. If you ever suspect misuse, reply to this
              email and we&apos;ll revoke the key and issue a new one.
            </Text>

            <Text style={paragraph}>
              With grace and resolve,
              <br />
              <span style={signature}>Abraham of London</span>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You received this email because your address was used to request
              Canon Inner Circle access at abrahamoflondon.org.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const body: React.CSSProperties = {
  backgroundColor: "#050509",
  color: "#f5f5f5",
  fontFamily:
    '"system-ui", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "40px auto",
  borderRadius: "20px",
  overflow: "hidden",
  border: "1px solid #a79a68",
  background: "radial-gradient(circle at top, #161622 0, #050509 60%)",
};

const header: React.CSSProperties = {
  padding: "18px 24px 8px",
};

const brand: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#d4c58f",
};

const content: React.CSSProperties = {
  padding: "8px 24px 28px",
};

const salutation: React.CSSProperties = {
  fontSize: "15px",
  marginBottom: "12px",
};

const paragraph: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.6",
  marginBottom: "14px",
};

const paragraphMuted: React.CSSProperties = {
  ...paragraph,
  color: "#b3b3b3",
};

const buttonRow: React.CSSProperties = {
  textAlign: "center",
  margin: "18px 0 22px",
};

const button: React.CSSProperties = {
  backgroundColor: "#d4c58f",
  color: "#050509",
  padding: "12px 22px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  textDecoration: "none",
};

const codeBox: React.CSSProperties = {
  borderRadius: "12px",
  backgroundColor: "rgba(0,0,0,0.65)",
  border: "1px solid rgba(212,197,143,0.5)",
  padding: "10px 14px",
  margin: "6px 0 18px",
};

const code: React.CSSProperties = {
  fontFamily:
    '"JetBrains Mono", "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: "13px",
  letterSpacing: "0.2em",
  textAlign: "center",
};

const signature: React.CSSProperties = {
  fontWeight: 600,
  color: "#f5f5f5",
};

const footer: React.CSSProperties = {
  borderTop: "1px solid rgba(212,197,143,0.3)",
  padding: "14px 24px 18px",
};

const footerText: React.CSSProperties = {
  fontSize: "11px",
  lineHeight: "1.5",
  color: "#8b8b8b",
};
