import * as React from "react";
import Link from "next/link";
import Image from "next/image";

export type EventCardProps = {
  slug: string;
  title: string;
  date?: string | null;
  coverImage?: string | null;
  summary?: string | null;
};

export default function EventCard({
  slug,
  title,
  date,
  coverImage,
  summary,
}: EventCardProps): JSX.Element {
  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {coverImage ? (
        <div className="relative aspect-[16/9] w-full">
          <Image src={coverImage} alt={title} fill className="object-cover" />
        </div>
      ) : null}
      <div className="p-4 md:p-5">
        <h3 className="text-lg font-semibold text-deepCharcoal">
          <Link href={`/events/${slug}`} className="hover:underline">
            {title}
          </Link>
        </h3>
        {date ? (
          <p className="mt-1 text-sm text-gray-500">
            {new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        ) : null}
        {summary ? <p className="mt-3 text-sm text-gray-600">{summary}</p> : null}
        <div className="mt-4">
          <Link href={`/events/${slug}`} className="text-forest hover:underline text-sm font-medium">
            View details →
          </Link>
        </div>
      </div>
    </article>
  );
}