"use client";

import * as React from "react";
import { useRouter } from "next/router";

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
}: CommentsProps) {
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [readyToMount, setReadyToMount] = React.useState(false);

  // Validate repo format upfront to fail fast.
  const isRepoValid = React.useMemo(() => /^[^/]+\/[^/]+$/.test(repo), [repo]);

  /** Computes the initial theme setting for the Utterances script tag. */
  const computeInitialTheme = React.useCallback((): string => {
    if (typeof document === "undefined") return "preferred-color-scheme";

    if (useClassDarkMode) {
      const isDark = document.documentElement.classList.contains("dark");
      // Use GitHub-specific themes derived from the local theme class.
      return isDark ? "github-dark" : "github-light";
    }
    // Fallback to system preference theme detection.
    return "preferred-color-scheme";
  }, [useClassDarkMode]);

  /** Posts a theme update message directly to the Utterances iframe. */
  const postThemeToIframe = React.useCallback((theme: string) => {
    try {
      const frame =
        containerRef.current?.querySelector<HTMLIFrameElement>(IFRAME_SELECTOR);
      frame?.contentWindow?.postMessage(
        { type: "set-theme", theme },
        UTTERANCES_ORIGIN,
      );
    } catch {
      // Ignore errors if the iframe is not fully ready.
      /* no-op */
    }
  }, []);

  /** Dynamically mounts the Utterances script into the host element. */
  const mountUtterances = React.useCallback(
    (host: HTMLDivElement | null | undefined) => {
      if (!host) return () => {};
      
      // Check repo validity before attempting to mount
      if (!isRepoValid) {
        setError(
          'Invalid "repo" format. Use "owner/repo", e.g. "AbrahamofLondon/abrahamoflondon-comments".',
        );
        setLoading(false);
        return () => {};
      }

      // Ensure container is clean before appending script
      while (host.firstChild) host.removeChild(host.firstChild);

      setLoading(true);
      setError(null);

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
          "Comments failed to load. Ensure the repo exists (public), Issues are enabled, and the Utterances app has access.",
        );
        setLoading(false);
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
          }
        },
        Math.max(50, pollMs),
      );

      // Timeout to declare load failure if iframe never appears
      const timeoutId = window.setTimeout(
        () => {
          const hasFrame = !!host.querySelector(IFRAME_SELECTOR);
          if (!hasFrame) onError();
        },
        Math.max(1000, timeoutMs),
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
    ],
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
          io.disconnect(); // Stop observing once mounted
        }
      },
      { root: null, rootMargin, threshold },
    );
    io.observe(host);
    return () => io.disconnect();
  }, [readyToMount, rootMargin, threshold]);

  // Mount/Remount logic: runs once `readyToMount` is true, and again on SPA route changes
  React.useEffect(() => {
    if (!readyToMount) return;
    const host = containerRef.current;
    const cleanup = mountUtterances(host);
    return () => {
      cleanup?.();
      // Clean up DOM node fully on dismount/remount
      if (host) while (host.firstChild) host.removeChild(host.firstChild); 
    };
  }, [readyToMount, mountUtterances, router.asPath]); // Reruns when the route changes (SPA navigation)

  // Dynamic theme syncing (uses MutationObserver or MediaQueryList)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let mqCleanup: (() => void) | null = null;
    let classObserver: MutationObserver | null = null;
    let raf = 0;

    /** Debounced function to send the theme update to the iframe. */
    const scheduleThemeUpdate = (isDark: boolean) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        postThemeToIframe(isDark ? "github-dark" : "github-light");
      });
    };

    if (useClassDarkMode) {
      // 1. Use MutationObserver to watch for 'dark' class changes on <html>
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
      // 2. Use MediaQueryList listener for system theme preference changes
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => scheduleThemeUpdate(mql.matches);

      mql.addEventListener?.("change", onChange);

      // Fallback for older Safari
      if (
        "addListener" in mql &&
        typeof (mql as any).addListener === "function"
      ) {
        (mql as any).addListener(onChange);
      }

      mqCleanup = () => {
        mql.removeEventListener?.("change", onChange);
        if (
          "removeListener" in mql &&
          typeof (mql as any).removeListener === "function"
        ) {
          (mql as any).removeListener(onChange);
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

  return (
    <section
      aria-labelledby="comments-title"
      className={["mt-16", className || ""].join(" ").trim()}
    >
      <h2 id="comments-title" className="sr-only">
        Comments and Discussion
      </h2>
      {/* Keyed by route path to ensure full remount on SPA navigation for correct issue linking */}
      <div key={router.asPath} ref={containerRef} className="min-h-[120px]" />
      {(loading || error) && (
        <p role="status" aria-live="polite" className="mt-4 text-sm text-aol-muted">
          {loading && !error && (
            <span className="text-current opacity-70">
              Loading comments…
            </span>
          )}
          {error && <span className="text-red-600 font-semibold">{error}</span>}
        </p>
      )}
      <noscript>
        <p className="mt-4 text-sm text-aol-muted opacity-70">
          Comments require JavaScript. Please enable it to view and post.
        </p>
      </noscript>
    </section>
  );
}