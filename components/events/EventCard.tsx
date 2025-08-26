// components/events/EventCard.tsx
import Link from "next/link";
import Image from "next/image";

type Props = {
  slug: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  date?: string | null;
  location?: string | null;      // ← allow null for spread-compat
  coverImage?: string | null;
  tags?: string[] | null;        // for "Chatham" badge
};

export default function EventCard({
  slug,
  title,
  summary,
  description,
  date,
  location,    // (not rendered, but harmless)
  coverImage,
  tags,
}: Props) {
  const href = `/events/${slug}`;
  const cover = coverImage ?? "/assets/images/default-event.jpg";
  const text = summary ?? description ?? null;

  const isChatham =
    Array.isArray(tags) && tags.some((t) => String(t).toLowerCase() === "chatham");

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border border-lightGrey bg-white shadow transition-shadow hover:shadow-lg"
      prefetch={false}
    >
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        <Image
          src={cover}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority={false}
        />
        {isChatham && (
          <span
            className="absolute left-3 top-3 rounded-full bg-deepCharcoal/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream"
            title="Chatham Room (off the record)"
            aria-label="Chatham Room (off the record)"
          >
            Chatham
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-forest group-hover:underline">{title}</h3>
        {date && <p className="mt-1 text-sm text-deepCharcoal/70">{date}</p>}
        {text && <p className="mt-2 line-clamp-2 text-deepCharcoal/85">{text}</p>}
      </div>
    </Link>
  );
}
