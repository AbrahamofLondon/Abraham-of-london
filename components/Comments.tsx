"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  RefreshCw,
  MessageCircle,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

type IssueTerm = "pathname" | "url" | "title" | "og:title" | (string & {});

type CommentsProps = {
  /** The GitHub repository path for Utterances comments, e.g., "owner/repo". */
  repo?: string;
  /** Determines how the GitHub issue is linked, e.g., "pathname" (default) or "title". */
  issueTerm?: IssueTerm;
  /** Optional GitHub Issues label to apply to new comments/issues. */
  label?: string;
  /** If true, theme syncs dynamically using the <html class="dark"> marker. */
  useClassDarkMode?: boolean;
  /** Margin for lazy-mounting the comments iframe (Intersection Observer rootMargin). */
  rootMargin?: string;
  /** Threshold for lazy-mounting (Intersection Observer threshold). */
  threshold?: number;
  className?: string;
  /** Maximum time to wait before declaring comment load failure (ms). Default 10000. */
  timeoutMs?: number;
  /** Polling frequency for checking if the iframe has rendered (ms). Default 250. */
  pollMs?: number;
  /** Enable retry functionality for failed loads */
  enableRetry?: boolean;
  /** Custom placeholder while loading */
  placeholder?: React.ReactNode;
};

const UTTERANCES_ORIGIN = "https://utteranc.es";
const IFRAME_SELECTOR = "iframe.utterances-frame";

// Allow override via environment variable, defaulting to the specified repository.
const DEFAULT_REPO =
  (process.env.NEXT_PUBLIC_UTTERANCES_REPO as string | undefined) ??
  "AbrahamofLondon/abrahamoflondon-comments";

