// lib/inner-circle/templates/InnerCircleEmail.tsx
import React from "react";
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
  Img,
  Row,
  Column,
} from "@react-email/components";

interface InnerCircleEmailProps {
  name?: string;
  email: string;
  accessKey: string;
  unlockUrl: string;
  expiresIn?: string;
  requestIp?: string;
  requestLocation?: string;
  mode?: "register" | "resend" | "access_request" | "welcome" | "security_alert";
  supportContact?: string;
  additionalInstructions?: string;
  features?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
}

export function InnerCircleEmail({
  name,
  email,
  accessKey,
  unlockUrl,
  expiresIn = "24 hours",
  requestIp = "Unknown",
  requestLocation = "Unknown",
  mode = "register",
  supportContact = "support@abrahamoflondon.com",
  additionalInstructions,
  features = [
    {
      title: "Exclusive Content",
      description: "Access to premium articles, strategies, and insights",
      icon: "📚"
    },
    {
      title: "Private Community",
      description: "Connect with other members in our private forum",
      icon: "👥"
    },
    {
      title: "Live Sessions",
      description: "Join exclusive webinars and Q&A sessions",
      icon: "🎥"
    },
    {
      title: "Early Access",
      description: "Be the first to see new features and content",
      icon: "🚀"
    }
  ]
}: InnerCircleEmailProps) {
  const isResend = mode === "resend";
  const isSecurityAlert = mode === "security_alert";
  const isWelcome = mode === "welcome";
  const isAccessRequest = mode === "access_request";
  
  const greeting = name ? `Dear ${name},` : "Hello,";

  const getSubject = () => {
    switch (mode) {
      case "register":
        return "Your Canon Inner Circle Access Key";
      case "resend":
        return "Your Canon Inner Circle Access Link (Resent)";
      case "access_request":
        return "Access Request for Canon Inner Circle";
      case "welcome":
        return "Welcome to the Canon Inner Circle!";
      case "security_alert":
        return "Security Alert: New Inner Circle Access Request";
      default:
        return "Canon Inner Circle Access";
    }
  };

  const getPreviewText = () => {
    switch (mode) {
      case "register":
        return "Your exclusive access to the Inner Circle is ready. Activate now to unlock premium content.";
      case "resend":
        return "Here is your new access link to the Inner Circle, as requested.";
      case "welcome":
        return "Welcome aboard! Your Inner Circle membership is now active.";
      case "security_alert":
        return "Security notice: A new Inner Circle access request was made from your account.";
      default:
        return "Important information about your Inner Circle access.";
    }
  };

  const getHeaderIcon = () => {
    switch (mode) {
      case "security_alert":
        return "🔒";
      case "welcome":
        return "🎉";
      case "resend":
        return "↻";
      default:
        return "✨";
    }
  };

  const getMainMessage = () => {
    switch (mode) {
      case "register":
        return "Thank you for registering for the Canon Inner Circle. Below you'll find your personal access key and activation link.";
      case "resend":
        return "As requested, here is a new access link for the Canon Inner Circle. For security reasons, previous links have been invalidated.";
      case "welcome":
        return "Congratulations! Your Inner Circle membership is now active. Welcome to our exclusive community.";
      case "security_alert":
        return "A new access request for the Canon Inner Circle was made from your account. If this was you, please use the link below to complete the process.";
      case "access_request":
        return "Your request for Inner Circle access has been received. Please use the link below to complete your registration.";
      default:
        return "Important information regarding your Inner Circle access.";
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{getPreviewText()}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Row>
              <Column style={logoColumn}>
                <Img
                  src="https://abrahamoflondon.com/logo.png"
                  width="40"
                  height="40"
                  alt="Abraham of London"
                  style={logo}
                />
              </Column>
              <Column style={titleColumn}>
                <Text style={brand}>Abraham of London</Text>
                <Text style={subBrand}>Inner Circle</Text>
              </Column>
            </Row>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>
              {getHeaderIcon()} {getSubject()}
            </Heading>

            <Text style={greetingText}>{greeting}</Text>

            <Text style={paragraph}>{getMainMessage()}</Text>

            {/* Access Key Section */}
            {!isWelcome && !isSecurityAlert && (
              <>
                <Text style={sectionTitle}>Your Access Key</Text>
                <Section style={codeContainer}>
                  <Text style={code}>{accessKey}</Text>
                  <Text style={codeNote}>
                    Valid for {expiresIn} • Do not share
                  </Text>
                </Section>

                <Text style={paragraph}>
                  Click the button below to activate your access:
                </Text>

                <Section style={buttonContainer}>
                  <Link href={unlockUrl} style={button}>
                    {isResend ? "Access Inner Circle" : "Activate Membership"}
                  </Link>
                </Section>

                <Text style={smallText}>
                  Or copy and paste this URL into your browser:
                </Text>
                <Text style={linkText}>{unlockUrl}</Text>
              </>
            )}

            {/* Welcome Features */}
            {(isWelcome || mode === "register") && features && (
              <>
                <Text style={sectionTitle}>What You'll Get Access To:</Text>
                <Section style={featuresGrid}>
                  {features.map((feature, index) => (
                    <Row key={index} style={featureRow}>
                      <Column style={featureIconColumn}>
                        <Text style={featureIcon}>{feature.icon || "✓"}</Text>
                      </Column>
                      <Column style={featureContentColumn}>
                        <Text style={featureTitle}>{feature.title}</Text>
                        <Text style={featureDescription}>{feature.description}</Text>
                      </Column>
                    </Row>
                  ))}
                </Section>
              </>
            )}

            {/* Security Information */}
            {!isWelcome && (
              <>
                <Hr style={hr} />
                <Text style={sectionTitle}>Security Information</Text>
                <Section style={securityInfo}>
                  <Row>
                    <Column>
                      <Text style={securityLabel}>Request IP:</Text>
                      <Text style={securityValue}>{requestIp}</Text>
                    </Column>
                    <Column>
                      <Text style={securityLabel}>Location:</Text>
                      <Text style={securityValue}>{requestLocation}</Text>
                    </Column>
                    <Column>
                      <Text style={securityLabel}>Timestamp:</Text>
                      <Text style={securityValue}>
                        {new Date().toLocaleString('en-US', {
                          timeZone: 'UTC',
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              </>
            )}

            {/* Additional Instructions */}
            {additionalInstructions && (
              <Section style={instructionsBox}>
                <Text style={instructionsTitle}>Important Instructions:</Text>
                <Text style={instructionsText}>{additionalInstructions}</Text>
              </Section>
            )}

            {/* Action Required for Security Alert */}
            {isSecurityAlert && (
              <Section style={alertBox}>
                <Text style={alertTitle}>⚠️ Action Required</Text>
                <Text style={alertText}>
                  If you did not request Inner Circle access, please:
                </Text>
                <ol style={alertList}>
                  <li style={alertListItem}>
                    Click the link below to secure your account
                  </li>
                  <li style={alertListItem}>
                    Change your password immediately
                  </li>
                  <li style={alertListItem}>
                    Contact our support team at {supportContact}
                  </li>
                </ol>
                <Link href={`${unlockUrl}?action=secure`} style={alertButton}>
                  Secure My Account
                </Link>
              </Section>
            )}

            {/* Footer */}
            <Hr style={hr} />
            <Section style={footerSection}>
              <Text style={footerText}>
                <strong>Need Help?</strong><br />
                Contact our support team at{" "}
                <Link href={`mailto:${supportContact}`} style={footerLink}>
                  {supportContact}
                </Link>
              </Text>

              <Text style={footerText}>
                <strong>Security Tips:</strong><br />
                • Never share your access key with anyone<br />
                • Always log out from shared devices<br />
                • Use strong, unique passwords<br />
                • Enable two-factor authentication if available
              </Text>

              <Text style={disclaimer}>
                This email was sent to {email}. If you believe you received this email in error,
                please contact support immediately.
              </Text>

              <Text style={signature}>
                Best regards,<br />
                <strong>The Abraham of London Team</strong>
              </Text>

              {/* Social Links */}
              <Section style={socialContainer}>
                <Link href="https://twitter.com/abrahamoflondon" style={socialLink}>
                  Twitter
                </Link>
                <span style={socialDivider}>•</span>
                <Link href="https://linkedin.com/company/abrahamoflondon" style={socialLink}>
                  LinkedIn
                </Link>
                <span style={socialDivider}>•</span>
                <Link href="https://abrahamoflondon.com" style={socialLink}>
                  Website
                </Link>
              </Section>

              <Text style={copyright}>
                © {new Date().getFullYear()} Abraham of London. All rights reserved.<br />
                Canon Inner Circle • Premium Membership
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: "20px 0",
  color: "#334155",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  maxWidth: "600px",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  overflow: "hidden",
};

const header = {
  background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
  padding: "24px 32px",
  textAlign: "center" as const,
};

const logoColumn = {
  width: "60px",
  verticalAlign: "middle",
};

const titleColumn = {
  verticalAlign: "middle",
  paddingLeft: "16px",
};

const logo = {
  display: "block",
  borderRadius: "8px",
};

const brand = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0",
  textAlign: "left" as const,
};

const subBrand = {
  color: "#cbd5e1",
  fontSize: "14px",
  margin: "2px 0 0",
  textAlign: "left" as const,
};

const content = {
  padding: "40px 32px",
};

const h1 = {
  color: "#1e293b",
  fontSize: "28px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const greetingText = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 20px",
};

const paragraph = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const sectionTitle = {
  color: "#1e293b",
  fontSize: "18px",
  fontWeight: "600",
  margin: "32px 0 16px",
  paddingBottom: "8px",
  borderBottom: "2px solid #e2e8f0",
};

const codeContainer = {
  background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
  borderRadius: "10px",
  margin: "24px 0",
  padding: "24px",
  textAlign: "center" as const,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
};

const code = {
  color: "#ffffff",
  fontFamily: "'SF Mono', Monaco, 'Courier New', monospace",
  fontSize: "28px",
  fontWeight: "700",
  letterSpacing: "1.5px",
  margin: "0",
  textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
};

const codeNote = {
  color: "#cbd5e1",
  fontSize: "12px",
  margin: "8px 0 0",
  opacity: 0.9,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0 24px",
};

const button = {
  backgroundColor: "#1e293b",
  backgroundImage: "linear-gradient(to right, #1e293b, #334155)",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 40px",
  transition: "all 0.2s ease",
  boxShadow: "0 4px 12px rgba(30, 41, 59, 0.2)",
};

const smallText = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "16px 0 8px",
};

const linkText = {
  color: "#475569",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 24px",
  wordBreak: "break-all" as const,
  backgroundColor: "#f1f5f9",
  padding: "12px 16px",
  borderRadius: "6px",
  fontFamily: "'SF Mono', Monaco, monospace",
  border: "1px solid #e2e8f0",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const featuresGrid = {
  margin: "24px 0",
};

const featureRow = {
  marginBottom: "16px",
};

const featureIconColumn = {
  width: "40px",
  verticalAlign: "top",
};

const featureContentColumn = {
  verticalAlign: "top",
  paddingLeft: "12px",
};

const featureIcon = {
  fontSize: "24px",
  margin: "0",
};

const featureTitle = {
  color: "#1e293b",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 4px",
};

const featureDescription = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};

const securityInfo = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "16px",
  border: "1px solid #e2e8f0",
};

const securityLabel = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const securityValue = {
  color: "#475569",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const instructionsBox = {
  backgroundColor: "#fef3c7",
  borderLeft: "4px solid #d97706",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
};

const instructionsTitle = {
  color: "#92400e",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const instructionsText = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};

const alertBox = {
  backgroundColor: "#fee2e2",
  borderLeft: "4px solid #dc2626",
  borderRadius: "6px",
  padding: "20px",
  margin: "24px 0",
};

const alertTitle = {
  color: "#7f1d1d",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 12px",
};

const alertText = {
  color: "#7f1d1d",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 12px",
};

const alertList = {
  color: "#7f1d1d",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 16px",
  paddingLeft: "20px",
};

const alertListItem = {
  marginBottom: "8px",
};

const alertButton = {
  backgroundColor: "#dc2626",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footerSection = {
  marginTop: "32px",
};

const footerText = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const footerLink = {
  color: "#3b82f6",
  textDecoration: "underline",
};

const disclaimer = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "24px 0",
  fontStyle: "italic",
};

const signature = {
  color: "#1e293b",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "24px 0 32px",
};

const socialContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const socialLink = {
  color: "#64748b",
  fontSize: "14px",
  textDecoration: "none",
  margin: "0 8px",
};

const socialDivider = {
  color: "#cbd5e1",
  margin: "0 8px",
};

const copyright = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "24px 0 0",
  textAlign: "center" as const,
};

export default InnerCircleEmail;

// Additional utility component for sending emails
export function createEmailProps(
  props: Omit<InnerCircleEmailProps, 'features'>,
  options?: {
    includeFeatures?: boolean;
    customFeatures?: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
  }
): InnerCircleEmailProps {
  const defaultFeatures = [
    {
      title: "Exclusive Content",
      description: "Access to premium articles, strategies, and insights",
      icon: "📚"
    },
    {
      title: "Private Community",
      description: "Connect with other members in our private forum",
      icon: "👥"
    },
    {
      title: "Live Sessions",
      description: "Join exclusive webinars and Q&A sessions",
      icon: "🎥"
    },
    {
      title: "Early Access",
      description: "Be the first to see new features and content",
      icon: "🚀"
    }
  ];

  return {
    ...props,
    features: options?.customFeatures || (options?.includeFeatures !== false ? defaultFeatures : []),
    expiresIn: props.expiresIn || "24 hours",
    supportContact: props.supportContact || "support@abrahamoflondon.com",
  };
}

// Email sending utility function
export async function sendInnerCircleEmail(
  to: string,
  subject: string,
  props: InnerCircleEmailProps,
  transport?: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { render } = await import('@react-email/render');
    const emailHtml = await render(React.createElement(InnerCircleEmail, props));
    
    // In production, use your email transport
    if (transport) {
      const result = await transport.sendMail({
        to,
        subject,
        html: emailHtml,
        from: `"Abraham of London" <noreply@abrahamoflondon.com>`,
        replyTo: props.supportContact || "support@abrahamoflondon.com",
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'X-Mailer': 'Abraham of London Inner Circle',
        }
      });
      
      return { success: true, messageId: result.messageId };
    }
    
    // For development/testing
    console.log('Email would be sent to:', to);
    console.log('Subject:', subject);
    console.log('Preview URL:', `https://react.email/preview?template=${encodeURIComponent(emailHtml)}`);
    
    return { success: true, messageId: 'dev-mode' };
    
  } catch (error) {
    console.error('Error sending Inner Circle email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
