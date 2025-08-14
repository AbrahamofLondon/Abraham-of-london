// pages/api/contact.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { name = '', email = '', subject = '', message = '' } = req.body || {};

    if (!email || !message) {
      return res.status(400).json({ message: 'Required: email, message' });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // TODO: integrate with your mail provider (Nodemailer / SendGrid / etc.)
    console.log('Contact form:', { name, email, subject, messageLength: String(message).length });

    return res.status(200).json({ ok: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Contact API error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
