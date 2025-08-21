// components/EventCard.tsx
import Link from "next/link";
import { parseISO, isValid, format } from "date-fns";

type Props = {
  slug: string;
  title: string;
  date: string;              // ISO
  location: string;
  description?: string | null;
};

export default function EventCard({ slug, title, date, location, description }: Props) {
  const parsed = parseISO(date);
  const nice = isValid(parsed) ? format(parsed, "dd MMM yyyy") : date;

  return (
    <article className="rounded-2xl border border-lightGrey bg-white p-6 shadow-card transition hover:shadow-cardHover">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <time
          dateTime={isValid(parsed) ? parsed.toISOString() : date}
          className="rounded-full bg-warmWhite px-2 py-0.5 text-deepCharcoal/80"
        >
          {nice}
        </time>
        <span aria-hidden="true">·</span>
        <span className="rounded-full bg-warmWhite px-2 py-0.5 text-deepCharcoal/80">
          {location}
        </span>
      </div>

      <h3 className="text-lg font-semibold leading-snug text-gray-900">
        <Link
          href={`/events/${slug}`}
          className="outline-none transition-colors hover:text-forest focus-visible:rounded focus-visible:ring-2 focus-visible:ring-forest/30"
        >
          {title}
        </Link>
      </h3>

      {description && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-700">{description}</p>
      )}

      <div className="mt-4">
        <Link
          href={`/events/${slug}`}
          className="inline-flex items-center rounded-full border border-forest/20 px-3 py-1.5 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-cream"
        >
          Details
        </Link>
      </div>
    </article>
  );
}
