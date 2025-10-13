import { Handler } from "@netlify/functions";
import { Resend } from "resend";
import { render } from "@react-email/render";
import WelcomeLaunchEmail from "../../components/emails/WelcomeLaunchEmail";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.MAIL_FROM!;
const ADMIN = process.env.MAIL_ADMIN!;
const SITE_URL = process.env.SITE_URL || "https://www.abrahamoflondon.org";

// If you also use Netlify Forms, this function can be called from its webhook as well.

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { email, name } = JSON.parse(event.body || "{}");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { statusCode: 400, body: "Invalid email" };
    }

    const html = render(<WelcomeLaunchEmail siteUrl={SITE_URL} name={name} />);
    const text =
`Thanks for joining the Fathering Without Fear launch list!
Grab the free teaser:
A4/Letter: ${SITE_URL}/downloads/Fathering_Without_Fear_Teaser-A4.pdf
Mobile: ${SITE_URL}/downloads/Fathering_Without_Fear_Teaser-Mobile.pdf
Unsubscribe any time by replying "stop".`;

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Welcome — Fathering Without Fear launch list",
      html,
      text,
      reply_to: FROM,
      headers: { "List-Unsubscribe": "<mailto:" + FROM.replace(/.*<|>.*/g, "") + "?subject=stop>" },
    });

    // Simple notification to you
    await resend.emails.send({
      from: FROM,
      to: ADMIN,
      subject: "New launch subscriber",
      text: `New subscriber: ${email}${name ? ` (name: ${name})` : ""}`,
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: "Server error" };
  }
};
