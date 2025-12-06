import { Resend } from "resend";
import { InnerCircleEmail } from "./templates/InnerCircleEmail";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey && process.env.NODE_ENV === "production") {
  console.warn("[InnerCircleEmail] RESEND_API_KEY is not configured.");
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendInnerCircleEmailArgs {
  email: string;
  name?: string;
  accessKey: string;
  unlockUrl: string;
  mode?: "register" | "resend";
}

export async function sendInnerCircleEmail(
  args: SendInnerCircleEmailArgs
): Promise<{ success: boolean; error?: string }> {
  // Validate inputs
  if (!args.email || !args.accessKey || !args.unlockUrl) {
    return {
      success: false,
      error: "Missing required email parameters"
    };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(args.email)) {
    return {
      success: false,
      error: "Invalid email address"
    };
  }

  // Development mode - simulate sending
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[InnerCircleEmail] Simulated email:", {
        to: args.email,
        name: args.name || "User",
        unlockUrl: args.unlockUrl,
        accessKey: args.accessKey,
        mode: args.mode || "register"
      });
      return { success: true };
    }
    
    return {
      success: false,
      error: "Email sending is not configured (missing RESEND_API_KEY)"
    };
  }

  try {
    const fromAddress =
      process.env.INNER_CIRCLE_FROM_EMAIL ??
      process.env.MAIL_FROM ??
      "Inner Circle <innercircle@abrahamoflondon.org>";

    const subject =
      args.mode === "resend"
        ? "Your Canon Inner Circle access link (resent)"
        : "Your Canon Inner Circle access key";

    // Generate plain text version
    const textVersion = `
${args.name ? `Dear ${args.name},` : 'Hello,'}

${args.mode === 'resend' 
  ? 'As requested, here is your access link to the Canon Inner Circle:' 
  : 'Thank you for registering for the Inner Circle. This is your personal access key:'}

${args.accessKey}

To activate your access, visit this URL:
${args.unlockUrl}

This access key is personal and should not be shared. It will grant you access to exclusive Canon content and features.

${args.mode === 'resend' 
  ? 'This link was resent at your request. If you did not request a new link, please contact support immediately.' 
  : 'If you did not request this access, please ignore this email.'}

Best regards,
The Abraham of London Team
    `.trim();

    // Generate HTML version using React
    const React = await import('react');
    const { renderToString } = await import('react-dom/server');
    
    const emailElement = React.createElement(InnerCircleEmail, {
      name: args.name,
      accessKey: args.accessKey,
      unlockUrl: args.unlockUrl,
      mode: args.mode ?? "register",
    });
    
    const htmlVersion = renderToString(emailElement);

    const result = await resend.emails.send({
      from: fromAddress,
      to: args.email,
      subject,
      html: htmlVersion,
      text: textVersion,
    });

    if (result.error) {
      console.error("[InnerCircleEmail] Resend error:", result.error);
      return {
        success: false,
        error: `Email sending failed: ${result.error.message || 'Unknown error'}`
      };
    }

    console.log(`[InnerCircleEmail] Sent successfully to ${args.email}, ID: ${result.data?.id}`);
    
    return { success: true };
  } catch (error) {
    console.error("[InnerCircleEmail] Unexpected error:", error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown email sending error"
    };
  }
}

// Helper function to test email configuration
export function checkEmailConfiguration(): {
  configured: boolean;
  apiKeyPresent: boolean;
  fromAddress: string;
  environment: string;
} {
  const apiKeyPresent = !!process.env.RESEND_API_KEY;
  const fromAddress = 
    process.env.INNER_CIRCLE_FROM_EMAIL ??
    process.env.MAIL_FROM ??
    "Inner Circle <innercircle@abrahamoflondon.org>";
  const environment = process.env.NODE_ENV || "development";
  
  return {
    configured: apiKeyPresent || environment !== "production",
    apiKeyPresent,
    fromAddress,
    environment,
  };
}

// Test function for development
export async function testEmailSending(): Promise<boolean> {
  console.log("Testing email configuration...");
  
  const config = checkEmailConfiguration();
  console.log("Configuration:", config);
  
  if (!config.configured) {
    console.warn("⚠️ Email is not properly configured for production!");
    return false;
  }
  
  const testArgs: SendInnerCircleEmailArgs = {
    email: "test@example.com",
    name: "Test User",
    accessKey: "TEST-1234-ABCD-5678",
    unlockUrl: "https://abrahamoflondon.org/api/inner-circle/unlock?key=TEST-1234-ABCD-5678&returnTo=/canon",
    mode: "register"
  };
  
  console.log("Sending test email...");
  
  const result = await sendInnerCircleEmail(testArgs);
  
  if (result.success) {
    console.log("✅ Email test successful!");
    return true;
  } else {
    console.error("❌ Email test failed:", result.error);
    return false;
  }
}