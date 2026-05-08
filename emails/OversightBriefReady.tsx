/* emails/OversightBriefReady.tsx — retained oversight brief delivery notification */
import "server-only";
import * as React from "react";
import {
  Body,
  Container,
  Head as EmailHead,
  Heading,
  Hr,
  Html as EmailHtml,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface EmailProps {
  recipientName?: string;
  cyclePeriod: string;
  briefUrl: string;
  signalCount?: number;
  actionCount?: number;
}

export const OversightBriefReadyEmail = ({
  recipientName,
  cyclePeriod,
  briefUrl,
  signalCount,
  actionCount,
}: EmailProps) => (
  <EmailHtml lang="en">
    <EmailHead />
    <Preview>Oversight Brief Ready — {cyclePeriod}</Preview>

    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>RETAINED OVERSIGHT · GOVERNED DELIVERY</Text>
        <Heading style={h1}>Oversight Brief Ready</Heading>

        {recipientName && <Text style={text}>Principal: {recipientName}</Text>}

        <Text style={text}>
          Your retained oversight brief for <strong style={highlight}>{cyclePeriod}</strong> is ready.
        </Text>

        <Text style={text}>
          This cycle has been reviewed and released through the governed oversight process.
          The brief contains only the client-safe version approved for delivery.
        </Text>

        {(signalCount || actionCount) && (
          <Section style={section}>
            <Text style={sectionTitle}>Cycle Summary</Text>
            {signalCount != null && <Text style={text}>{signalCount} oversight signal{signalCount !== 1 ? "s" : ""} detected this cycle.</Text>}
            {actionCount != null && <Text style={text}>{actionCount} required action{actionCount !== 1 ? "s" : ""} identified.</Text>}
          </Section>
        )}

        <Section style={section}>
          <Link href={briefUrl} style={link}>
            → View Oversight Brief
          </Link>
          <Text style={footnote}>
            This brief should be read before the next retained decision review.
          </Text>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Abraham of London · Decision Infrastructure · Retained Oversight
        </Text>
      </Container>
    </Body>
  </EmailHtml>
);

const main = { backgroundColor: "#050609", fontFamily: "serif", color: "#F9FAFB" };
const container = { margin: "0 auto", padding: "40px 20px" };
const eyebrow = { color: "#C9A96E", fontSize: "12px", letterSpacing: "2px", fontWeight: "bold", fontFamily: "monospace" };
const h1 = { fontSize: "28px", fontWeight: "bold", marginTop: "10px" };
const text = { fontSize: "16px", lineHeight: "1.6", color: "#E5E7EB" };
const highlight = { color: "#FBBF24" };
const section = { padding: "24px", backgroundColor: "#0B0C12", borderRadius: "12px", border: "1px solid #1b2230", marginTop: "24px" };
const sectionTitle = { fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" as const, color: "#C9A96E", letterSpacing: "1.5px", fontFamily: "monospace", marginBottom: "12px" };
const link = { color: "#FBBF24", textDecoration: "underline", display: "block", marginTop: "8px", fontSize: "16px" };
const footnote = { fontSize: "13px", lineHeight: "1.6", color: "#9CA3AF", marginTop: "16px", fontStyle: "italic" as const };
const hr = { borderColor: "#1b2230", margin: "40px 0" };
const footer = { color: "#9CA3AF", fontSize: "12px", textAlign: "center" as const };
