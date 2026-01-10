// components/Callout.tsx
import * as React from "react";

export interface CalloutProps {
  children?: React.ReactNode;
  type?: "info" | "success" | "warning" | "danger" | "note";
  title?: string;
  icon?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
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
      border: "border-blue-400/30",
      background: "bg-blue-400/10",
      text: "text-blue-300",
      icon: "💡",
      titleColor: "text-blue-200",
    },
    success: {
      border: "border-emerald-400/30",
      background: "bg-emerald-400/10",
      text: "text-emerald-300",
      icon: "✅",
      titleColor: "text-emerald-200",
    },
    warning: {
      border: "border-amber-400/30",
      background: "bg-amber-400/10",
      text: "text-amber-300",
      icon: "⚠️",
      titleColor: "text-amber-200",
    },
    danger: {
      border: "border-red-400/30",
      background: "bg-red-400/10",
      text: "text-red-300",
      icon: "🚫",
      titleColor: "text-red-200",
    },
    note: {
      border: "border-gray-400/30",
      background: "bg-gray-400/10",
      text: "text-gray-300",
      icon: "📝",
      titleColor: "text-gray-200",
    },
  }[type];

  const displayIcon = icon || config.icon;
  return (
    <div
      className={[
        "my-6 rounded-lg border p-4",
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
            <h4
              className={`mb-2 font-semibold leading-tight ${config.titleColor}`}
            >
              {title}
            </h4>
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

