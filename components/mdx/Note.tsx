import { ReactNode } from "react";
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
  const toneStyles = toneMap[tone];

  return (
    <aside
      className={clsx(
        "my-6 rounded-xl border p-4 md:p-5 leading-relaxed",
        "transition-colors duration-300",
        "dark:shadow-lg dark:shadow-black/20", // Added shadow for dark mode depth
        toneStyles.light,
        `dark:${toneStyles.dark}`, // Proper dark mode classes
        className
      )}
      role="note"
      aria-label={title ?? "Note"}
    >
      {title && (
        <div className={clsx(
          "mb-1 font-semibold tracking-tight",
          tone === "key" && "dark:font-bold", // Bolder in dark for key notes
          tone === "caution" && "dark:font-bold" // Bolder in dark for cautions
        )}>
          {title}
        </div>
      )}
      <div className={clsx(
        "[&>p]:my-2",
        "dark:[&>p]:font-medium", // Slightly bolder paragraphs in dark
        "dark:[&>strong]:font-bold dark:[&>strong]:text-inherit", // Better strong text in dark
        "dark:[&>code]:bg-white/10 dark:[&>code]:px-1 dark:[&>code]:rounded" // Code blocks in dark
      )}>
        {children}
      </div>
    </aside>
  );
}