// components/Comments.tsx
"use client";

import * as React from "react";

type Props = {
  repo?: string;            // e.g. "abrahamadaramola/abrahamoflondon-comments"
  issueTerm?: string;       // "pathname" | "url" | "title" | "og:title" | ...
  label?: string;
  useClassDarkMode?: boolean;
  rootMargin?: string;
  threshold?: number;
  className?: string;
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
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [readyToMount, setReadyToMount] = React.useState(false);

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

  // Accept the host element to avoid touching ref in cleanup.
  const mountUtterances = React.useCallback(
    (host: HTMLDivElement | null | undefined) => {
      const el = host;
      if (!el) return () => {};

      // Clear old nodes
      while (el.firstChild) el.removeChild(el.firstChild);

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
      el.appendChild(script);

      const poll = window.setInterval(() => {
        const hasFrame = !!el.querySelector(IFRAME_SELECTOR);
        if (hasFrame) {
          window.clearInterval(poll);
          setLoading(false);
        }
      }, 250);

      const timeout = window.setTimeout(() => {
        const hasFrame = !!el.querySelector(IFRAME_SELECTOR);
        if (!hasFrame) {
          setError(
            "Comments failed to load. Ensure the repo exists, Issues are enabled, and the Utterances app is installed."
          );
          setLoading(false);
        }
      }, 10000);

      // Cleanup uses the captured host `el`, not the ref.
      return () => {
        window.clearInterval(poll);
        window.clearTimeout(timeout);
      };
    },
    [repo, issueTerm, label, computeInitialTheme]
  );

  // Lazy trigger for mounting
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (readyToMount) return;

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

  // Actual mount once visible
  React.useEffect(() => {
    if (!readyToMount) return;
    const host = containerRef.current; // capture once
    const cleanupTimers = mountUtterances(host);

    return () => {
      cleanupTimers?.();
      if (host) while (host.firstChild) host.removeChild(host.firstChild);
    };
  }, [readyToMount, mountUtterances]);

  // Keep iframe theme synced
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let mqCleanup: (() => void) | null = null;
    let classObserver: MutationObserver | null = null;

    if (useClassDarkMode) {
      classObserver = new MutationObserver(() => {
        const isDark = document.documentElement.classList.contains("dark");
        postThemeToIframe(isDark ? "github-dark" : "github-light");
      });
      classObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    } else if (window.matchMedia) {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () =>
        postThemeToIframe(mql.matches ? "github-dark" : "github-light");
      mql.addEventListener?.("change", onChange);
      mqCleanup = () => mql.removeEventListener?.("change", onChange);
    }

    return () => {
      classObserver?.disconnect();
      mqCleanup?.();
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

      <div ref={containerRef} className="min-h-[120px]" />

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
