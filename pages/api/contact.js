// pages/api/contact.js

// This is a basic example. For a production application, you would
// integrate with an actual email sending service like Nodemailer, SendGrid, Mailgun, etc.
// Ensure you handle sensitive API keys securely using environment variables.

export default async function handler(req, res) {
  // Only allow POST requests to this API route
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, subject, message } = req.body;

  // Basic server-side validation (additional validation libraries are recommended for production)
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Validate email format
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  try {
    // --- THIS IS WHERE YOU WOULD INTEGRATE YOUR EMAIL SENDING LOGIC ---
    //
    // Example using a hypothetical email sending library (e.g., Nodemailer setup):
    /*
    const nodemailer = require('nodemailer'); // You would install nodemailer: npm install nodemailer

    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,      // e.g., 'smtp.mailtrap.io' or your email provider's SMTP host
      port: process.env.EMAIL_PORT,      // e.g., 2525 or 587 (for TLS)
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,    // your email account
        pass: process.env.EMAIL_PASSWORD // your email password or app-specific password
      }
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`, // Sender address from form
      to: 'your-receiving-email@example.com', // Your email address where you want to receive messages
      subject: `New Contact Form: ${subject}`, // Subject line
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`, // Plain text body
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `, // HTML body
    });
    */

    // For now, we'll just log the data and send a success response
    console.log('Received contact form submission:');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Subject:', subject);
    console.log('Message:', message);
    console.log('--- End of submission ---');

    // Send a success response back to the client
    return res.status(200).json({ message: 'Message sent successfully!' });

  } catch (error) {
    console.error('Error handling contact form submission:', error);
    // Send an error response back to the client
    return res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
}