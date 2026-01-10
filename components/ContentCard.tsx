// components/ContentCard.tsx
import * as React from "react";
import Link from "next/link";

interface ContentCardProps {
  title: string;
  description: string;
  href: string;
  category: string;
  color: string;
  icon: string;
  className?: string;
}

const ContentCard: React.FC<ContentCardProps> = ({
  title,
  description,
  href,
  category,
  color,
  icon,
  className = "",
}) => {
  return (
    <Link href={href} className="group block">
      <article
        className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 ${className}`}
        style={{
          borderTopColor: `${color}40`,
          borderLeftColor: `${color}20`,
        }}
      >
        {/* Decorative accent line */}
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{
            background: `linear-gradient(to bottom, 
              ${color}00 0%, 
              ${color} 30%, 
              ${color}80 70%, 
              ${color}00 100%)`,
          }}
        />

        {/* Icon */}
        <div className="mb-4 flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all group-hover:scale-110"
            style={{
              backgroundColor: `${color}15`,
              color: color,
            }}
          >
            {icon}
          </div>
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
            style={{
              backgroundColor: `${color}10`,
              color: color,
              border: `1px solid ${color}20`,
            }}
          >
            {category}
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-2 font-serif text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h3>

        {/* Description */}
        <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {description}
        </p>

        {/* CTA */}
        <div
          className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800"
        >
          <span
            className="text-sm font-medium transition-all group-hover:tracking-wide"
            style={{ color: color }}
          >
            Explore {category}
          </span>
          <span
            className="transition-transform group-hover:translate-x-1"
            style={{ color: color }}
          >
            →
          </span>
        </div>

        {/* Hover glow effect */}
        <div
          className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30"
          style={{ backgroundColor: color }}
        />
      </article>
    </Link>
  );
};

export default ContentCard;

