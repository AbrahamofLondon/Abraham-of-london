// components/admin/decision/RebuildPerformanceButton.tsx
"use client";

import * as React from "react";

export function RebuildPerformanceButton() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string>("");

  async function handleRebuild() {
    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch("/api/admin/decision/rebuild-performance", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to rebuild performance.");
      }

      setMessage(`Rebuilt performance for ${data.processedAssets} assets.`);
      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to rebuild performance."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRebuild}
        disabled={isLoading}
        className="inline-flex items-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Rebuilding..." : "Rebuild performance"}
      </button>
      {message ? <span className="text-sm text-neutral-500">{message}</span> : null}
    </div>
  );
}