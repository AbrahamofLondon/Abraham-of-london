// pages/contact.tsx

import Head from 'next/head';
import React, { useState } from 'react';
import Layout from '../components/Layout';

export default function Contact() {
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormStatus('submitting');

    try {
      const formData = new FormData(event.currentTarget);
      const data = new URLSearchParams();
      
      // Netlify requires this hidden field
      data.append('form-name', 'contact');
      
      // Iterate over formData entries and append them to URLSearchParams
      for (const [key, value] of Array.from(formData.entries())) {
        data.append(key, value.toString());
      }
      
      // Correct submission endpoint is the page itself
      await fetch(event.currentTarget.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data.toString(),
      });

      setFormStatus('success');
      event.currentTarget.reset();
    } catch (error) {
      console.error('Form submission failed:', error);
      setFormStatus('error');
    }
  };

  const isSubmitting = formStatus === 'submitting';

  return (
    <Layout>
      <Head>
        <title>Contact Abraham of London</title>
        <meta
          name="description"
          content="Get in touch with Abraham of London for speaking engagements, book signings, and other inquiries."
        />
      </Head>

      <main className="container px-4 py-12">
        <h1 className="text-4xl font-serif tracking-brand text-forest mb-4">
          Contact
        </h1>
        <p className="text-lg mb-8 text-deepCharcoal max-w-2xl">
          Get in touch with Abraham for speaking engagements, media inquiries, or
          just to say hello.
        </p>

        {/* Status messages */}
        {formStatus === 'success' && (
          <div className="bg-green-100 text-green-800 p-4 rounded mb-6">
            Thank you! Your message has been sent successfully.
          </div>
        )}
        {formStatus === 'error' && (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-6">
            There was an error sending your message. Please try again later.
          </div>
        )}

        <form
          className="w-full max-w-xl"
          name="contact"
          method="POST"
          data-netlify="true"
          onSubmit={handleSubmit}
          action="/contact" // Set the form action to the current page
        >
          {/* This input is crucial for Netlify's bot to find the form */}
          <input type="hidden" name="form-name" value="contact" />

          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-deepCharcoal mb-2"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 border border-lightGrey rounded-md focus:ring-forest focus:border-forest"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-deepCharcoal mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-lightGrey rounded-md focus:ring-forest focus:border-forest"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="message"
              className="block text-sm font-semibold text-deepCharcoal mb-2"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              className="w-full px-4 py-2 border border-lightGrey rounded-md focus:ring-forest focus:border-forest"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-forest text-cream font-bold rounded-md hover:bg-deepCharcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </main>
    </Layout>
  );
}