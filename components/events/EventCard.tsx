import Link from "next/link";
import ChathamBadge from "./ChathamBadge";
import { EventMeta } from "./EventMeta";

type CardProps = {
  slug: string;
  title: string;
  iso: string;
  location: string;
  summary: string;
  coverImage?: string;
};

export function EventCard({ slug, title, iso, location, summary, coverImage = "/assets/images/events/leadership-workshop.jpg" }: CardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border">
      <Link href={`/events/${slug}`}>
        <img src={coverImage} alt="" className="h-44 w-full object-cover" />
      </Link>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold"><Link href={`/events/${slug}`}>{title}</Link></h3>
          <ChathamBadge />
        </div>
        <p className="line-clamp-2 text-sm text-neutral-700">{summary}</p>
        <EventMeta iso={iso} location={location} />
        <div className="mt-3">
          <Link href={`/events/${slug}`} className="text-sm font-semibold underline">View details</Link>
        </div>
      </div>
    </article>
  );
}
