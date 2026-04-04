"use client";

import * as React from "react";

export default function CanonicalEssayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-black text-white min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <article className="prose prose-invert prose-lg max-w-none">
          {children}
        </article>
      </div>
    </main>
  );
}