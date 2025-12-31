// components/Cards/CanonPrimaryCard.tsx
import * as React from "react";
import Link from "next/link";
import Image from "next/image";

interface CanonPrimaryCardProps {
  title: string;
  excerpt?: string;
  href: string;
  image?: string;
  volumeNumber?: number | string;
  className?: string;
}

const CanonPrimaryCard: React.FC<CanonPrimaryCardProps> = ({
  title = "Canon Entry",
  excerpt = "Foundational principles and long-term thinking for builders of legacy.",
  href = "/canon",
  image,
  volumeNumber,
  className = "",
}) => {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`group block overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-black transition-all hover:scale-[1.02] hover:border-amber-500/30 ${className}`}
    >
      <div className="relative h-64 w-full overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(min-width: 1024px) 420px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-rose-900/10" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

        {volumeNumber !== undefined && volumeNumber !== null && volumeNumber !== "" && (
          <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-sm">
            Vol. {volumeNumber}
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="mb-2 font-serif text-xl font-semibold text-cream transition-colors group-hover:text-amber-100">
          {title}
        </h3>
        {excerpt ? <p className="line-clamp-2 text-sm text-gray-300">{excerpt}</p> : null}
      </div>
    </Link>
  );
};

export default CanonPrimaryCard;
