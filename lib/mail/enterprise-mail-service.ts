import { Resend } from 'resend'; // Or your preferred provider

const resend = new Resend(process.env.RESEND_API_KEY);

interface ExecutiveBriefParams {
  email: string;
  organisationName: string;
  campaignTitle: string;
  dashboardUrl: string;
  respondentCount: number;
}

export async function sendExecutiveBriefNotification({
  email,
  organisationName,
  campaignTitle,
  dashboardUrl,
  respondentCount
}: ExecutiveBriefParams) {
  
  const date = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // The "Abraham of London" Premium Email Template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700&family=Playfair+Display:ital@1&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #f9f7f2; margin: 0; padding: 40px; color: #2c2416; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 60px; border: 1px solid #e8e0d4; }
        .header { border-bottom: 1px solid #e8e0d4; padding-bottom: 30px; margin-bottom: 40px; }
        .label { font-family: monospace; font-size: 10px; text-transform: uppercase; tracking: 0.3em; color: #8a6a2f; }
        .title { font-family: 'Playfair Display', serif; font-size: 28px; margin-top: 10px; color: #1a1a1a; }
        .memo-meta { font-family: monospace; font-size: 11px; line-height: 1.8; color: #9b8a6b; margin-bottom: 30px; }
        .content { font-size: 14px; line-height: 1.6; color: #4a3e2c; }
        .highlight { font-weight: bold; color: #1a1a1a; }
        .cta-container { margin-top: 50px; text-align: center; }
        .button { background-color: #1a1a1a; color: #f9f7f2 !important; padding: 18px 35px; text-decoration: none; font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.2em; display: inline-block; }
        .footer { margin-top: 60px; padding-top: 30px; border-top: 1px solid #e8e0d4; font-size: 10px; color: #c0b190; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="label">Protocol 75 // Intelligence Dispatch</div>
          <h1 class="title">Institutional Coherence Brief</h1>
        </div>

        <div class="memo-meta">
          <strong>TO:</strong> Executive Leadership Core<br />
          <strong>FROM:</strong> Abraham of London<br />
          <strong>REF:</strong> ${organisationName.toUpperCase()}-ALGN-2026<br />
          <strong>DATE:</strong> ${date}
        </div>

        <div class="content">
          <p>The institutional alignment survey for <span class="highlight">${campaignTitle}</span> has surpassed the required threshold of <strong>${respondentCount} respondents</strong>.</p>
          
          <p>The <em>Geometry of Order</em> has been finalized. We have detected structural variances that warrant immediate executive review to ensure strategic fidelity for the upcoming quarter.</p>
          
          <p>The restricted dashboard and digital artifact are now available for forensic analysis.</p>
        </div>

        <div class="cta-container">
          <a href="${dashboardUrl}" class="button">Access Intelligence Suite</a>
        </div>

        <div class="footer">
          © 2026 Abraham of London<br />
          CONFIDENTIAL // AUTHORIZED ACCESS ONLY
        </div>
      </div>
    </body>
    </html>
  `;

  return await resend.emails.send({
    from: 'Abraham of London <intelligence@abrahamoflondon.com>',
    to: [email],
    subject: `RESTRICTED: Intelligence Brief // ${organisationName}`,
    html: htmlContent,
  });
}