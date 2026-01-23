// components/mdx/Verse.tsx

import { ReactNode } from "react";
import clsx from "clsx";

export default function Verse({
  children,
  cite,
  className,
}: {
  children: ReactNode;
  cite?: string;
  className?: string;
}) {
  return (
    <blockquote
      className={clsx("my-6 border-l-2 pl-4 italic text-zinc-700", className)}
      aria-label={cite ? `Scripture: ${cite}` : "Scripture"}
    >
      <p className="not-italic font-medium">{children}</p>
      {cite && <footer className="mt-1 text-sm text-zinc-500">- {cite}</footer>}
    </blockquote>
  );
}

