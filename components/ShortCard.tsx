// components/ShortCard.tsx - FIXED VERSION
import * as React from "react";
import Link from "next/link";

// Define the Short type directly instead of importing from contentlayer/generated
interface Short {
  slug: string;
  title: string;
  excerpt?: string;
  audience?: string;
  theme?: string;
  tags?: string[];
  readTime?: string;
  url?: string;
  [key: string]: unknown; // For any additional properties
}

type Props = {
  short: Short;
  className?: string;
};

const audienceLabelMap: Record<string, string> = {
  secular: "Outer Court",
  busy: "Quick Reset",
  church: "Inner Crowd",
};

export const ShortCard: React.FC<Props> = ({ short, className }) => {
  const audience =
    (short.audience && audienceLabelMap[String(short.audience)]) ||
    "Short • High Protein";

  const href = short.url ?? `/shorts/${short.slug ?? ""}`;

  return (
    <Link href={href} className="group block h-full">
      <article
        className={[
          "flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm",
          "transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md",
          "dark:border-gray-800 dark:bg-gray-900 dark:hover:border-amber-500/50",
          className ?? "",
        ].join(" ")}
      >
        <header className="mb-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
              {audience}
            </span>

            {short.readTime ? (
              <span className="text-[0.7rem] text-gray-500 dark:text-gray-400">
                {String(short.readTime)}
              </span>
            ) : null}
          </div>

          <h3 className="font-serif text-base font-semibold text-gray-900 dark:text-white">
            {short.title ?? "Untitled"}
          </h3>
        </header>

        {short.excerpt ? (
          <p className="mb-3 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
            {short.excerpt}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-2 text-[0.75rem]">
          <div className="flex flex-wrap gap-1 text-gray-500 dark:text-gray-400">
            {short.theme ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.7rem] dark:bg-gray-800">
                {String(short.theme)}
              </span>
            ) : null}

            {Array.isArray(short.tags)
              ? short.tags.slice(0, 2).map((tag) => (
                  <span
                    key={String(tag)}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.7rem] dark:bg-gray-800"
                  >
                    {String(tag)}
                  </span>
                ))
              : null}
          </div>

          <span className="text-[0.75rem] font-semibold text-amber-600 transition-transform group-hover:translate-x-1 dark:text-amber-400">
            Read ↠
          </span>
        </div>
      </article>
    </Link>
  );
};

// Export the type for reuse
export type { Short };
export default ShortCard;