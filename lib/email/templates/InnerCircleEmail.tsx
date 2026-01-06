import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface InnerCircleEmailProps {
  name?: string;
  accessKey: string;
  unlockUrl: string;
  mode?: 'register' | 'resend';
}

export function InnerCircleEmail({
  name,
  accessKey,
  unlockUrl,
  mode = 'register',
}: InnerCircleEmailProps) {
  const isResend = mode === 'resend';
  const greeting = name ? `Dear ${name},` : 'Hello,';
  
  return (
    <Html>
      <Head />
      <Preview>
        {isResend 
          ? 'Your Canon Inner Circle access link (resent)' 
          : 'Your Canon Inner Circle access key'
        }
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isResend ? '🔁 Access Link Resent' : '✨ Welcome to the Inner Circle'}
          </Heading>
          
          <Text style={text}>{greeting}</Text>
          
          {isResend ? (
            <Text style={text}>
              As requested, here is your access link to the Canon Inner Circle:
            </Text>
          ) : (
            <Text style={text}>
              Thank you for registering for the Inner Circle. This is your personal access key:
            </Text>
          )}
          
          <Section style={codeContainer}>
            <Text style={code}>{accessKey}</Text>
          </Section>
          
          <Text style={text}>
            To activate your access, click the link below:
          </Text>
          
          <Section style={buttonContainer}>
            <Link href={unlockUrl} style={button}>
              {isResend ? 'Access Inner Circle' : 'Activate Inner Circle Access'}
            </Link>
          </Section>
          
          <Text style={text}>
            Or copy and paste this URL into your browser:
          </Text>
          
          <Text style={linkText}>{unlockUrl}</Text>
          
          <Hr style={hr} />
          
          <Text style={text}>
            <strong>Important:</strong> This access key is personal and should not be shared.
            It will grant you access to exclusive Canon content and features.
          </Text>
          
          {isResend ? (
            <Text style={footer}>
              This link was resent at your request. If you did not request a new link,
              please contact support immediately.
            </Text>
          ) : (
            <Text style={footer}>
              If you did not request this access, please ignore this email.
            </Text>
          )}
          
          <Text style={signature}>
            Best regards,
            <br />
            The Abraham of London Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};

const h1 = {
  color: '#1a202c',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.25',
  margin: '0 0 30px',
  textAlign: 'center' as const,
};

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};

const codeContainer = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '8px',
  margin: '30px 0',
  padding: '20px',
  textAlign: 'center' as const,
};

const code = {
  color: '#ffffff',
  fontFamily: 'monospace',
  fontSize: '28px',
  fontWeight: '700',
  letterSpacing: '1px',
  margin: '0',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#1a202c',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  transition: 'all 0.2s ease',
};

const linkText = {
  color: '#3182ce',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '15px 0',
  wordBreak: 'break-all' as const,
  backgroundColor: '#edf2f7',
  padding: '12px',
  borderRadius: '4px',
  fontFamily: 'monospace',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '30px 0',
};

const footer = {
  color: '#718096',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '20px 0',
  fontStyle: 'italic',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '30px 0 0',
  fontWeight: '600',
};

export default InnerCircleEmail;

