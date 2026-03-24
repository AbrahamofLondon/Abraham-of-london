"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  RefreshCw,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type IssueTerm = "pathname" | "url" | "title" | "og:title" | (string & {});
type Status = "idle" | "loading" | "success" | "error" | "timeout";

interface CommentsProps {
  repo?: string;
  issueTerm?: IssueTerm;
  label?: string;
  useClassDarkMode?: boolean;
  rootMargin?: string;
  threshold?: number;
  className?: string;
  timeoutMs?: number;
  pollMs?: number;
  enableRetry?: boolean;
  placeholder?: React.ReactNode;
  showSuccessIndicator?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

const UTTERANCES_ORIGIN = "https://utteranc.es";
const IFRAME_SELECTOR = "iframe.utterances-frame";
const DEFAULT_REPO =
  process.env.NEXT_PUBLIC_UTTERANCES_REPO ??
  "AbrahamofLondon/abrahamoflondon-comments";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function UtterancesComments({
  repo = DEFAULT_REPO,
  issueTerm = "pathname",
  label,
  useClassDarkMode = true,
  rootMargin = "240px",
  threshold = 0.08,
  className = "",
  timeoutMs = 10000,
  pollMs = 250,
  enableRetry = true,
  placeholder,
  showSuccessIndicator = true,
  onLoad,
  onError,
}: CommentsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = React.useRef<Status>("idle");

  React.useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const pageKey = React.useMemo(() => {
    const qs = searchParams?.toString() || "";
    return qs ? `${pathname}?${qs}` : pathname || "/";
  }, [pathname, searchParams]);

  const isRepoValid = React.useMemo(() => /^[^/]+\/[^/]+$/.test(repo), [repo]);

  React.useEffect(() => {
    if (!useClassDarkMode) return;

    const syncTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [useClassDarkMode]);

  const clearTimers = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  React.useEffect(() => clearTimers, [clearTimers]);

  const resetContainer = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }, []);

  const handleFailure = React.useCallback(
    (message: string, kind: "error" | "timeout" = "error") => {
      clearTimers();
      setStatus(kind);
      setErrorMessage(message);
      onError?.(message);
    },
    [clearTimers, onError]
  );

