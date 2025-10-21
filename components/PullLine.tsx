import * as React from "react";
import { LineChart, LucideIcon } from "lucide-react"; // Using a default Lucide icon

// Tailwind colors based on your BrandFrame
const BRAND_ACCENT_COLOR = '#C5A352'; // muted-gold
const BRAND_PRIMARY_COLOR = '#0B2E1F'; // deep-forest

interface PullLineProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  color?: string; // Tailwind color class or hex
  className?: string;
}

/**
 * Renders a visually separated "pull" section, often used for quotes or key stats in print documents.
 * In print, this helps break up text flow.
 */
export default function PullLine({
  children,
  icon: Icon = LineChart, // Default icon
  color = BRAND_ACCENT_COLOR,
  className = "",
}: PullLineProps) {
  const isHex = color.startsWith('#');
  const accentStyle = isHex ? { borderColor: color, color: color } : {};

  return (
    <div
      className={`my-8 px-6 py-4 border-l-4 font-serif text-lg leading-relaxed ${
        isHex ? '' : `border-${color}-600 text-${color}-800`
      } ${className}`}
      style={accentStyle}
    >
      <div className="flex items-start space-x-4">
        {Icon && (
          <Icon
            className="w-6 h-6 flex-shrink-0"
            style={{ color: BRAND_PRIMARY_COLOR }} // Use primary color for icon for contrast
          />
        )}
        <div style={{ color: BRAND_PRIMARY_COLOR }}>
          {children}
        </div>
      </div>
    </div>
  );
}