"use client";

import * as React from "react";
import Script from "next/script";

interface CommentsSectionProps {
  slug: string;
  title?: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  slug,
  title,
}) => {
  const websiteId =
    process.env.NEXT_PUBLIC_HYVOR_WEBSITE_ID ||
    process.env.NEXT_PUBLIC_HYVOR_WEBSITE_ID?.toString();

  // If not configured, show a graceful placeholder
  if (!websiteId) {
    return (
      <section className="mt-16 rounded-2xl border border-gray-200/60 bg-gray-50 px-6 py-5 text-left text-sm text-gray-600">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          Conversations coming soon
        </p>
        <p>
          Comment threads for this article will be enabled once the discussion
          system is finalised.
        </p>
      </section>
    );
  }

  const pageId =
    slug || (typeof window !== "undefined" ? window.location.pathname : "");

  return (
    <section className="mt-16">
      <h2 className="mb-4 font-serif text-2xl font-semibold text-deepCharcoal">
        Join the conversation
      </h2>
      <div id="hyvor-talk-view" />
      <Script
        src="https://talk.hyvor.com/web-api/embed.js"
        strategy="lazyOnload"
        onLoad={() => {
          try {
            const anyWindow = window as unknown as {
              HYVOR_TALK?: { init: (config: unknown) => void };
            };
            if (!anyWindow.HYVOR_TALK) return;
            anyWindow.HYVOR_TALK.init({
              websiteId,
              container: "#hyvor-talk-view",
              page: {
                id: pageId,
                title,
              },
            });
          } catch {
            // fail silently
          }
        }}
      />
    </section>
  );
};

