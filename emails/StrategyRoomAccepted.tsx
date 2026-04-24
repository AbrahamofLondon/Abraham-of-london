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
}

export const StrategyRoomAcceptedEmail = ({
  fullName,
  decisionStatement,
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

const footer = {
  color: "#9CA3AF",
  fontSize: "12px",
  textAlign: "center" as const,
};
