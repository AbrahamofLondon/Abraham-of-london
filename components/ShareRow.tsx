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

      {/* STRATEGIC FIX: 
          If you cannot modify ShareButtons interface yet, 
          wrap it in a div to handle the layout without a type error.
      */}
      <div className="flex-1 flex justify-end">
        <ShareButtons
          url={url}
          title={title}
        />
      </div>
    </div>
  );
}

// Reconciled minimal version for constrained UI nodes
export function MinimalShareRow({
  url,
  title,
  className = "",
}: ShareRowProps): JSX.Element {
  return (
    <div className={["flex items-center gap-3", className].join(" ")}>
      <span className="text-[10px] uppercase tracking-widest text-gold/60 font-bold">
        Share
      </span>
      <ShareButtons
        url={url}
        title={title}
      />
    </div>
  );
}

export default ShareRow;