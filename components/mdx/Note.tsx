// components/mdx/Note.tsx
import * as React from "react";
import clsx from "clsx";

type Tone = "info" | "key" | "caution";

const toneMap: Record<Tone, { light: string; dark: string }> = {
  info: {
    light: "bg-zinc-50 border-zinc-200 text-zinc-800",
    dark: "bg-zinc-800/80 border-zinc-600 text-white backdrop-blur-sm",
  },
  key: {
    light: "bg-amber-50 border-amber-200 text-amber-800",
    dark: "bg-amber-900/40 border-amber-600 text-amber-100 backdrop-blur-sm",
  },
  caution: {
    light: "bg-rose-50 border-rose-200 text-rose-800",
    dark: "bg-rose-900/40 border-rose-600 text-rose-100 backdrop-blur-sm",
  },
};

export interface NoteProps {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Note({
  tone = "info",
  title,
  children,
  className,
}: NoteProps) {
  const styles = toneMap[tone];

  return (
    <aside
      className={clsx(
        "my-6 rounded-xl border p-4",
        styles.light,
        "dark:" + styles.dark,
        className
      )}
    >
      {title && (
        <div className="mb-2 font-semibold tracking-wide">{title}</div>
      )}

      <div
        className={clsx(
          "[&>p]:my-2",
          "dark:[&>p]:font-medium",
          "dark:[&>strong]:font-bold dark:[&>strong]:text-inherit",
          "dark:[&>code]:bg-white/10 dark:[&>code]:px-1 dark:[&>code]:rounded"
        )}
      >
        {children}
      </div>
    </aside>
  );
}

export default Note;