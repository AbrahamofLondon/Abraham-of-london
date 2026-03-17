"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  Clock,
  Lock,
  Sparkles,
  Key,
  Eye,
  FileText,
  Presentation,
} from "lucide-react";

type AssetType =
  | "brief"
  | "framework"
  | "report"
  | "intelligence"
  | "editorial"
  | "toolkit"
  | "deck";

type LaunchResponse = {
  success?: boolean;
  error?: string;
  code?: string;
  data?: {
    id?: string;
    title?: string;
    subtitle?: string;
    asset?: {
      filename?: string;
      mimeType?: string;
      exists?: boolean;
      sizeBytes?: number | null;
    };
  };
  download?: {
    url?: string;
    expiresIn?: string;
  };
  forensics?: {
    tokenId?: string | null;
    watermarkId?: string | null;
    expectedFooter?: string | null;
    fingerprint?: string | null;
  };
};

interface DownloadButtonProps {
  contentId: string;
  fileName?: string;
  assetTitle?: string;
  assetType?: AssetType;
  classification?: string;
  tierLabel?: string;
  maxDownloads?: number;
  usedCount?: number;
  expiresAt?: Date | string | null;
  className?: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

type Status = "idle" | "loading" | "success" | "error";

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatTimeLeft(expiresAt?: Date | string | null): string {
  if (!expiresAt) return "On demand";

  const end = new Date(expiresAt).getTime();
  if (!Number.isFinite(end)) return "On demand";

  const now = Date.now();
  const distance = end - now;

  if (distance <= 0) return "Expired";

  const hours = Math.floor(distance / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

function progressFromUsage(usedCount: number, maxDownloads: number): number {
  if (maxDownloads <= 0) return 0;
  return Math.max(0, Math.min(100, (usedCount / maxDownloads) * 100));
}

function assetVisuals(assetType: AssetType) {
  const map = {
    brief: {
      gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
      border: "border-amber-500/30",
      text: "text-amber-400",
      icon: Eye,
      button:
        "from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40",
    },
    framework: {
      gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
      border: "border-blue-500/30",
      text: "text-blue-400",
      icon: Shield,
      button:
        "from-blue-500 to-blue-400 text-black shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40",
    },
    report: {
      gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      icon: Sparkles,
      button:
        "from-emerald-500 to-emerald-400 text-black shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40",
    },
    intelligence: {
      gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
      border: "border-amber-500/30",
      text: "text-amber-400",
      icon: Key,
      button:
        "from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40",
    },
    editorial: {
      gradient: "from-white/15 via-white/[0.03] to-transparent",
      border: "border-white/20",
      text: "text-white/80",
      icon: FileText,
      button:
        "from-white to-zinc-200 text-black shadow-lg shadow-white/20 hover:shadow-white/30",
    },
    toolkit: {
      gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
      border: "border-violet-500/30",
      text: "text-violet-400",
      icon: Shield,
      button:
        "from-violet-500 to-violet-400 text-black shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40",
    },
    deck: {
      gradient: "from-fuchsia-500/20 via-fuchsia-500/5 to-transparent",
      border: "border-fuchsia-500/30",
      text: "text-fuchsia-400",
      icon: Presentation,
      button:
        "from-fuchsia-500 to-fuchsia-400 text-black shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40",
    },
  } as const;

  return map[assetType];
}

async function downloadBlobToBrowser(downloadUrl: string, fileName: string) {
  const fileResponse = await fetch(downloadUrl, {
    method: "GET",
    credentials: "same-origin",
  });

  if (!fileResponse.ok) {
    const text = await fileResponse.text().catch(() => "");
    throw new Error(
      text?.trim() || `Download stream failed (${fileResponse.status})`,
    );
  }

  const blob = await fileResponse.blob();
  const objectUrl = window.URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.URL.revokeObjectURL(objectUrl);
}

async function readApiResponse<T>(
  response: Response,
): Promise<{ json: T | null; text: string }> {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (contentType.toLowerCase().includes("application/json")) {
    try {
      return {
        json: JSON.parse(text) as T,
        text,
      };
    } catch {
      return { json: null, text };
    }
  }

  return { json: null, text };
}

export default function DownloadButton({
  contentId,
  fileName = "premium-asset.bin",
  assetTitle = "Premium Asset",
  assetType = "brief",
  classification = "CONTROLLED",
  tierLabel = "Session Bound",
  maxDownloads = 1,
  usedCount = 0,
  expiresAt = null,
  className = "",
  onSuccess,
  onError,
}: DownloadButtonProps) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [liveExpiresAt, setLiveExpiresAt] = React.useState<Date | string | null>(
    expiresAt,
  );

  const visuals = assetVisuals(assetType);
  const AssetIcon = visuals.icon;
  const timeLeft = React.useMemo(
    () => formatTimeLeft(liveExpiresAt),
    [liveExpiresAt],
  );

  React.useEffect(() => {
    if (!liveExpiresAt) return;

    const timer = window.setInterval(() => {
      setLiveExpiresAt((prev) => prev);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [liveExpiresAt]);

  const isExpired = timeLeft === "Expired";
  const isLimitReached = usedCount >= maxDownloads;
  const remaining = Math.max(0, maxDownloads - usedCount);
  const usageProgress = progressFromUsage(usedCount, maxDownloads);

  const handleDownload = async () => {
    if (status === "loading" || isExpired || isLimitReached) return;

    const cleanContentId = safeStr(contentId);

    if (!cleanContentId) {
      const message = "DownloadButton requires a valid contentId.";
      setStatus("error");
      setErrorMessage(message);
      onError?.(message);
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const launchResponse = await fetch(
        `/api/premium/content?id=${encodeURIComponent(cleanContentId)}`,
        {
          method: "GET",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const { json: launchData, text } =
        await readApiResponse<LaunchResponse>(launchResponse);

      if (!launchResponse.ok) {
        throw new Error(
          safeStr(launchData?.error) ||
            text ||
            `Asset launch failed (${launchResponse.status})`,
        );
      }

      if (!launchData) {
        const lowered = text.toLowerCase();
        if (lowered.includes("<!doctype html") || lowered.includes("<html")) {
          throw new Error(
            "Launch endpoint returned HTML instead of JSON. Your middleware or proxy is intercepting /api/premium/content.",
          );
        }

        throw new Error(
          "Launch endpoint returned a non-JSON response. The API route is not behaving like an API.",
        );
      }

      const downloadUrl = safeStr(launchData.download?.url);

      if (!downloadUrl) {
        throw new Error(
          safeStr(launchData.error) ||
            "No download URL was returned for this asset.",
        );
      }

      const expiresLabel = safeStr(launchData.download?.expiresIn);
      if (expiresLabel.endsWith("m")) {
        const mins = Number(expiresLabel.slice(0, -1));
        if (Number.isFinite(mins) && mins > 0) {
          setLiveExpiresAt(new Date(Date.now() + mins * 60 * 1000));
        }
      }

      await downloadBlobToBrowser(downloadUrl, fileName);

      setStatus("success");
      onSuccess?.();
      window.setTimeout(() => setStatus("idle"), 2800);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected download error occurred.";

      setStatus("error");
      setErrorMessage(message);
      onError?.(message);
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.015, transition: { duration: 0.18 } },
    tap: { scale: 0.985, transition: { duration: 0.08 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative w-full max-w-md ${className}`}
    >
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-transparent blur-xl opacity-45" />

      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black p-6 shadow-2xl">
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${visuals.gradient}`}
        />

        <div className="relative mb-5 flex items-center justify-between border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-md" />
              <div
                className={`relative flex h-10 w-10 items-center justify-center rounded-full border bg-black/50 ${visuals.border}`}
              >
                <AssetIcon className={`h-5 w-5 ${visuals.text}`} />
              </div>
            </div>

            <div>
              <h3 className="font-serif text-sm text-white/90">{assetTitle}</h3>
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                {assetType} · premium download
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1.5">
            <Lock className="h-3 w-3 text-amber-400/60" />
            <span className="text-[8px] font-mono uppercase tracking-wider text-amber-400/60">
              Protected
            </span>
          </div>
        </div>

        <motion.button
          onClick={handleDownload}
          disabled={status === "loading" || isExpired || isLimitReached}
          variants={buttonVariants}
          initial="idle"
          whileHover={
            !isExpired && !isLimitReached && status !== "loading"
              ? "hover"
              : "idle"
          }
          whileTap={
            !isExpired && !isLimitReached && status !== "loading"
              ? "tap"
              : "idle"
          }
          className={[
            "relative w-full overflow-hidden rounded-xl px-6 py-4 font-medium transition-all duration-300",
            status === "loading" ? "cursor-wait bg-zinc-800 text-zinc-400" : "",
            status === "idle" && !isExpired && !isLimitReached
              ? `bg-gradient-to-r ${visuals.button}`
              : "",
            status === "success" ? "bg-emerald-600 text-white" : "",
            status === "error"
              ? "border border-red-500/30 bg-red-900/20 text-red-300"
              : "",
            isExpired || isLimitReached
              ? "cursor-not-allowed border border-zinc-800 bg-zinc-900 text-zinc-600"
              : "",
          ].join(" ")}
        >
          <AnimatePresence>
            {status === "loading" ? (
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5"
              />
            ) : null}
          </AnimatePresence>

          <div className="relative flex items-center justify-center gap-3">
            {status === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : null}

            {status === "idle" && !isExpired && !isLimitReached ? (
              <>
                <Download className="h-5 w-5" />
                <span className="text-sm font-mono uppercase tracking-wider">
                  Download Asset
                </span>
              </>
            ) : null}

            {status === "success" ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-mono uppercase tracking-wider">
                  Download Complete
                </span>
              </>
            ) : null}

            {status === "error" ? (
              <>
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-mono uppercase tracking-wider">
                  Download Failed
                </span>
              </>
            ) : null}

            {(isExpired || isLimitReached) && status !== "loading" ? (
              <>
                <Lock className="h-5 w-5" />
                <span className="text-sm font-mono uppercase tracking-wider">
                  {isExpired ? "Token Expired" : "Access Limit Reached"}
                </span>
              </>
            ) : null}
          </div>
        </motion.button>

        <div className="relative mt-4 border-t border-zinc-800/50 pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-white/30">
                <Download className="h-3 w-3" />
                <span>Usage</span>
              </div>

              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usageProgress}%` }}
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${visuals.gradient}`}
                />
              </div>

              <p className="text-[10px] font-mono text-white/60">
                {usedCount} / {maxDownloads}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-white/30">
                <Clock className="h-3 w-3" />
                <span>Valid for</span>
              </div>
              <p
                className={`text-[11px] font-mono ${
                  isExpired ? "text-red-400" : "text-amber-400/80"
                }`}
              >
                {timeLeft || "—"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-white/30">
                <Shield className="h-3 w-3" />
                <span>Access</span>
              </div>
              <p className="text-[11px] font-mono text-emerald-400/80">
                {tierLabel}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[8px] font-mono uppercase tracking-wider text-white/30">
              {classification}
            </div>

            {remaining > 0 && !isExpired && status !== "success" ? (
              <div className="text-[8px] font-mono uppercase tracking-wider text-white/30">
                {remaining} download{remaining !== 1 ? "s" : ""} remaining
              </div>
            ) : null}
          </div>

          <AnimatePresence>
            {status === "error" && errorMessage ? (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-2 text-[10px] font-mono text-red-400/80"
              >
                {errorMessage}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {status === "success" ? (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-950/30 px-3 py-2 text-[10px] font-mono text-emerald-400/80"
              >
                ✓ Asset transferred. Check your downloads.
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}