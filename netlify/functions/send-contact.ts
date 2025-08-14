// netlify/functions/send-contact.ts
import { render } from '@react-email/render';
import { sendEmail } from '@netlify/emails';
import type { Handler } from '@netlify/functions';
import ContactEmail from '../../emails/ContactEmail';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload: { name?: string; email?: string; message?: string } = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim();
  const message = (payload.message || '').trim();

  if (!name || !email || !message) {
    return { statusCode: 422, body: 'name, email, and message are required' };
  }

  // Render the HTML from the React Email template
  const html = render(<ContactEmail name={name} email={email} message={message} />);

  // Send using the provider you configured in Netlify (Resend)
  await sendEmail({
    from: 'Abraham of London <hello@abrahamoflondon.org>',
    to: 'info@abrahamoflondon.org',
    replyTo: email,
    subject: New enquiry from ${name},
    html,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
    headers: { 'content-type': 'application/json' },
  };
};