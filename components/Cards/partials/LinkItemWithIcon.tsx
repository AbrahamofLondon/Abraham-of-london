// components/Cards/partials/LinkItemWithIcon.tsx
import Link from "next/link";
import * as React from "react";

export interface LinkItemWithIconProps {
  href: string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
  iconColor?: "amber" | "blue" | "green" | "red" | "purple";
}

export const LinkItemWithIcon: React.FC<LinkItemWithIconProps> = ({
  href,
  icon,
  title,
  description,
  className = "",
  iconColor = "amber",
}) => {
  const iconColorClasses = {
    amber: "bg-amber-500/20 text-amber-400",
    blue: "bg-blue-500/20 text-blue-400",
    green: "bg-green-500/20 text-green-400",
    red: "bg-red-500/20 text-red-400",
    purple: "bg-purple-500/20 text-purple-400",
  };

  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-all hover:border-amber-400/50 hover:bg-slate-800/80 ${className}`}
    >
      {/* Icon Container */}
      {icon && (
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconColorClasses[iconColor]}`}
        >
          {icon}
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1">
        <h3 className="font-medium text-white group-hover:text-amber-200">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        )}
      </div>
    </Link>
  );
};
