// netlify/functions/send-contact.ts

type HeadersMap = Record<string, string>;
type NetlifyResult = { statusCode: number; headers?: HeadersMap; body: string };

// Minimal event shape we actually use
type EventLike = {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body?: string | null;
};

const json = (obj: unknown) => JSON.stringify(obj);

export const handler = async (event: EventLike): Promise<NetlifyResult> => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': event.headers.origin ?? '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST' },
      body: 'Method Not Allowed',
    };
  }

  const cors: HeadersMap = {
    'Access-Control-Allow-Origin': event.headers.origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const { name = '', email = '', subject = '', message = '' } = JSON.parse(event.body ?? '{}');

    if (!email || !message) {
      return { statusCode: 400, headers: cors, body: json({ error: 'Required: email, message' }) };
    }

    // TODO: send email via your provider (SendGrid/Mailgun/Nodemailer)
    // console.log({ name, email, subject, messageLength: String(message).length });

    return { statusCode: 200, headers: cors, body: json({ ok: true }) };
  } catch {
    return { statusCode: 500, headers: cors, body: json({ error: 'Internal Server Error' }) };
  }
};

export default handler;