export default function Comments({
  repo = DEFAULT_REPO,
  issueTerm = "pathname",
  label,
  useClassDarkMode = true,
  rootMargin = "200px",
  threshold = 0.1,
  className,
  timeoutMs = 10_000,
  pollMs = 250,
  enableRetry = true,
  placeholder,
}: CommentsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [readyToMount, setReadyToMount] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [success, setSuccess] = React.useState(false);

  // Create a stable key for the current page that includes query params
  const pageKey = React.useMemo(() => {
    return searchParams.toString() ? `${pathname}?${searchParams}` : pathname;
  }, [pathname, searchParams]);

  // Validate repo format upfront to fail fast.
  const isRepoValid = React.useMemo(() => /^[^/]+\/[^/]+$/.test(repo), [repo]);

  /** Computes the initial theme setting for the Utterances script tag. */
  const computeInitialTheme = React.useCallback((): string => {
    if (typeof document === "undefined") return "preferred-color-scheme";

    if (useClassDarkMode) {
      const isDark = document.documentElement.classList.contains("dark");
      return isDark ? "github-dark" : "github-light";
    }
    return "preferred-color-scheme";
  }, [useClassDarkMode]);

  /** Posts a theme update message directly to the Utterances iframe. */
  const postThemeToIframe = React.useCallback((theme: string) => {
    try {
      const frame =
        containerRef.current?.querySelector<HTMLIFrameElement>(IFRAME_SELECTOR);
      frame?.contentWindow?.postMessage(
        { type: "set-theme", theme },
        UTTERANCES_ORIGIN
      );
    } catch {
      // Ignore errors if the iframe is not fully ready.
    }
  }, []);

  /** Retry loading comments */
  const handleRetry = React.useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryCount((prev) => prev + 1);
    // Force remount by resetting readyToMount
    setReadyToMount(false);
    setTimeout(() => setReadyToMount(true), 100);
  }, []);

  /** Dynamically mounts the Utterances script into the host element. */
  const mountUtterances = React.useCallback(
    (host: HTMLDivElement | null | undefined) => {
      if (!host) return () => {};

      // Check repo validity before attempting to mount
      if (!isRepoValid) {
        setError(
          'Invalid "repo" format. Use "owner/repo", e.g. "AbrahamofLondon/abrahamoflondon-comments".'
        );
        setLoading(false);
        return () => {};
      }

      // Ensure container is clean before appending script
      while (host.firstChild) host.removeChild(host.firstChild);

      setLoading(true);
      setError(null);
      setSuccess(false);

      const script = document.createElement("script");
      script.src = `${UTTERANCES_ORIGIN}/client.js`;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.setAttribute("repo", repo);
      script.setAttribute("issue-term", issueTerm);
      if (label?.trim()) script.setAttribute("label", label.trim());
      script.setAttribute("theme", computeInitialTheme());

      // Error handling for script loading failure
      const onError = () => {
        setError(
          "Comments failed to load. Ensure the repo exists (public), Issues are enabled, and the Utterances app has access."
        );
        setLoading(false);
        setSuccess(false);
      };

      script.addEventListener("error", onError);
      host.appendChild(script);

      // Polling to detect successful iframe load
      const pollId = window.setInterval(
        () => {
          const hasFrame = !!host.querySelector(IFRAME_SELECTOR);
          if (hasFrame) {
            window.clearInterval(pollId);
            setLoading(false);
            setSuccess(true);
            setError(null);
          }
        },
        Math.max(50, pollMs)
      );

      // Timeout to declare load failure if iframe never appears
      const timeoutId = window.setTimeout(
        () => {
          const hasFrame = !!host.querySelector(IFRAME_SELECTOR);
          if (!hasFrame) onError();
        },
        Math.max(1000, timeoutMs)
      );

      // Cleanup function to stop timers and remove event listeners
      return () => {
        script.removeEventListener("error", onError);
        window.clearInterval(pollId);
        window.clearTimeout(timeoutId);
      };
    },
    [
      repo,
      issueTerm,
      label,
      computeInitialTheme,
      isRepoValid,
      pollMs,
      timeoutMs,
      retryCount, // Include retryCount to trigger remount on retry
    ]
  );

  // Lazy loading logic (Intersection Observer)
  React.useEffect(() => {
    if (typeof window === "undefined" || readyToMount) return;

    const host = containerRef.current;
    if (!host) return;

    // Check if already in view (for pages that load quickly)
    const rect = host.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom >= 0;
    if (inView) {
      setReadyToMount(true);
      return;
    }

    // Set up Intersection Observer for lazy loading
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReadyToMount(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin, threshold }
    );
    io.observe(host);
    return () => io.disconnect();
  }, [readyToMount, rootMargin, threshold]);

  // Mount/Remount logic
  React.useEffect(() => {
    if (!readyToMount) return;
    const host = containerRef.current;
    const cleanup = mountUtterances(host);
    return () => {
      cleanup?.();
      if (host) while (host.firstChild) host.removeChild(host.firstChild);
    };
  }, [readyToMount, mountUtterances, pageKey]); // Use pageKey instead of router.asPath

  // Dynamic theme syncing
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let mqCleanup: (() => void) | null = null;
    let classObserver: MutationObserver | null = null;
    let raf = 0;

    const scheduleThemeUpdate = (isDark: boolean) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        postThemeToIframe(isDark ? "github-dark" : "github-light");
      });
    };

    if (useClassDarkMode) {
      classObserver = new MutationObserver(() => {
        const isDark = document.documentElement.classList.contains("dark");
        scheduleThemeUpdate(isDark);
      });
      classObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      scheduleThemeUpdate(document.documentElement.classList.contains("dark"));
    } else if (window.matchMedia) {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => scheduleThemeUpdate(mql.matches);

      mql.addEventListener?.("change", onChange);

      if (
        "addListener" in mql &&
        typeof (mql as { addListener?: unknown }).addListener === "function"
      ) {
        (
          mql as {
            addListener: (
              callback: (this: MediaQueryList, ev: MediaQueryListEvent) => void
            ) => void;
          }
        ).addListener(onChange);
      }

      mqCleanup = () => {
        mql.removeEventListener?.("change", onChange);
        if (
          "removeListener" in mql &&
          typeof (mql as { removeListener?: unknown }).removeListener ===
            "function"
        ) {
          (
            mql as {
              removeListener: (
                callback: (
                  this: MediaQueryList,
                  ev: MediaQueryListEvent
                ) => void
              ) => void;
            }
          ).removeListener(onChange);
        }
      };

      scheduleThemeUpdate(mql.matches);
    }

    return () => {
      classObserver?.disconnect();
      mqCleanup?.();
      cancelAnimationFrame(raf);
    };
  }, [useClassDarkMode, postThemeToIframe]);

  // Default placeholder component
  const defaultPlaceholder = (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center space-x-3 text-aol-muted">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Loading comments...</span>
      </div>
    </div>
  );

  return (
    <section
      aria-labelledby="comments-title"
      className={[
        "mt-16 rounded-lg border border-aol-border bg-white dark:bg-aol-dark dark:border-aol-dark-border",
        "shadow-sm transition-all duration-200",
        className || "",
      ]
        .join(" ")
        .trim()}
    >
      <div className="px-6 py-4 border-b border-aol-border dark:border-aol-dark-border">
        <h2
          id="comments-title"
          className="text-lg font-semibold text-aol-text dark:text-aol-dark-text flex items-center gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          Comments
        </h2>
        <p className="text-sm text-aol-muted mt-1">
          Join the discussion using GitHub issues
        </p>
      </div>

      <div
        key={pageKey}
        ref={containerRef}
        className="min-h-[200px] transition-opacity duration-300"
      />

      {/* Loading State */}
      {loading && !error && (
        <div className="px-6 py-8">{placeholder || defaultPlaceholder}</div>
      )}

      {/* Error State */}
      {error && (
        <div className="px-6 py-8 text-center">
          <div className="max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-aol-text dark:text-aol-dark-text mb-2">
              Unable to load comments
            </h3>
            <p className="text-aol-muted text-sm mb-4">{error}</p>
            {enableRetry && (
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-aol-primary text-white rounded-md hover:bg-aol-primary-dark transition-colors text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success State Indicator */}
      {success && !loading && (
        <div className="px-6 py-3 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
            <CheckCircle className="h-4 w-4" />
            Comments loaded successfully
          </div>
        </div>
      )}

      <noscript>
        <div className="px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-400 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Comments require JavaScript. Please enable it to view and post.
          </p>
        </div>
      </noscript>
    </section>
  );
}
