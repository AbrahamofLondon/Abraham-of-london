// components/Cards/partials/LinkItemWithBadge.tsx
import Link from "next/link";
import * as React from "react";

export interface LinkItemWithBadgeProps {
  href: string;
  title: string;
  badge?: string;
  description?: string;
  className?: string;
  badgeColor?: "amber" | "blue" | "green" | "red" | "purple";
  badgeVariant?: "filled" | "outline";
}

export const LinkItemWithBadge: React.FC<LinkItemWithBadgeProps> = ({
  href,
  title,
  badge,
  description,
  className = "",
  badgeColor = "amber",
  badgeVariant = "filled",
}) => {
  const badgeColorClasses = {
    amber: {
      filled: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      outline: "bg-transparent text-amber-300 border-amber-500/50",
    },
    blue: {
      filled: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      outline: "bg-transparent text-blue-300 border-blue-500/50",
    },
    green: {
      filled: "bg-green-500/20 text-green-300 border-green-500/30",
      outline: "bg-transparent text-green-300 border-green-500/50",
    },
    red: {
      filled: "bg-red-500/20 text-red-300 border-red-500/30",
      outline: "bg-transparent text-red-300 border-red-500/50",
    },
    purple: {
      filled: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      outline: "bg-transparent text-purple-300 border-purple-500/50",
    },
  };

  const badgeClasses = badgeColorClasses[badgeColor][badgeVariant];

  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-all hover:border-amber-400/50 hover:bg-slate-800/80 ${className}`}
    >
      <div className="flex-1">
        <h3 className="font-medium text-white group-hover:text-amber-200">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        )}
      </div>
      
      {badge && (
        <span
          className={`ml-4 rounded-full border px-3 py-1 text-xs font-medium ${badgeClasses}`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
};