  const mountUtterances = React.useCallback(() => {
    if (!containerRef.current) return;

    if (!isRepoValid) {
      handleFailure('Invalid repository format. Use "owner/repo".');
      return;
    }

    resetContainer();
    setErrorMessage(null);
    setStatus("loading");

    const script = document.createElement("script");
    script.src = `${UTTERANCES_ORIGIN}/client.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("repo", repo);
    script.setAttribute("issue-term", issueTerm);
    if (label?.trim()) script.setAttribute("label", label.trim());
    script.setAttribute("theme", theme === "dark" ? "github-dark" : "github-light");

    const onScriptError = () => {
      handleFailure("Failed to load comment system. Please check your connection.");
    };

    script.addEventListener("error", onScriptError);
    containerRef.current.appendChild(script);

    if (timeoutMs > 0) {
      timeoutRef.current = setTimeout(() => {
        if (statusRef.current === "loading") {
          handleFailure("Comments are taking longer than expected to load.", "timeout");
        }
      }, timeoutMs);
    }

    pollRef.current = setInterval(() => {
      const frame = containerRef.current?.querySelector(IFRAME_SELECTOR);
      if (frame) {
        clearTimers();
        setStatus("success");
        setErrorMessage(null);
        onLoad?.();
      }
    }, pollMs);

    return () => {
      script.removeEventListener("error", onScriptError);
      clearTimers();
    };
  }, [
    clearTimers,
    handleFailure,
    isRepoValid,
    issueTerm,
    label,
    onLoad,
    pollMs,
    repo,
    resetContainer,
    theme,
    timeoutMs,
  ]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (status !== "idle") return;

    const host = containerRef.current;
    if (!host) return;

    const rect = host.getBoundingClientRect();
    const inView = rect.top < window.innerHeight + 120 && rect.bottom >= -120;

    if (inView) {
      setStatus("loading");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setStatus("loading");
          io.disconnect();
        }
      },
      { root: null, rootMargin, threshold }
    );

    io.observe(host);
    return () => io.disconnect();
  }, [rootMargin, status, threshold, retryCount]);

  React.useEffect(() => {
    if (status !== "loading") return;
    const cleanup = mountUtterances();
    return cleanup;
  }, [status, mountUtterances, pageKey, retryCount]);

  React.useEffect(() => {
    if (status !== "success") return;

    const frame = containerRef.current?.querySelector<HTMLIFrameElement>(IFRAME_SELECTOR);
    if (!frame?.contentWindow) return;

    frame.contentWindow.postMessage(
      {
        type: "set-theme",
        theme: theme === "dark" ? "github-dark" : "github-light",
      },
      UTTERANCES_ORIGIN
    );
  }, [theme, status]);

  React.useEffect(() => {
    setStatus("idle");
    setErrorMessage(null);
    clearTimers();
    resetContainer();
  }, [pageKey, clearTimers, resetContainer]);

  const handleRetry = React.useCallback(() => {
    clearTimers();
    resetContainer();
    setRetryCount((prev) => prev + 1);
    setErrorMessage(null);
    setStatus("idle");
  }, [clearTimers, resetContainer]);

  const defaultPlaceholder = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A96A]/25 bg-[#C9A96A]/8">
        <RefreshCw className="h-5 w-5 animate-spin text-[#A37F3D] dark:text-[#D4B06A]" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(201,169,106,0.12),transparent_68%)]" />
      </div>

      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-black/70 dark:text-white/70">
        Loading discussion
      </p>

      <p className="mt-2 max-w-md text-sm leading-6 text-black/50 dark:text-white/50">
        Preparing the readers’ exchange via GitHub Issues.
      </p>
    </div>
  );

  return (
    <section
      aria-labelledby="comments-title"
      className={cx(
        "relative mt-16 overflow-hidden rounded-[28px] border",
        "border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,245,240,0.92))]",
        "shadow-[0_24px_80px_rgba(0,0,0,0.08)]",
        "dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.96))] dark:shadow-[0_32px_90px_rgba(0,0,0,0.34)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96A]/45 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,169,106,0.08),transparent_26%)]" />

      <header className="relative border-b border-black/8 px-6 py-6 dark:border-white/8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/25 bg-[#C9A96A]/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A37F3D] dark:text-[#D4B06A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96A]" />
              Public Record
            </div>

            <h2
              id="comments-title"
              className="flex items-center gap-2 font-serif text-[1.45rem] font-semibold tracking-[0.01em] text-black/92 dark:text-white/92"
            >
              <MessageCircle className="h-5 w-5 text-[#A37F3D] dark:text-[#D4B06A]" />
              Discussion
            </h2>

            <p className="mt-1 max-w-xl text-sm leading-6 text-black/55 dark:text-white/55">
              Join the conversation through GitHub Issues. Measured responses preferred.
            </p>
          </div>

          {status === "success" && showSuccessIndicator && (
            <span
              className={cx(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2",
                "border-emerald-600/20 bg-emerald-600/8 text-emerald-700",
                "dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                Live
              </span>
            </span>
          )}
        </div>
      </header>

      <div className="relative">
        <div
          key={`${pageKey}-${retryCount}`}
          ref={containerRef}
          className={cx(
            "min-h-[260px] transition-opacity duration-300",
            status === "success" ? "opacity-100" : "opacity-100"
          )}
          aria-live="polite"
        />

        {status === "loading" && (
          <div className="px-6 py-8">
            {placeholder || defaultPlaceholder}
          </div>
        )}

        {(status === "error" || status === "timeout") && (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto max-w-md">
              <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-red-500/15 bg-red-500/8">
                <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
              </div>

              <h3 className="mt-5 font-serif text-xl font-semibold text-black/90 dark:text-white/90">
                {status === "timeout" ? "Loading Timeout" : "Unable to Load Discussion"}
              </h3>

              <p className="mt-3 text-sm leading-6 text-black/55 dark:text-white/55">
                {errorMessage || "There was a problem loading the discussion module."}
              </p>

              {enableRetry && (
                <button
                  onClick={handleRetry}
                  className={cx(
                    "mt-7 inline-flex items-center gap-2 rounded-xl border px-5 py-2.5",
                    "border-[#C9A96A]/30 bg-[#A37F3D] text-sm font-semibold text-white",
                    "shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition-all hover:bg-[#8A682F]",
                    "focus:outline-none focus:ring-2 focus:ring-[#C9A96A]/45 focus:ring-offset-2 focus:ring-offset-white",
                    "dark:focus:ring-offset-slate-950"
                  )}
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="sr-only" role="status">
            Comments loaded successfully
          </div>
        )}
      </div>

      <footer className="relative border-t border-black/8 px-6 py-4 dark:border-white/8">
        <p className="text-[11px] uppercase tracking-[0.16em] text-black/35 dark:text-white/35">
          Discussion is hosted externally via GitHub Issues.
        </p>
      </footer>

      <noscript>
        <div className="border-t border-amber-200 bg-amber-50 px-6 py-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-3 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">JavaScript Required</p>
              <p className="mt-1 opacity-90">
                Comments require JavaScript to load. Please enable it in your browser settings to join the discussion.
              </p>
            </div>
          </div>
        </div>
      </noscript>
    </section>
  );
}