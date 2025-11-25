// components/Callout.tsx
import * as React from "react";

export interface CalloutProps {
  children?: React.ReactNode;
  type?: "info" | "success" | "warning" | "danger" | "note";
  title?: string;
  icon?: React.ReactNode;
  className?: string;
  [key: string]: unknown; // Allow any additional props
}

const Callout: React.FC<CalloutProps> = ({
  children,
  type = "info",
  title,
  icon,
  className = "",
  ...rest
}) => {
  const config = {
    info: {
      border: "border-blue-200",
      background: "bg-blue-50/80",
      text: "text-blue-900",
      icon: "💡",
    },
    success: {
      border: "border-emerald-200",
      background: "bg-emerald-50/80",
      text: "text-emerald-900",
      icon: "✅",
    },
    warning: {
      border: "border-amber-200",
      background: "bg-amber-50/80",
      text: "text-amber-900",
      icon: "⚠️",
    },
    danger: {
      border: "border-red-200",
      background: "bg-red-50/80",
      text: "text-red-900",
      icon: "🚫",
    },
    note: {
      border: "border-gray-200",
      background: "bg-gray-50/80",
      text: "text-gray-800",
      icon: "📝",
    },
  }[type];

  const displayIcon = icon || config.icon;
  return (
    <div
      className={[
        "my-6 rounded-xl border p-4",
        config.border,
        config.background,
        config.text,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <div className="flex items-start gap-3">
        {displayIcon && (
          <span className="mt-0.5 flex-shrink-0 text-lg">{displayIcon}</span>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="mb-2 font-semibold leading-tight">{title}</h4>
          )}
          <div className="text-[0.95rem] leading-relaxed [&>:first-child]:mt-0 [&>:last-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Callout;