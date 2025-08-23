// components/Comments.tsx
"use client";

import * as React from "react";

type Props = {
  /** GitHub repo with Issues enabled and Utterances app installed */
  repo?: string; // e.g. "abrahamadaramola/abrahamoflondon-comments"
  /** How to match threads: "pathname" | "url" | "title" | "og:title" | ... */
  issueTerm?: string;
  /** Optional GitHub issue label to tag new threads */
  label?: string;
  /**
   * If your site toggles dark mode by adding/removing a "dark" class on <html>,
   * leave this true to keep the iframe theme in sync automatically.
   */
  useClassDarkMode?: boolean;
  /** Start loading the widget before it's visible */
  rootMargin?: string;
  /** Intersection threshold for lazy mount */
  threshold?: number;
  /** Extra class for the wrapper */
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

  // Compute the initial theme for the script tag
  const computeInitialTheme = React.useCallback((): string => {
    if (typeof document === "undefined") return "preferred-color-scheme";
    if (useClassDarkMode) {
      const isDark = document.documentElement.classList.contains("dark");
      return isDark ? "github-dark" : "github-light";
    }
    // Let the iframe follow OS preference by default
    return "preferred-color-scheme";
  }, [useClassDarkMode]);

  // Post a theme change to the mounted iframe
  const postThemeToIframe = React.useCallback((theme: string) => {
    try {
      const frame = containerRef.current?.querySelector<HTMLIFrameElement>(IFRAME_SELECTOR);
      frame?.contentWindow?.postMessage({ type: "set-theme", theme }, UTTERANCES_ORIGIN);
    } catch {
      /* no-op */
    }
  }, []);

  // Mount Utterances script idempotently
  const mountUtterances = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return () => {};

    // Clear any prior nodes (iframe/script) for hot re-mounts
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

    // Poll for the iframe to mark as loaded
    const poll = window.setInterval(() => {
      const hasFrame = !!el.querySelector(IFRAME_SELECTOR);
      if (hasFrame) {
        window.clearInterval(poll);
        setLoading(false);
      }
    }, 250);

    // Safety timeout: show friendly error if blocked/misconfigured
    const timeout = window.setTimeout(() => {
      const hasFrame = !!el.querySelector(IFRAME_SELECTOR);
      if (!hasFrame) {
        setError(
          "Comments failed to load. Ensure the repo exists, Issues are enabled, and the Utterances app is installed."
        );
        setLoading(false);
      }
    }, 10000);

    return () => {
      window.clearInterval(poll);
      window.clearTimeout(timeout);
    };
  }, [repo, issueTerm, label, computeInitialTheme]);

  // Lazy mount when scrolled near the section
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (readyToMount) return;

    const el = containerRef.current;
    if (!el) return;

    // If it's already on-screen, mount immediately
    const rect = el.getBoundingClientRect();
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
    io.observe(el);

    return () => io.disconnect();
  }, [readyToMount, rootMargin, threshold]);

  // Perform the actual mount once
  React.useEffect(() => {
    if (!readyToMount) return;
    const cleanup = mountUtterances();
    return () => {
      cleanup?.();
      // Remove iframe/script when unmounting
      const el = containerRef.current;
      if (el) while (el.firstChild) el.removeChild(el.firstChild);
    };
  }, [readyToMount, mountUtterances]);

  // Keep iframe theme synced with your site's dark-mode class
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let mqListenerCleanup: (() => void) | null = null;
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
      const onChange = () => postThemeToIframe(mql.matches ? "github-dark" : "github-light");
      mql.addEventListener?.("change", onChange);
      mqListenerCleanup = () => mql.removeEventListener?.("change", onChange);
    }

    return () => {
      classObserver?.disconnect();
      mqListenerCleanup?.();
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

      {/* Mount target */}
      <div ref={containerRef} className="min-h-[120px]" />

      {/* Status line (accessible) */}
      {(loading || error) && (
        <p role="status" aria-live="polite" className="mt-4 text-sm">
          {loading && !error && (
            <span className="text-deepCharcoal/70">Loading comments…</span>
          )}
          {error && <span className="text-red-600">{error}</span>}
        </p>
      )}

      {/* Noscript fallback */}
      <noscript>
        <p className="mt-4 text-sm text-deepCharcoal/70">
          Comments require JavaScript. Please enable it to view and post.
        </p>
      </noscript>
    </section>
  );
}
