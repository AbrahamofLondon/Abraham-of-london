// components/mdx/CTA.tsx
'use client'; // ensure it never runs on the server if it touches hooks/window

import * as React from 'react';

// ✅ NEVER destructure from possibly-undefined. Provide defaults.
type CTAProps = {
  title?: string;
  body?: React.ReactNode;
  actionLabel?: string;
  href?: string;
  // If you genuinely need auth, make it optional and guard it.
  auth?: { user?: { name?: string } } | null;
};

export default function CTA({
  title = 'Ready to take action?',
  body,
  actionLabel = 'Download',
  href = '#',
  auth = null,
}: CTAProps) {
  // ✅ Guard every access
  const userName = auth?.user?.name ?? null;

  return (
    <section className="rounded-2xl border p-6">
      {title && <h3 className="text-xl font-semibold">{title}</h3>}
      {body && <div className="mt-2 text-sm">{body}</div>}
      <div className="mt-4">
        <a className="inline-block rounded-lg px-4 py-2 ring-1" href={href}>
          {actionLabel}
        </a>
      </div>
      {!!userName && (
        <p className="mt-2 text-xs opacity-70">Hi, {userName}.</p>
      )}
    </section>
  );
}
