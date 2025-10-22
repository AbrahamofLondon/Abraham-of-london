// components/events/EventHero.tsx
import * as React from "react";
import Image from "next/image";

type EventHeroProps = {
  slug: string;
  title: string;
  date?: string | null;
  endDate?: string | null;
  location?: string | null;
  summary?: string | null;
  heroImage?: string | null;
  aspect?: "wide" | "book" | "square";
  fit?: "cover" | "contain";
  position?: "left" | "center" | "right";
};

function normalizeLocal(src?: string | null) {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src; // allow remote too
  return src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;
}

function useCover(slug: string, heroImage?: string | null) {
  const list = React.useMemo(() => {
    const cands = [
      normalizeLocal(heroImage),
      `/assets/images/events/${slug}.webp`,
      `/assets/images/events/${slug}.jpg`,
      `/assets/images/events/${slug}.jpeg`,
      `/assets/images/events/${slug}.png`,
      `/assets/images/events/default-event-cover.jpg`,
    ].filter(Boolean) as string[];
    return Array.from(new Set(cands));
  }, [slug, heroImage]);

  const [i, setI] = React.useState(0);
  const src = list[i];
  const onError = React.useCallback(() => {
    setI((x) => (x + 1 < list.length ? x + 1 : x));
  }, [list.length]);
  return { src, onError };
}

function formatRange(start?: string | null, end?: string | null) {
  if (!start) return "";
  const s = new Date(start);
  if (Number.isNaN(+s)) return "";
  const locale = "en-GB";

  if (!end) {
    const datePart = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(s);
    const timePart = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(s);
    return `${datePart}${timePart ? `, ${timePart}` : ""}`;
  }

  const e = new Date(end);
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();

  const dayStr = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(s);

  const timeStart = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(s);

  const timeEnd = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(e);

  if (sameDay) return `${dayStr}, ${timeStart}–${timeEnd}`;

  const dayEnd = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(e);

  return `${dayStr}, ${timeStart} ÃƒÂ¢Ã¢â‚¬' ${dayEnd}, ${timeEnd}`;
}

export default function EventHero({
  slug,
  title,
  date,
  endDate,
  location,
  summary,
  heroImage,
  aspect = "wide",
  fit = "cover",
  position = "center",
}: EventHeroProps) {
  const { src, onError } = useCover(slug, heroImage);

  const aspectClass =
    aspect === "square" ? "aspect-[1/1]" : aspect === "book" ? "aspect-[2/3]" : "aspect-[16/9]";
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  const posClass = position === "left" ? "object-left" : position === "right" ? "object-right" : "object-center";
  const framePadding = fit === "contain" ? "p-2 sm:p-3 md:p-4" : "";
  const frameBg = fit === "contain" ? "bg-warmWhite" : "bg-transparent";
  const frameBorder = fit === "contain" ? "border border-lightGrey/70" : "border border-transparent";

  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-10 md:grid-cols-2 md:gap-12">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-[color:var(--color-on-secondary)/0.6]">
            Chatham Rooms available
          </p>
          <h1 className="font-serif text-4xl font-semibold text-deepCharcoal sm:text-5xl">{title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[color:var(--color-on-secondary)/0.7]">
            {date && <time dateTime={date}>{formatRange(date, endDate)}</time>}
            {location && (
              <>
                <span aria-hidden>•</span>
                <span>{location}</span>
              </>
            )}
          </div>

          {summary && <p className="mt-5 max-w-prose text-[color:var(--color-on-secondary)/0.85]">{summary}</p>}
        </div>

        {src && (
          <div className={`relative w-full overflow-hidden rounded-2xl ${aspectClass} ${frameBg} ${framePadding} ${frameBorder} shadow-card`}>
            <Image
              src={src}
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
