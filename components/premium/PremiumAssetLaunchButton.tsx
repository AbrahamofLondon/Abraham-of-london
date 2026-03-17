"use client";

import * as React from "react";
import { ArrowUpRight, Loader2, Lock, ShieldCheck } from "lucide-react";

export type PremiumAssetLaunchButtonProps = {
  contentId: string;
  fallbackHref?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  showLockIcon?: boolean;
  onError?: (message: string) => void;
};

type PremiumContentResponse = {
  success?: boolean;
  error?: string;
  code?: string;
  download?: {
    url?: string;
    expiresIn?: string;
  };
};

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function variantClass(
  variant: PremiumAssetLaunchButtonProps["variant"],
): string {
  switch (variant) {
    case "secondary":
      return [
        "border border-white/12 bg-white/[0.04] text-white/82",
        "hover:border-white/20 hover:bg-white/[0.07] hover:text-white",
      ].join(" ");
    case "ghost":
      return [
        "border border-transparent bg-transparent text-amber-300",
        "hover:border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-200",
      ].join(" ");
    case "primary":
    default:
      return [
        "border border-amber-500/25 bg-amber-500/10 text-amber-300",
        "hover:border-amber-400/40 hover:bg-amber-500/15 hover:text-amber-200",
      ].join(" ");
  }
}

async function readJsonIfPossible<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default function PremiumAssetLaunchButton({
  contentId,
  fallbackHref,
  className = "",
  children,
  variant = "primary",
  showLockIcon = true,
  onError,
}: PremiumAssetLaunchButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleLaunch = React.useCallback(async () => {
    const cleanContentId = safeStr(contentId);
    const cleanFallbackHref = safeStr(fallbackHref);

    if (loading) return;

    if (!cleanContentId) {
      const message = "PremiumAssetLaunchButton requires a valid contentId.";
      setError(message);
      onError?.(message);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/premium/content?id=${encodeURIComponent(cleanContentId)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        },
      );

      const payload = await readJsonIfPossible<PremiumContentResponse>(response);
      const launchUrl = safeStr(payload?.download?.url);

      if (response.ok && launchUrl) {
        window.location.assign(launchUrl);
        return;
      }

      if (cleanFallbackHref) {
        window.location.assign(cleanFallbackHref);
        return;
      }

      let message = safeStr(payload?.error);

      if (!message) {
        if (!response.ok) {
          message = `Failed to open asset (${response.status})`;
        } else {
          message = "No download URL was returned for this asset.";
        }
      }

      setError(message);
      onError?.(message);
    } catch (err) {
      if (cleanFallbackHref) {
        window.location.assign(cleanFallbackHref);
        return;
      }

      const message =
        err instanceof Error ? err.message : "Unable to launch premium asset.";

      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [contentId, fallbackHref, loading, onError]);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleLaunch}
        disabled={loading}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5",
          "text-[11px] font-mono uppercase tracking-[0.22em]",
          "transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70",
          variantClass(variant),
          className,
        ].join(" ")}
        aria-busy={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : showLockIcon ? (
          variant === "secondary" || variant === "ghost" ? (
            <ShieldCheck className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )
        ) : null}

        <span>{children || "Open Asset"}</span>
        {!loading ? <ArrowUpRight className="h-4 w-4" /> : null}
      </button>

      {error ? (
        <p className="text-xs leading-relaxed text-red-300/85">{error}</p>
      ) : null}
    </div>
  );
}