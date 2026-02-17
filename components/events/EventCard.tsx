// components/events/EventCard.tsx — HARDENED (Institutional Briefing Variant)
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";

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

export default function EventCard(props: EventCardProps): React.ReactElement {
  const { slug, title, date, time, location, description, status, tags } = props;

  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [coverIndex, setCoverIndex] = React.useState(0);

  // Normalizing the intelligence path
  const href = `/events/${slug.replace(/^events\//, "")}`;

  const coverCandidates = React.useMemo(() => {
    const candidates: string[] = [];
    const addCandidate = (val?: string | null) => {
      if (val && val.trim().length > 0) candidates.push(val.trim());
    };

    addCandidate(props.coverImage);
    addCandidate(props.heroImage);
    addCandidate(props.image);
    // Always include fallback as last resort
    candidates.push(EVENT_FALLBACK_COVER);

    return candidates;
  }, [props.coverImage, props.heroImage, props.image]);

  // Ensure we always have a valid string for Image src
  const cover = coverCandidates[Math.min(coverIndex, coverCandidates.length - 1)] ?? EVENT_FALLBACK_COVER;

  return (
    <article className="group overflow-hidden rounded-sm border border-white/5 bg-zinc-950/40 backdrop-blur-md transition-all duration-500 hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/5">
      <Link href={href} className="block">
        {/* Visual Header */}
        <div className="relative h-56 w-full overflow-hidden border-b border-white/5">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-zinc-900" />
          )}

          <Image
            src={cover}
            alt={title}
            fill
            className={`object-cover transition-transform duration-1000 group-hover:scale-110 ${
              imageLoaded ? "opacity-60 group-hover:opacity-80" : "opacity-0"
            }`}
            sizes="(min-width: 1024px) 400px, 100vw"
            onLoad={() => setImageLoaded(true)}
            onError={() => setCoverIndex((prev) => prev + 1)}
          />

          {status && (
            <span className="absolute right-4 top-4 z-10 rounded-sm bg-amber-500 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-black">
              {status}
            </span>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        </div>

        {/* Intelligence Payload */}
        <div className="p-8">
          <div className="mb-4 flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            {date && (
              <span className="flex items-center gap-2">
                <Calendar size={12} className="text-amber-500/60" />
                {date}
              </span>
            )}
            {time && (
              <span className="flex items-center gap-2">
                <Clock size={12} className="text-amber-500/60" />
                {time}
              </span>
            )}
          </div>

          <h3 className="mb-4 font-serif text-2xl italic leading-tight text-white transition-colors group-hover:text-amber-500">
            {title}
          </h3>

          {location && (
            <div className="mb-4 flex items-center gap-2 font-mono text-[10px] text-zinc-400">
              <MapPin size={12} className="text-amber-500" />
              <span className="truncate uppercase tracking-wider">{location}</span>
            </div>
          )}

          {description && (
            <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-zinc-400">
              {description}
            </p>
          )}

          {/* Registry Tags */}
          {tags && tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="border border-white/5 bg-white/[0.03] px-2 py-0.5 font-mono text-[8px] uppercase tracking-tighter text-zinc-500"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500/80 transition-all group-hover:gap-4 group-hover:text-amber-500">
            Access Briefing
            <ArrowRight size={14} />
          </div>
        </div>
      </Link>
    </article>
  );
}