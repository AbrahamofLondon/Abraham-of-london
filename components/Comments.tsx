// components/Comments.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/router";

type IssueTerm =
  | "pathname"
  | "url"
  | "title"
  | "og:title"
  | (string & {}); // allow custom selectors if needed

type Props = {
  repo?: string;              // e.g. "abrahamadaramola/abrahamoflondon-comments"
  issueTerm?: IssueTerm;      // default: "pathname"
  label?: string;             // GitHub Issues label
  useClassDarkMode?: boolean; // sync with <html class="dark">
  rootMargin?: string;        // lazy-mount margin
  threshold?: number;         // lazy-mount threshold
  className?: string;

  /** Optional: how long to wait before declaring load failure (ms). Default 10000. */
  timeoutMs?: number;
  /** Optional: how often to poll for the iframe (ms). Default 250. */
  pollMs?: number;
};

const UTTERANCES_ORIGIN = "https://utteranc.es";
const IFRAME_SELECTOR = "iframe.utterances-frame";

export default function Comments({
  repo = "abrahamadaramola/abrahamoflondon-comments",
  issueTerm = "pathname",
  label = "comments",
  useClassDarkMode = true,
  rootMargin = "200px",
  threshold = 0.1,
  className,
  timeoutMs = 10_000,
  pollMs = 250,
}: Props) {
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [readyToMount, setReadyToMount] = React.useState(false);

  const isRepoValid = React.useMemo(
    () => /^[^/]+\/[^/]+$/.test(repo),
    [repo]
  );

  const computeInitialTheme = React.useCallback((): string => {
    if (typeof document === "undefined") return "preferred-color-scheme";
    if (useClassDarkMode) {
      const isDark = document.documentElement.classList.contains("dark");
      return isDark ? "github-dark" : "github-light";
    }
    return "preferred-color-scheme";
  }, [useClassDarkMode]);

  const postThemeToIframe = React.useCallback((theme: string) => {
    try {
      const frame =
        containerRef.current?.querySelector<HTMLIFrameElement>(IFRAME_SELECTOR);
      frame?.contentWindow?.postMessage({ type: "set-theme", theme }, UTTERANCES_ORIGIN);
    } catch {
      /* no-op */
    }
  }, []);

  /**
   * Mount utterances script into the provided host element.
   * Returns a cleanup function for timers.
   */
  const mountUtterances = React.useCallback(
    (host: HTMLDivElement | null | undefined) => {
      if (!host) return () => {};

      // Validate repo early
      if (!isRepoValid) {
        setError('Invalid "repo" format. Use "owner/repo", e.g. "owner/my-comments".');
        setLoading(false);
        return () => {};
      }

      // Clear old nodes
      while (host.firstChild) host.removeChild(host.firstChild);

      setLoading(true);
      setError(null);

      const script = document.createElement("script");
      script.src = `${UTTERANCES_ORIGIN}/client.js`;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.setAttribute("repo", repo);
      script.setAttribute("issue-term", issueTerm);
      script.setAttribute("label", label);
      script.setAttribute("theme", computeInitialTheme());

      const onError = () => {
        setError(
          "Comments failed to load. Confirm the repo exists, Issues are enabled, and the Utterances app is installed."
        );
        setLoading(false);
      };
      script.addEventListener("error", onError);

      host.appendChild(script);

      const poll = window.setInterval(() => {
        const hasFrame = !!host.querySelector(IFRAME_SELECTOR);
        if (hasFrame) {
          window.clearInterval(poll);
          setLoading(false);
        }
      }, Math.max(50, pollMs));

      const timeout = window.setTimeout(() => {
        const hasFrame = !!host.querySelector(IFRAME_SELECTOR);
        if (!hasFrame) onError();
      }, Math.max(1000, timeoutMs));

      // Cleanup uses captured host & listeners
      return () => {
        script.removeEventListener("error", onError);
        window.clearInterval(poll);
        window.clearTimeout(timeout);
      };
    },
    [repo, issueTerm, label, computeInitialTheme, isRepoValid, pollMs, timeoutMs]
  );

  // Lazy trigger for mounting when visible
  React.useEffect(() => {
    if (typeof window === "undefined" || readyToMount) return;

    const host = containerRef.current;
    if (!host) return;

    const rect = host.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom >= 0;
    if (inView) {
      setReadyToMount(true);
      return;
    }

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

  // Actual mount once visible, and re-mount on SPA route changes
  React.useEffect(() => {
    if (!readyToMount) return;
    const host = containerRef.current;
    const cleanup = mountUtterances(host);

    return () => {
      cleanup?.();
      if (host) while (host.firstChild) host.removeChild(host.firstChild);
    };
    // Re-run when route changes so utterances binds to the new page's issue
  }, [readyToMount, mountUtterances, router.asPath]);

  // Keep iframe theme synced with <html class="dark"> OR system preference (debounced via rAF)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let mqCleanup: (() => void) | null = null;
    let classObserver: MutationObserver | null = null;
    let raf = 0;

    const schedule = (isDark: boolean) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        postThemeToIframe(isDark ? "github-dark" : "github-light");
      });
    };

    if (useClassDarkMode) {
      classObserver = new MutationObserver(() => {
        const isDark = document.documentElement.classList.contains("dark");
        schedule(isDark);
      });
      classObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      // Fire once to ensure initial sync if mount happened pre-observe
      schedule(document.documentElement.classList.contains("dark"));
    } else if (window.matchMedia) {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => schedule(mql.matches);
      mql.addEventListener?.("change", onChange);
      // Safari legacy fallback
      // @ts-expect-error
      mql.addListener?.(onChange);
      mqCleanup = () => {
        mql.removeEventListener?.("change", onChange);
        // @ts-expect-error
        mql.removeListener?.(onChange);
      };
      // Also a one-shot to apply current system state
      schedule(mql.matches);
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
        Comments
      </h2>

      {/* Key by route to guarantee remount on SPA navigations */}
      <div key={router.asPath} ref={containerRef} className="min-h-[120px]" />

      {(loading || error) && (
        <p role="status" aria-live="polite" className="mt-4 text-sm">
          {loading && !error && (
            <span className="text-deepCharcoal/70">Loading comments…</span>
          )}
          {error && <span className="text-red-600">{error}</span>}
        </p>
      )}

      <noscript>
        <p className="mt-4 text-sm text-deepCharcoal/70">
          Comments require JavaScript. Please enable it to view and post.
        </p>
      </noscript>
    </section>
  );
}
