// components/NewsletterForm.tsx
import React from "react";

const NewsletterForm: React.FC = () => {
  return (
    <form
      name="newsletter"
      method="POST"
      data-netlify="true"
      className="rounded-xl border border-lightGrey p-6 bg-warmWhite"
    >
      {/* Netlify form requirement */}
      <input type="hidden" name="form-name" value="newsletter" />
      <h3 className="font-serif text-xl text-forest mb-2">
        Join the newsletter
      </h3>
      <p className="text-deepCharcoal/80 mb-4">
        Essays, book drops, and field notesÃ¢â‚¬â€no fluff.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="flex-1 rounded-md border border-lightGrey px-3 py-2"
          aria-label="Email address"
        />
        <button
          type="submit"
          className="bg-forest text-cream px-4 py-2 rounded-md hover:bg-softGold hover:text-forest transition-colors"
        >
          Subscribe
        </button>
      </div>
    </form>
  );
};

export default NewsletterForm;



