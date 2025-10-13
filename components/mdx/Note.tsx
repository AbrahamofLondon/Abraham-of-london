// components/mdx/Note.tsx
"use client";

import { ReactNode } from "react";
import clsx from "clsx";

type Tone = "info" | "key" | "caution";

const toneMap: Record<Tone, string> = {
  info: "bg-zinc-50 border-zinc-200",
  key: "bg-amber-50 border-amber-200",
  caution: "bg-rose-50 border-rose-200",
};

export default function Note({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={clsx(
        "my-6 rounded-xl border p-4 md:p-5",
        "text-zinc-800 leading-relaxed",
        toneMap[tone],
        className
      )}
      role="note"
      aria-label={title ?? "Note"}
    >
      {title && (
        <div className="mb-1 font-semibold tracking-tight">
          {title}
        </div>
      )}
      <div className="[&>p]:my-2">{children}</div>
    </aside>
  );
}
