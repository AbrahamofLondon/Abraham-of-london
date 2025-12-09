// components/BookCard.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";

type BookCardProps = {
  slug: string;
  title: string;
  subtitle?: string | null;
  status?: string | null;
  blurb?: string | null;
  progress?: number | null;
  coverImage?: string | null;
  heroImage?: string | null;
  image?: string | null;
};

const BOOK_FALLBACK_COVER = "/assets/images/default-book.jpg";

function resolveBookCover(book: BookCardProps): string {
  const candidates: string[] = [];

  const addCandidate = (value?: string | null) => {
    if (typeof value === "string" && value.trim().length > 0) {
      candidates.push(value.trim());
    }
  };

  addCandidate(book.coverImage);
  addCandidate(book.heroImage);
  addCandidate(book.image);

  if (!candidates.includes(BOOK_FALLBACK_COVER)) {
    candidates.push(BOOK_FALLBACK_COVER);
  }

  return candidates[0];
}

export default function BookCard(props: BookCardProps): JSX.Element {
  const { slug, title, subtitle, status, blurb, progress } = props;
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [coverIndex, setCoverIndex] = React.useState(0);

  const href = `/books/${encodeURIComponent(slug)}`;

  const coverCandidates = React.useMemo(() => {
    const candidates: string[] = [];

    const addCandidate = (value?: string | null) => {
      if (typeof value === "string" && value.trim().length > 0) {
        candidates.push(value.trim());
      }
    };

    addCandidate(props.coverImage);
    addCandidate(props.heroImage);
    addCandidate(props.image);

    if (!candidates.includes(BOOK_FALLBACK_COVER)) {
      candidates.push(BOOK_FALLBACK_COVER);
    }

    return candidates;
  }, [props.coverImage, props.heroImage, props.image]);

  const cover =
    coverCandidates[Math.min(coverIndex, coverCandidates.length - 1)] ??
    resolveBookCover(props);

  const safeProgress =
    typeof progress === "number" && progress >= 0 && progress <= 100
      ? progress
      : null;

  return (
    <article className="group flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-softGold/30">
      <div className="flex gap-6">
        <Link
          href={href}
          className="relative h-40 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-softGold/30 bg-black/40"
          prefetch={false}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
          )}
          <Image
            src={cover}
            alt={title}
            fill
            className={`object-cover transition-transform duration-700 ${
              imageLoaded ? "opacity-100 group-hover:scale-105" : "opacity-0"
            }`}
            sizes="112px"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageLoaded(false);
              setCoverIndex((prev) =>
                prev + 1 < coverCandidates.length ? prev + 1 : prev
              );
            }}
          />
          {status && (
            <span className="absolute left-2 top-2 rounded-full bg-amber-100/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
              {status}
            </span>
          )}
        </Link>

        <div className="flex flex-1 flex-col">
          <h3 className="mb-1 font-serif text-xl font-bold text-white transition-colors group-hover:text-softGold">
            {title}
          </h3>
          {subtitle && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-softGold/80">
              {subtitle}
            </p>
          )}
          {blurb && <p className="mb-4 text-sm text-gray-300">{blurb}</p>}

          {safeProgress !== null && (
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-xs text-gray-400">
                <span>Writing Progress</span>
                <span>{safeProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-softGold to-amber-200 transition-all duration-700"
                  style={{ width: `${safeProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-auto">
            <Link
              href={href}
              className="group/link inline-flex items-center gap-2 text-sm font-semibold text-softGold"
            >
              View Book Details
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-softGold/40">
                <svg
                  className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path
                    d="M5 3l5 5-5 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
