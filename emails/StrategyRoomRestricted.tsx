/* emails/StrategyRoomRestricted.tsx — sent when Strategy Room admission is RESTRICTED */
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
import { EmailLinks } from "@/lib/email/links";

interface EmailProps {
  fullName: string;
  decisionStatement: string;
  referenceId: string;
  reasons: string[];
  missingEvidence: string[];
  repairActions: string[];
  returnPath: string;
  currentEvidenceTier?: string | null;
  requiredEvidenceTier?: string | null;
}

export const StrategyRoomRestrictedEmail = ({
  fullName,
  decisionStatement,
  referenceId,
  reasons,
  missingEvidence,
  repairActions,
  returnPath,
  currentEvidenceTier,
  requiredEvidenceTier,
}: EmailProps) => (
  <EmailHtml lang="en">
    <EmailHead />
    <Preview>Strategy Room — case recorded, admission restricted</Preview>

    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>STRATEGY ROOM · ADMISSION RESTRICTED</Text>
        <Heading style={h1}>Your case has been recorded.</Heading>

        <Text style={text}>Greetings {fullName},</Text>

        <Text style={text}>
          Your Strategy Room inquiry regarding:
          <strong style={highlight}> &ldquo;{decisionStatement}&rdquo;</strong> has been received
          and your case reference preserved.
        </Text>

        <Text style={text}>
          The system has determined that admission is not yet justified based on the evidence available.
          This is not a rejection — it is governed preparation.
        </Text>

        {(currentEvidenceTier || requiredEvidenceTier) && (
          <Section style={section}>
            <Text style={sectionTitle}>Evidence status</Text>
            {currentEvidenceTier && <Text style={listItem}>Current evidence tier: {currentEvidenceTier}</Text>}
            {requiredEvidenceTier && <Text style={listItem}>Required for Strategy Room: {requiredEvidenceTier}</Text>}
          </Section>
        )}

        <Section style={section}>
          <Text style={sectionTitle}>What is missing</Text>
          {missingEvidence.map((item, i) => (
            <Text key={i} style={listItem}>• {item}</Text>
          ))}
        </Section>

        <Section style={section}>
          <Text style={sectionTitle}>Repair actions</Text>
          {repairActions.map((item, i) => (
            <Text key={i} style={listItem}>• {item}</Text>
          ))}
        </Section>

        <Section style={section}>
          <Text style={sectionTitle}>Your case reference</Text>
          <Text style={refText}>{referenceId}</Text>
          <Text style={text}>
            You do not need to start again. Your case and evidence are preserved.
            Return after completing the required steps.
          </Text>

          <Link href={`${EmailLinks.home}${returnPath.replace(/^\//, "")}`} style={link}>
            → Continue building evidence
          </Link>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Abraham of London · Decision Infrastructure · Earned-Access Institution
        </Text>
      </Container>
    </Body>
  </EmailHtml>
);

const main = {
  backgroundColor: "#050609",
  fontFamily: "serif",
  color: "#F9FAFB",
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
};

const eyebrow = {
  color: "rgba(252,165,165,0.70)",
  fontSize: "12px",
  letterSpacing: "2px",
  fontWeight: "bold",
  fontFamily: "monospace",
};

const h1 = {
  fontSize: "28px",
  fontWeight: "bold",
  marginTop: "10px",
};

const text = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#E5E7EB",
};

const highlight = {
  color: "#FBBF24",
};

const section = {
  padding: "24px",
  backgroundColor: "#0B0C12",
  borderRadius: "12px",
  border: "1px solid #1b2230",
  marginTop: "24px",
};

const sectionTitle = {
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  color: "rgba(252,165,165,0.60)",
  letterSpacing: "1.5px",
  fontFamily: "monospace",
  marginBottom: "12px",
};

const listItem = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "rgba(255,255,255,0.60)",
  marginBottom: "4px",
};

const refText = {
  fontSize: "13px",
  fontFamily: "monospace",
  color: "rgba(255,255,255,0.40)",
  letterSpacing: "0.5px",
  marginBottom: "12px",
};

const link = {
  color: "#FBBF24",
  textDecoration: "underline",
  display: "block",
  marginTop: "8px",
};

const hr = {
  borderColor: "#1b2230",
  margin: "40px 0",
};

const footer = {
  color: "#9CA3AF",
  fontSize: "12px",
  textAlign: "center" as const,
};
