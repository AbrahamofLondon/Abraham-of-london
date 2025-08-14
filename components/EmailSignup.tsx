// components/EmailSignup.tsx
import React, { useState } from "react";

const EmailSignup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("initial"); // 'initial', 'submitting', 'success', 'error'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      // Replace with your actual API endpoint or serverless function
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Subscription failed.");
      }

      setStatus("success");
      setEmail(""); // Clear the input field on success
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <section className="bg-blue-50 py-16">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Join the Legacy Circle
        </h2>
        <p className="text-gray-600 mb-6">
          Subscribe to receive exclusive insights, fatherhood wisdom, and book
          updates.
        </p>
        {status === "success" ? (
          <p className="text-green-600 text-lg font-medium">
            Thank you for subscribing!
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              disabled={status === "submitting"}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Subscribing..." : "Subscribe"}
            </button>
            {status === "error" && (
              <p className="text-red-600 mt-2">
                There was an error. Please try again.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
};

export default EmailSignup;




