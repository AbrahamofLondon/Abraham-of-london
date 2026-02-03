// components/EventCard.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";

type EventCardProps = {
  slug: string;
  title: string;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  description?: string | null;
  status?: string | null;
  coverImage?: string | null;
  heroImage?: string | null;
  image?: string | null;
  tags?: string[] | null;
};

const EVENT_FALLBACK_COVER = "/assets/images/abraham-of-london-banner.webp";

export default function EventCard(props: EventCardProps): JSX.Element {
  const { slug, title, date, time, location, description, status, tags } =
    props;

  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [coverIndex, setCoverIndex] = React.useState(0);

  const href = `/events/${encodeURIComponent(slug)}`;

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

    if (!candidates.includes(EVENT_FALLBACK_COVER)) {
      candidates.push(EVENT_FALLBACK_COVER);
    }

    return candidates;
  }, [props.coverImage, props.heroImage, props.image]);

  const cover =
    coverCandidates[Math.min(coverIndex, coverCandidates.length - 1)] ??
    EVENT_FALLBACK_COVER;

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-softGold/30">
      <Link href={href} className="block" prefetch={false}>
        <div className="relative h-48 w-full overflow-hidden">
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
            sizes="(min-width: 1024px) 480px, 100vw"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageLoaded(false);
              setCoverIndex((prev) =>
                prev + 1 < coverCandidates.length ? prev + 1 : prev
              );
            }}
          />

          {status && (
            <span className="absolute right-3 top-3 rounded-full bg-green-100/90 px-3 py-1 text-xs font-semibold text-green-900">
              {status}
            </span>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        <div className="p-6">
          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-gray-300">
            {date && <span>{date}</span>}
            {time && <span>• {time}</span>}
            {location && (
              <span className="flex items-center gap-1">
                📍 <span>{location}</span>
              </span>
            )}
          </div>

          <h3 className="mb-2 font-serif text-lg font-bold text-white transition-colors group-hover:text-softGold">
            {title}
          </h3>

          {tags && tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1 text-[11px] text-softGold">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-softGold/10 px-2 py-0.5"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {description && (
            <p className="mb-4 text-sm text-gray-300">{description}</p>
          )}

          <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-softGold">
            Event Details
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-softGold/40">
              <svg
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
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
          </div>
        </div>
      </Link>
    </article>
  );
}

