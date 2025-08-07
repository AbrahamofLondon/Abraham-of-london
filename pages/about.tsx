// pages/contact.tsx

import Head from 'next/head';
import React from 'react';

const ContactPage = () => {
  return (
    <>
      <Head>
        <title>Contact | Abraham of London</title>
        <meta
          name="description"
          content="Get in touch with Abraham of London for speaking engagements, media inquiries, or collaborations around fatherhood, justice, and legacy."
        />
        <meta property="og:title" content="Contact | Abraham of London" />
        <meta property="og:description" content="Reach out to Abraham for inquiries, support, and partnerships." />
        <meta property="og:image" content="/assets/social/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <section className="bg-white py-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-900">Contact</h1>
          <p className="text-lg text-gray-700">
            Whether it's about a collaboration, book inquiry, or simply to connect — Abraham would love to hear from you.
          </p>
          <div className="text-left mt-8 space-y-4">
            <p>
              📧 General inquiries:{" "}
              <a href="mailto:admin@abrahamoflondon.org" className="text-blue-600 underline">
                admin@abrahamoflondon.org
              </a>
            </p>
            <p>
              📮 Legal matters:{" "}
              <a href="mailto:info@abrahamoflondon.org" className="text-blue-600 underline">
                info@abrahamoflondon.org
              </a>
            </p>
            <p>
              📘 Press / Media:{" "}
              <a href="mailto:info@abrahamoflondon.org" className="text-blue-600 underline">
                info@abrahamoflondon.org
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactPage;
