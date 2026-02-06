import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendAccessRequestEmail = async (userEmail: string, assetTitle: string, slug: string) => {
  try {
    await resend.emails.send({
      from: 'Vault <vault@yourdomain.com>',
      to: 'your-email@domain.com', // Your private institutional email
      subject: `[ACCESS REQUEST] ${assetTitle}`,
      html: `
        <div style="font-family: serif; max-width: 600px; margin: auto; padding: 40px; background-color: #000; color: #fff; border: 1px solid #333;">
          <h2 style="font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; color: #fff;">Institutional Request</h2>
          <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
          <p style="color: #888; font-size: 14px; line-height: 1.6;">
            A request for access has been initiated for the following intelligence brief:
          </p>
          <div style="background: #111; padding: 20px; border-left: 2px solid #fff; margin: 20px 0;">
            <strong style="display: block; color: #fff;">${assetTitle}</strong>
            <span style="color: #555; font-size: 12px;">ID: ${slug}</span>
          </div>
          <p style="color: #888; font-size: 14px;">
            <strong>Requester:</strong> ${userEmail}
          </p>
          <hr style="border: 0; border-top: 1px solid #222; margin: 40px 0;" />
          <p style="font-size: 10px; color: #444; text-transform: uppercase; letter-spacing: 0.1em;">
            Abraham of London &copy; 2026 Registry 
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Mail Error:", error);
    return { success: false };
  }
};