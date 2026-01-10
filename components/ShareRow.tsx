import * as React from "react";
import ShareButtons from "./ShareButtons";

export interface ShareRowProps {
  url: string;
  title: string;
  className?: string;
  variant?: "minimal" | "standard" | "expanded";
  showLabel?: boolean;
}

export function ShareRow({
  url,
  title,
  className = "",
  variant = "standard",
  showLabel = true,
}: ShareRowProps): JSX.Element {
  return (
    <div
      className={[
        "flex flex-wrap items-center gap-4",
        showLabel ? "justify-between" : "justify-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showLabel && (
        <span className="text-sm font-semibold text-gold/80 whitespace-nowrap">
          Share this:
        </span>
      )}

      <ShareButtons
        url={url}
        title={title}
        variant={variant}
        size="sm"
        platforms={[
          "twitter",
          "linkedin",
          "facebook",
          "whatsapp",
          "email",
          "copy",
        ]}
        className="flex-1 justify-end"
      />
    </div>
  );
}

// Alternative minimal version for tight spaces
export function MinimalShareRow({
  url,
  title,
  className = "",
}: ShareRowProps): JSX.Element {
  return (
    <div className={["flex items-center gap-3", className].join(" ")}>
      <span className="text-xs text-gold/60 font-medium">Share:</span>
      <ShareButtons
        url={url}
        title={title}
        variant="minimal"
        size="sm"
        platforms={["twitter", "linkedin", "copy"]}
      />
    </div>
  );
}

export default ShareRow;

