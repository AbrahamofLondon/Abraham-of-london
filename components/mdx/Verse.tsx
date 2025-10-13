// components/mdx/Verse.tsx
"use client";

import { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
  cite?: string; // e.g., "Ephesians 5:25"
  className?: string;
};

export default function Verse({ children, cite, className }: Props) {
  return (
    <blockquote
      className={clsx(
        "my-6 border-l-2 pl-4 italic text-zinc-700",
        "aria-[label]:sr-only",
        className
      )}
      aria-label={cite ? `Scripture: ${cite}` : "Scripture"}
    >
      <p className="not-italic font-medium">{children}</p>
      {cite && (
        <footer className="mt-1 text-sm text-zinc-500">
          — {cite}
        </footer>
      )}
    </blockquote>
  );
}
