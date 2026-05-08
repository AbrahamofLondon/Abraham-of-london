/* emails/StrategyRoomAccepted.tsx */
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
  evidenceTier?: string | null;
  caseId?: string | null;
  directive?: string | null;
}

export const StrategyRoomAcceptedEmail = ({
  fullName,
  decisionStatement,
  evidenceTier,
  caseId,
  directive,
}: EmailProps) => (
  <EmailHtml lang="en">
    <EmailHead />
    <Preview>Strategy Room access confirmed</Preview>

    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>STRATEGIC INTAKE · BOARD-GRADE</Text>
        <Heading style={h1}>Execution Access Confirmed</Heading>

        <Text style={text}>Greetings {fullName},</Text>

        <Text style={text}>
          Your Strategy Room entry regarding the decision:
          <strong style={highlight}> “{decisionStatement}”</strong> has been accepted.
        </Text>

        <Section style={section}>
          <Text style={sectionTitle}>Admissibility Review</Text>
          <Text style={reviewRow}>Status: Admitted</Text>
          {evidenceTier && <Text style={reviewRow}>Evidence tier: {evidenceTier}</Text>}
          {directive && <Text style={reviewRow}>Directive: {directive}</Text>}
          {caseId && <Text style={reviewRow}>Case reference: {caseId}</Text>}
          <Text style={reviewRow}>Pre-commitment: Confirmed</Text>
          <Text style={reviewNote}>
            Your admission was evaluated against diagnostic evidence, decision specificity, authority signal, and readiness. This is not a generic confirmation.
          </Text>
        </Section>

        <Section style={section}>
          <Text style={sectionTitle}>Execution References</Text>
          <Text style={text}>
            The execution environment is now live. Use the decision references below before you proceed:
          </Text>

          <Link
            href={EmailLinks.downloads("purpose-pyramid-worksheet")}
            style={link}
          >
            → The Purpose Pyramid (Strategic Dossier)
          </Link>

          <Link
            href={EmailLinks.downloads("decision-matrix-scorecard")}
            style={link}
          >
            → The Decision Matrix (Operational Logic)
          </Link>

          <Link href={EmailLinks.strategyRoom} style={link}>
            → Enter Strategy Room
          </Link>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Abraham of London · Strategic Editorials & Institutional Design
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
  color: "#FBBF24",
  fontSize: "12px",
  letterSpacing: "2px",
  fontWeight: "bold",
};

const h1 = {
  fontSize: "32px",
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
  fontSize: "14px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  color: "#D4AF37",
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

const reviewRow = {
  fontSize: "14px",
  lineHeight: "1.4",
  color: "#D4D4D4",
  fontFamily: "monospace",
  marginBottom: "4px",
};

const reviewNote = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#9CA3AF",
  marginTop: "12px",
  fontStyle: "italic" as const,
};

const footer = {
  color: "#9CA3AF",
  fontSize: "12px",
  textAlign: "center" as const,
};
