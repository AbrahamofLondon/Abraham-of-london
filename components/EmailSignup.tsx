// components/EmailSignup.tsx
import React, { useState } from "react";

const EmailSignup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"initial" | "submitting" | "success" | "error">("initial");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Subscription failed");

      setStatus("success");
      setMessage("Thank you for subscribing!");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "There was an error. Please try again.");
    }
  };

  return (
    <section className="bg-emerald-50 py-16">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-deepCharcoal mb-4">Join the Legacy Circle</h2>
        <p className="text-deepCharcoal/80 mb-6">
          Subscribe to receive exclusive insights, fatherhood wisdom, and book updates.
        </p>

        {status === "success" ? (
          <p
            className="text-green-700 text-lg font-medium"
            role="status"
            aria-live="polite"
          >
            {message || "Thank you for subscribing!"}
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 justify-center"
            aria-label="Email subscription form"
            noValidate
          >
            <label htmlFor="email-signup" className="sr-only">
              Email address
            </label>
            <input
              id="email-signup"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-lightGrey text-deepCharcoal placeholder:text-deepCharcoal/60 focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
              placeholder="Enter your email"
              disabled={status === "submitting"}
              autoComplete="email"
              aria-invalid={status === "error" ? true : undefined}
              aria-describedby={message ? "email-signup-status" : undefined}
            />

            <button
              type="submit"
              className="bg-forest text-cream px-6 py-3 rounded-full font-semibold hover:bg-forest/90 transition disabled:opacity-50"
              disabled={status === "submitting"}
              aria-busy={status === "submitting"}
            >
              {status === "submitting" ? "Subscribing..." : "Subscribe"}
            </button>

            {status === "error" && (
              <p
                id="email-signup-status"
                className="text-red-600 sm:mt-0 sm:ml-2 text-sm"
                role="alert"
                aria-live="polite"
              >
                {message || "There was an error. Please try again."}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
};

export default EmailSignup;






