// components/mdx/CtaPresetComponent.tsx
import React from "react";
import { getCtaPreset } from "./cta-presets";

// Import the type directly from the file since it's not exported
type CTAKey =
  | "fatherhood"
  | "leadership"
  | "brotherhood"
  | "mentorship"
  | "free-resources"
  | "premium"
  | "community"
  | "newsletter";

interface CtaPresetProps {
  presetKey?: CTAKey | string;
  title?: string;
  description?: string;
  compact?: boolean;
}

const getBadgeColors = (badge: string | undefined): string => {
  if (!badge) {
    return "bg-gray-100 text-gray-800 border-gray-200";
  }

  const colors: Record<string, string> = {
    premium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    free: "bg-green-100 text-green-800 border-green-200",
    new: "bg-blue-100 text-blue-800 border-blue-200",
    popular: "bg-purple-100 text-purple-800 border-purple-200",
    featured: "bg-orange-100 text-orange-800 border-orange-200",
  };

  return colors[badge] || "bg-gray-100 text-gray-800 border-gray-200";
};

const LinkItemComponent: React.FC<{ item: any }> = ({ item }) => {
  const badgeColor = getBadgeColors(item.badge);

  return (
    <a
      href={item.href}
      className="group flex flex-col rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">
          {item.label || item.title}
        </h3>
        {item.badge && (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${badgeColor}`}
          >
            {item.badge}
          </span>
        )}
      </div>
      {(item.sub || item.description) && (
        <p className="mt-1 text-sm text-gray-600">
          {item.sub || item.description}
        </p>
      )}
    </a>
  );
};

const CtaPresetComponent: React.FC<CtaPresetProps> = ({
  presetKey,
  title,
  description,
  compact = false,
}) => {
  // Get the preset data if presetKey is provided
  const preset = presetKey ? getCtaPreset(presetKey) : null;

  // Use provided title/description or fall back to preset data
  const actualTitle = title || preset?.title || "Call to Action";
  const actualDescription = description || preset?.description;

  // Collect all links from the preset
  const allLinks: any[] = [];

  if (preset) {
    if (preset.reads) allLinks.push(...preset.reads);
    if (preset.downloads) allLinks.push(...preset.downloads);
    if (preset.actions) allLinks.push(...preset.actions);
    if (preset.related) allLinks.push(...preset.related);
    if (preset.featured) allLinks.push(preset.featured);
  }

  if (allLinks.length === 0) {
    return (
      <div className="my-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">{actualTitle}</h2>
          {actualDescription && (
            <p className="mt-2 text-gray-600">{actualDescription}</p>
          )}
        </div>
        <p className="text-gray-500">No links available for this preset.</p>
      </div>
    );
  }

  return (
    <div className="my-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">{actualTitle}</h2>
        {actualDescription && (
          <p className="mt-2 text-gray-600">{actualDescription}</p>
        )}
      </div>

      <div
        className={
          compact
            ? "flex flex-col gap-3"
            : "grid grid-cols-1 gap-4 md:grid-cols-2"
        }
      >
        {allLinks.map((link, index) => (
          <LinkItemComponent key={index} item={link} />
        ))}
      </div>
    </div>
  );
};

export default CtaPresetComponent;