/* components/admin/decision/RebuildEfficacyButton.tsx */
"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type RebuildEfficacyButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export function RebuildEfficacyButton({
  className,
  children,
}: RebuildEfficacyButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string>("");

  async function handleClick() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/admin/decision/rebuild-contextual-efficacy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to rebuild efficacy.");
      }

      setMessage("Efficacy rebuilt successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rebuild failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={cx(
          "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-mono uppercase tracking-[0.14em] transition",
          loading
            ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
            : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
        )}
      >
        <RefreshCw className={cx("h-3.5 w-3.5", loading && "animate-spin")} />
        {children || (loading ? "Rebuilding..." : "Rebuild Efficacy")}
      </button>

      {message ? (
        <p className="mt-3 text-xs text-neutral-500">{message}</p>
      ) : null}
    </div>
  );
}

export default RebuildEfficacyButton;