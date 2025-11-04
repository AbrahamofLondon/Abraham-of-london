import ChathamBadge from "./ChathamBadge";
import { EventMeta } from "./EventMeta";

type Props = {
  title: string;
  iso: string;
  location: string;
  kicker?: string; // e.g., "Leadership Workshop — London"
  ctaHref: string;
  ctaLabel?: string;
  durationMins?: number;
};

export function EventPageHeader({
  title,
  iso,
  location,
  kicker,
  ctaHref,
  ctaLabel = "Request Invitation",
  durationMins,
}: Props) {
  return (
    <header className="mb-8">
      {kicker && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-600">
          {kicker}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{title}</h1>
        <ChathamBadge />
      </div>
      <EventMeta iso={iso} location={location} durationMins={durationMins} />
      <div className="mt-4">
        <a
          href={ctaHref}
          className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:shadow"
        >
          {ctaLabel}
        </a>
      </div>
    </header>
  );
}
