src / components / NewsletterForm.tsx;
import React, { useState } from "react";

interface NewsletterFormProps {
  className?: string;
}

const NewsletterForm: React.FC<NewsletterFormProps> = ({ className = "" }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      // Replace with your actual newsletter API endpoint
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus("success");
        setMessage("Thank you for subscribing! Check your email to confirm.");
        setEmail("");
      } else {
        throw new Error("Subscription failed");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === "loading"}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-softGold focus:border-transparent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading" || !email}
          className="px-6 py-3 bg-softGold text-deepCharcoal font-semibold rounded-lg hover:bg-softGold/90 focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-3 text-sm text-center ${
            status === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
        No spam. Unsubscribe at any time.
      </p>
    </div>
  );
};

export default NewsletterForm;
