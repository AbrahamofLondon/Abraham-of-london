// components/EmailSignup.tsx
import React, { useState } from 'react';

const EmailSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Integrate with Mailchimp or any email provider here
    setSubmitted(true);
  };

  return (
    <section className="bg-blue-50 py-16">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Join the Legacy Circle
        </h2>
        <p className="text-gray-600 mb-6">
          Subscribe to receive exclusive insights, fatherhood wisdom, and book updates.
        </p>
        {submitted ? (
          <p className="text-green-600 text-lg font-medium">
            Thank you for subscribing!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default EmailSignup;
