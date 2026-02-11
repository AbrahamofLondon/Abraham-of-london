/* lib/intelligence/notification-delegate.ts */
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function notifyPrincipalOfPriority(inquiry: any) {
  // Primary and Backup recipients
  const recipients = [
    process.env.ADMIN_NOTIFICATION_EMAIL,
    process.env.BACKUP_NOTIFICATION_EMAIL // Secondary redundancy
  ].filter(Boolean).join(", ");

  const mailOptions = {
    from: `"AoL Intelligence" <system@abraham-of-london.com>`,
    to: recipients,
    subject: `⚠️ PRIORITY INTAKE: ${inquiry.name}`,
    html: `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; background: #050505; color: #fff; border: 1px solid #1a1a1a;">
        <h1 style="text-transform: uppercase; letter-spacing: 3px; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; color: #f59e0b;">Institutional Alert</h1>
        <p style="font-size: 10px; color: #555; text-transform: uppercase; font-family: monospace;">
          REF: ${inquiry.id} // SCORE: ${inquiry.metadata.priorityScore}
        </p>
        
        <div style="margin-top: 30px; border-left: 2px solid #333; padding-left: 20px;">
          <p style="margin: 5px 0;"><strong style="color: #888;">Principal:</strong> ${inquiry.name}</p>
          <p style="margin: 5px 0;"><strong style="color: #888;">Email:</strong> ${inquiry.email}</p>
          <p style="margin-top: 20px; font-style: italic; color: #ddd; line-height: 1.6;">
            "${inquiry.intent}"
          </p>
        </div>

        <div style="margin-top: 40px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/command-wall" 
             style="display: inline-block; background: #fff; color: #000; padding: 14px 28px; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">
             Authenticate & Review
          </a>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

export async function sendOnboardingWelcome(member: any, rawKey: string) {
  const mailOptions = {
    from: `"Abraham of London" <vault@abraham-of-london.com>`,
    to: member.email,
    subject: "Sequence Initialized: Access Authorized",
    html: `
      <div style="font-family: serif; padding: 50px; background: #000; color: #fff;">
        <h2 style="text-transform: uppercase; letter-spacing: 4px; color: #f59e0b;">Authorization Granted</h2>
        <p style="color: #888; font-size: 12px; margin-bottom: 30px;">STRATEGIC_INTELLIGENCE_NETWORK // LEVEL 4</p>
        
        <p>Principal ${member.name},</p>
        <p>Your access to the 75 intelligence briefs has been authorized. Use the institutional key below to authenticate your session.</p>
        
        <div style="background: #111; padding: 20px; border: 1px solid #333; font-family: monospace; color: #f59e0b; font-size: 18px; margin: 30px 0; text-align: center;">
          ${rawKey}
        </div>

        <p style="font-size: 11px; color: #555;">SECURITY WARNING: This key is unique to your identity. Do not share or store in unencrypted environments.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login" 
           style="display: inline-block; margin-top: 30px; background: #fff; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 10px;">
           Enter Strategy Room
        </a>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

export async function notifyPrincipalOfSecurityAction(member: any, action: string) {
  const isSuspension = action === "SUSPENSION_DORMANCY";
  
  const mailOptions = {
    from: `"AoL Security" <security@abraham-of-london.com>`,
    to: member.email,
    subject: isSuspension ? "ACCESS PAUSED: Security Protocol" : "Security Update",
    html: `
      <div style="font-family: serif; padding: 50px; background: #0a0a0a; color: #fff; border: 2px solid #991b1b;">
        <h2 style="text-transform: uppercase; letter-spacing: 2px; color: #ef4444;">Security Alert</h2>
        <p>Principal ${member.name},</p>
        <p>In accordance with <strong>Institutional Dormancy Policy</strong>, your active session has been paused due to 30+ days of inactivity.</p>
        <div style="margin: 30px 0; padding: 20px; background: #1a1a1a; border-left: 4px solid #ef4444;">
          <p style="margin: 0; font-size: 13px; color: #ddd;">STATUS: <strong>SUSPENDED</strong></p>
          <p style="margin: 0; font-size: 13px; color: #ddd;">KEYS: <strong>REVOKED</strong></p>
        </div>
        <p>To restore access, please contact a Senior Admin or initiate a re-authentication sequence.</p>
        <p style="font-size: 10px; color: #444; margin-top: 40px;">REF: ${action} // ${new Date().toISOString()}</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}