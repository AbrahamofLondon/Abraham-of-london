// components/Comments.tsx
"use client";

import * as React from "react";

type Props = {
  /** GitHub repo "owner/name" with Issues enabled and Utterances app installed */
  repo?: string;
  /** How to match threads: "pathname" | "url" | "title" | "og:title" | ... */
  issueTerm?: string;
  /** Optional GitHub issue label to tag new threads */
  label?: string;
  /** If your site toggles dark mode via a "dark" class on <html>, set true */
  useClassDarkMode?: boolean;
};

export default function Comments({
  repo = "abrahamadaramola/abrahamoflondon-comments",
  issueTerm = "pathname",
  label = "comments",
  useClassDarkMode = true,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Pick an initial theme
  const getTheme = React.useCallback(() => {
    if (useClassDarkMode) {
      const isDark = document.documentElement.classList.contains("dark");
      return isDark ? "github-dark" : "github-light";
    }
    // Fallback lets the iframe follow user OS preference
    return "preferred-color-scheme";
  }, [useClassDarkMode]);

  // Inject script (idempotent)
  const mountUtterances = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    // Clear any prior content (iframe, script)
    while (el.firstChild) el.removeChild(el.firstChild);

    const script = document.createElement("script");
    script.src = "https://utteranc.es/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("repo", repo);
    script.setAttribute("issue-term", issueTerm);
    script.setAttribute("label", label);
    script.setAttribute("theme", getTheme());

    el.appendChild(script);

    // If it doesn’t load within 10s, show a friendly message (often repo/perm issue)
    const timer = window.setTimeout(() => {
      const hasIframe = !!el.querySelector("iframe.utterances-frame");
      if (!hasIframe) {
        setError(
          "Comments failed to load. Make sure the GitHub repo exists, has Issues enabled, and the Utterances app is installed."
        );
      }
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [repo, issueTerm, label, getTheme]);

  React.useEffect(() => {
    setError(null);
    const clearTimer = mountUtterances();

    // Observe dark/light class changes and live-update the iframe theme
    let observer: MutationObserver | null = null;
    if (useClassDarkMode) {
      observer = new MutationObserver(() => {
        const frame = containerRef.current?.querySelector<HTMLIFrameElement>(
          "iframe.utterances-frame"
        );
        const theme = getTheme();
        frame?.contentWindow?.postMessage({ type: "set-theme", theme }, "https://utteranc.es");
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    }

    return () => {
      observer?.disconnect();
      // Cleanup everything
      const el = containerRef.current;
      if (el) while (el.firstChild) el.removeChild(el.firstChild);
      clearTimer && clearTimer();
    };
  }, [mountUtterances, useClassDarkMode, getTheme]);

  return (
    <section aria-labelledby="comments-title" className="mt-16">
      <h2 id="comments-title" className="sr-only">
        Comments
      </h2>
      <div ref={containerRef} className="min-h-[120px]" />
      {error && (
        <p className="mt-4 text-sm text-red-600">
          {error} (Repo: <code>{repo}</code>)
        </p>
      )}
    </section>
  );
}
