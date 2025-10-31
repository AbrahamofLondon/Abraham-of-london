// emails/ContactEmail.tsx
import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
} from "@react-email/components";

type Props = {
  name: string;
  email: string;
  message: string;
};

export default function ContactEmail({ name, email, message }: Props) {
  return (
    <Html>
      <Head d />
      <Preview>New enquiry from {name}</Preview>
      <Body
        style={{
          backgroundColor: "#f6f6f6",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        <Container
          style={{
            margin: "24px auto",
            padding: "24px",
            background: "#fff",
            borderRadius: 12,
            maxWidth: 560,
          }}
        >
          <Section>
            <Heading as="h2" style={{ margin: 0, color: "#0d1b2a" }}>
              New website enquiry
            </Heading>
            <Text style={{ color: "#1b263b", marginTop: 12 }}>
              <strong>Name:</strong> {name}
              <br />
              <strong>Email:</strong> {email}
            </Text>
            <Text style={{ whiteSpace: "pre-wrap", color: "#0d1b2a" }}>
              {message}
            </Text>
            <Text style={{ marginTop: 24, color: "#415a77" }}>
              Sent from abraham-of-london.netlify.app
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}


