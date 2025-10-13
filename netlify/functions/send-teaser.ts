import { Handler } from "@netlify/functions";
import { Resend } from "resend";
import { render } from "@react-email/render";
import TeaserEmail from "../../components/emails/TeaserEmail";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.MAIL_FROM!;
const ADMIN = process.env.MAIL_ADMIN!;
const SITE_URL = process.env.SITE_URL || "https://www.abrahamoflondon.org";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, name } = JSON.parse(event.body || "{}");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { statusCode: 400, body: "Invalid email" };
    }

    // HTML + Text
    const html = render(<TeaserEmail name={name} siteUrl={SITE_URL} />);
    const text =
`Friends—
I’m releasing Fathering Without Fear, a memoir forged in the middle of loss, legal storms, and a father’s stubborn hope.

Teaser PDFs:
A4/Letter: ${SITE_URL}/downloads/Fathering_Without_Fear_Teaser-A4.pdf
Mobile: ${SITE_URL}/downloads/Fathering_Without_Fear_Teaser-Mobile.pdf

Want chapter drops and launch dates? Reply "keep me posted" or join the list here: ${SITE_URL}/contact

Grace and courage,
Abraham of London`;

    // Send to reader
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Fathering Without Fear — the story they thought they knew",
      html,
      text,
      reply_to: FROM,
      headers: { "List-Unsubscribe": "<mailto:" + FROM.replace(/.*<|>.*/g, "") + "?subject=stop>" },
    });

    // Notify admin (optional)
    await resend.emails.send({
      from: FROM,
      to: ADMIN,
      subject: "Teaser sent",
      text: `Teaser sent to ${email}${name ? ` (name: ${name})` : ""}`,
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err: any) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  }
};
