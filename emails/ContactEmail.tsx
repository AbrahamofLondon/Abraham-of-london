/* emails/ContactEmail.tsx */
import "server-only";
import * as React from "react";
import {
  Html as EmailHtml,
  Head as EmailHead,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
} from "@react-email/components";

type ContactEmailProps = {
  name: string;
  email: string;
  message: string;
  subject?: string;
  teaserOptIn?: boolean;
  newsletterOptIn?: boolean;
  siteUrl?: string;
  submittedAt?: string;
  ipAnonymized?: string;
  userAgentSnippet?: string;
};

function clamp(str: string, max: number): string {
  if (!str) return "";
  const trimmed = str.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export default function ContactEmail({
  name,
  email,
  message,
  subject,
  teaserOptIn,
  newsletterOptIn,
  siteUrl,
  submittedAt,
  ipAnonymized,
  userAgentSnippet,
}: ContactEmailProps) {
  const safeName = clamp(name || "—", 120);
  const safeEmail = clamp(email || "—", 254);
  const safeSubject = clamp(subject || "Website contact", 160);
  const safeMessage = clamp(message || "", 6000);

  const origin =
    siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.abrahamoflondon.org";

  const metaSubmittedAt = submittedAt || new Date().toISOString();
  const metaIp = ipAnonymized || "unknown";
  const metaUA = userAgentSnippet ? clamp(userAgentSnippet, 140) : undefined;

  return (
    <EmailHtml lang="en">
      <EmailHead />
      <Preview>
        New enquiry — {safeSubject} ({safeName})
      </Preview>

      <Body
        style={{
          backgroundColor: "#f6f6f6",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          margin: 0,
          padding: "16px 0",
        }}
      >
        <Container
          style={{
            margin: "0 auto",
            padding: "24px",
            backgroundColor: "#ffffff",
            borderRadius: 12,
            maxWidth: 600,
            border: "1px solid #dde2e8",
          }}
        >
          <Section>
            <Heading
              as="h2"
              style={{
                margin: 0,
                marginBottom: 8,
                color: "#0d1b2a",
                fontSize: 20,
              }}
            >
              New website enquiry
            </Heading>

            <Text
              style={{
                margin: "8px 0 16px",
                color: "#415a77",
                fontSize: 14,
              }}
            >
              <strong>Subject:</strong> {safeSubject}
              <br />
              <strong>Name:</strong> {safeName}
              <br />
              <strong>Email:</strong> {safeEmail}
            </Text>

            {(teaserOptIn || newsletterOptIn) && (
              <Text
                style={{
                  margin: "0 0 16px",
                  color: "#1b263b",
                  fontSize: 13,
                }}
              >
                <strong>Preferences:</strong>
                <br />
                Teaser requested: {teaserOptIn ? "Yes" : "No"}
                <br />
                Mailing list opt-in: {newsletterOptIn ? "Yes" : "No"}
              </Text>
            )}

            <Section
              style={{
                marginTop: 8,
                padding: "12px 14px",
                borderRadius: 8,
                backgroundColor: "#f7f9fb",
                border: "1px solid #e1e5ec",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  padding: 0,
                  whiteSpace: "pre-wrap",
                  color: "#0d1b2a",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {safeMessage}
              </Text>
            </Section>

            <Section
              style={{
                marginTop: 20,
                paddingTop: 12,
                borderTop: "1px solid #e0e4ea",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  color: "#6c7a89",
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                <strong>Meta:</strong>
                <br />
                Source: {origin}
                <br />
                Submitted: {metaSubmittedAt}
                <br />
                IP (anonymised): {metaIp}
                {metaUA ? (
                  <>
                    <br />
                    User Agent: {metaUA}
                  </>
                ) : null}
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </EmailHtml>
  );
}