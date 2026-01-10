// components/PostHero.tsx
import * as React from "react";
import Image from "next/image";

type PostHeroProps = {
  slug: string;
  title: string;
  excerpt?: string | null;
  date?: string | null;
  author?: string | { name?: string; image?: string } | null;
  coverImage?: string | null;

  /** Framing controls from MDX front-matter */
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";
  coverPosition?: "center" | "left" | "right";
};

function normalizeLocal(src?: string | null) {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return undefined; // local only for Next/Image static
  return src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;
}

/** Same fallback strategy as the cards so slug-only posts still look good */
function useCover(slug: string, coverImage?: string | null) {
  const candidates = React.useMemo(() => {
    const list = [
      normalizeLocal(coverImage),
      `/assets/images/blog/${slug}.webp`,
      `/assets/images/blog/${slug}.jpg`,
      `/assets/images/blog/${slug}.jpeg`,
      `/assets/images/blog/${slug}.png`,
      `/assets/images/blog/default-blog-cover.jpg`,
    ].filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [slug, coverImage]);

  const [i, setI] = React.useState(0);
  const src = candidates[i];
  const onError = React.useCallback(() => {
    setI((x) => (x + 1 < candidates.length ? x + 1 : x));
  }, [candidates.length]);

  return { src, onError };
}

export default function PostHero({
  slug,
  title,
  excerpt,
  date,
  author,
  coverImage,
  coverAspect = "book",
  coverFit = "contain", // default to contain for portraits
  coverPosition = "center",
}: PostHeroProps) {
  const { src: coverSrc, onError } = useCover(slug, coverImage);

  const authorName =
    typeof author === "string" ? author : author?.name || "Abraham of London";

  const dt = date ? new Date(date) : null;
  const dateStr =
    dt && !Number.isNaN(+dt)
      ? new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(dt)
      : null;

  // Aspect frame
  const aspectClass =
    coverAspect === "square"
      ? "aspect-[1/1]"
      : coverAspect === "wide"
        ? "aspect-[16/9]"
        : "aspect-[2/3]"; // book/portrait

  // Fit / position
  const fitClass = coverFit === "contain" ? "object-contain" : "object-cover";
  const posClass =
    coverPosition === "left"
      ? "object-left"
      : coverPosition === "right"
        ? "object-right"
        : "object-center";

  // Add padding + neutral background when we use `contain`
  const framePadding = coverFit === "contain" ? "p-2 sm:p-3 md:p-4" : "";
  const frameBg = coverFit === "contain" ? "bg-warmWhite" : "bg-transparent";
  const frameBorder =
    coverFit === "contain"
      ? "border border-lightGrey/70"
      : "border border-transparent";

  return (
    <section className="bg-white dark:bg-black">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-2 md:gap-12">
        {/* Text block */}
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-[color:var(--color-on-secondary)/0.6] dark:text-[color:var(--color-on-primary)/0.7]">
            Featured Insight
          </p>
          <h1 className="font-serif text-4xl font-semibold text-deepCharcoal sm:text-5xl dark:text-cream [text-wrap:balance] drop-shadow-[0_1px_0_rgba(0,0,0,.25)]">
            {title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[color:var(--color-on-secondary)/0.7] dark:text-[color:var(--color-on-primary)/0.8]">
            {authorName && <span>By {authorName}</span>}
            {dateStr && (
              <>
                <span aria-hidden>•</span>
                <time dateTime={dt?.toISOString() || undefined}>{dateStr}</time>
              </>
            )}
          </div>

          {excerpt && (
            <p className="mt-5 max-w-prose text-[color:var(--color-on-secondary)/0.8] dark:text-[color:var(--color-on-primary)/0.85]">
              {excerpt}
            </p>
          )}
        </div>

        {/* Image block */}
        {coverSrc && (
          <div
            className={`relative w-full overflow-hidden rounded-2xl ${aspectClass} ${frameBg} ${framePadding} ${frameBorder} shadow-card`}
          >
            {/* soft readability overlay for cover images */}
            {coverFit === "cover" && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[1]
                           bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35),transparent_35%,transparent_65%,rgba(0,0,0,0.25))]
                           dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.45),transparent_40%,transparent_60%,rgba(0,0,0,0.35))]"
              />
            )}
            <Image
              src={coverSrc}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={`${fitClass} ${posClass}`}
              onError={onError}
              priority
            />
          </div>
        )}
      </div>
    </section>
  );
}

