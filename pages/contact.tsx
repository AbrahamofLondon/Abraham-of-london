// pages/contact.tsx
import Head from 'next/head';
import React, { useState } from 'react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' }); // Clear form
      } else {
        setStatus(`error: ${data.message || 'Something went wrong.'}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('error: Network error or API unreachable.');
    }
  };

  return (
    <>
      <Head>
        <title>Contact | Abraham of London</title>
        <meta name="description" content="Get in touch with Abraham of London for inquiries, collaborations, or support." />
      </Head>
      <section className="container mx-auto py-10 px-4">
        <h1 className="text-4xl font-display font-bold text-primary mb-8 text-center">Contact Me</h1>
        <div className="max-w-xl mx-auto bg-warmWhite p-8 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-charcoal font-semibold mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-softGrey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-charcoal font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-softGrey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-charcoal font-semibold mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-softGrey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-primary text-cream font-bold rounded-md hover:bg-gold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>
            {status && status !== 'sending' && (
              <p
                className={`text-center mt-4 ${
                  status.startsWith('error') ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {status.replace('error: ', '')}
              </p>
            )}
          </form>

          {/* Contact Details Section */}
          <div className="mt-8 text-center text-charcoal">
            <h2 className="text-2xl font-bold mb-4">Or Reach Me Directly</h2>
            <p className="mb-2">
              <strong>Email:</strong> <a href="mailto:info@abrahamoflondon.org" className="text-primary hover:underline">info@abrahamoflondon.org</a>
            </p>
            <p>
              <strong>Tel:</strong> <a href="tel:+442086625909" className="text-primary hover:underline">+442086625909</a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;