// components/comments/UtterancesComments.tsx
"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  RefreshCw,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

type IssueTerm = "pathname" | "url" | "title" | "og:title" | (string & {});

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
const DEFAULT_REPO = process.env.NEXT_PUBLIC_UTTERANCES_REPO ?? "AbrahamofLondon/abrahamoflondon-comments";

export default function Comments({
  repo = DEFAULT_REPO,
  issueTerm = "pathname",
  label,
  useClassDarkMode = true,
  rootMargin = "200px",
  threshold = 0.1,
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
  const [state, setState] = React.useState<{
    status: 'idle' | 'loading' | 'success' | 'error' | 'timeout';
    errorMessage: string | null;
    retryCount: number;
  }>({
    status: 'idle',
    errorMessage: null,
    retryCount: 0,
  });
  
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  
  // ✅ FIXED: Initialize refs with undefined
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const pollRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Create a stable key for the current page
  const pageKey = React.useMemo(() => {
    return searchParams.toString() ? `${pathname}?${searchParams}` : pathname;
  }, [pathname, searchParams]);

  // Validate repo format
  const isRepoValid = React.useMemo(() => /^[^/]+\/[^/]+$/.test(repo), [repo]);

  // Detect theme
  React.useEffect(() => {
    if (!useClassDarkMode) return;
    
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, [useClassDarkMode]);

  // Clean up timers
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const clearTimers = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = undefined;
    }
  }, []);

  const handleError = React.useCallback((message: string) => {
    setState(prev => ({ ...prev, status: 'error', errorMessage: message }));
    clearTimers();
    onError?.(message);
  }, [clearTimers, onError]);

  const mountUtterances = React.useCallback(() => {
    if (!containerRef.current) return;

    if (!isRepoValid) {
      handleError('Invalid repository format. Use "owner/repo", e.g., "user/repo".');
      return;
    }

    // Clean container
    const container = containerRef.current;
    while (container.firstChild) container.removeChild(container.firstChild);

    setState(prev => ({ ...prev, status: 'loading', errorMessage: null }));

    const script = document.createElement("script");
    script.src = `${UTTERANCES_ORIGIN}/client.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("repo", repo);
    script.setAttribute("issue-term", issueTerm);
    if (label?.trim()) script.setAttribute("label", label.trim());
    script.setAttribute("theme", theme === 'dark' ? "github-dark" : "github-light");

    const onScriptError = () => {
      handleError('Failed to load comment system. Please check your connection.');
    };

    script.addEventListener("error", onScriptError);
    container.appendChild(script);

    // Set timeout
    if (timeoutMs > 0) {
      timeoutRef.current = setTimeout(() => {
        if (state.status === 'loading') {
          handleError('Comments are taking longer than expected to load.');
        }
      }, timeoutMs);
    }

    // Poll for iframe
    pollRef.current = setInterval(() => {
      const hasFrame = container.querySelector(IFRAME_SELECTOR);
      if (hasFrame) {
        clearTimers();
        setState(prev => ({ ...prev, status: 'success' }));
        onLoad?.();
      }
    }, pollMs);

    // Return cleanup function
    return () => {
      script.removeEventListener("error", onScriptError);
      clearTimers();
    };
  }, [repo, issueTerm, label, theme, isRepoValid, timeoutMs, pollMs, state.status, handleError, clearTimers, onLoad]);

  // Lazy loading with Intersection Observer
  React.useEffect(() => {
    if (typeof window === "undefined" || state.status !== 'idle') return;

    const host = containerRef.current;
    if (!host) return;

    const rect = host.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom >= 0;
    
    if (inView) {
      setState(prev => ({ ...prev, status: 'loading' }));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState(prev => ({ ...prev, status: 'loading' }));
          io.disconnect();
        }
      },
      { root: null, rootMargin, threshold }
    );
    
    io.observe(host);
    return () => io.disconnect();
  }, [state.status, rootMargin, threshold]);

  // Mount comments when status becomes 'loading' or on retry
  React.useEffect(() => {
    if (state.status !== 'loading') return;
    
    const cleanup = mountUtterances();
    return cleanup;
  }, [state.status, mountUtterances, pageKey, state.retryCount]);

  // Theme sync
  React.useEffect(() => {
    if (state.status !== 'success') return;
    
    const frame = containerRef.current?.querySelector<HTMLIFrameElement>(IFRAME_SELECTOR);
    const utterancesTheme = theme === 'dark' ? "github-dark" : "github-light";
    
    frame?.contentWindow?.postMessage(
      { type: "set-theme", theme: utterancesTheme },
      UTTERANCES_ORIGIN
    );
  }, [theme, state.status]);

  const handleRetry = React.useCallback(() => {
    clearTimers();
    setState(prev => ({
      status: 'loading',
      errorMessage: null,
      retryCount: prev.retryCount + 1,
    }));
  }, [clearTimers]);

  const defaultPlaceholder = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
        <div className="absolute inset-0 animate-pulse rounded-full bg-amber-500/5" />
      </div>
      <p className="mt-4 font-medium text-gray-700 dark:text-gray-300">
        Loading community discussion...
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Join the conversation using GitHub issues
      </p>
    </div>
  );

  return (
    <section
      aria-labelledby="comments-title"
      className={`
        mt-16 overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm
        dark:border-gray-800 dark:bg-gray-900/50
        transition-all duration-200
        ${className}
      `}
    >
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2
              id="comments-title"
              className="flex items-center gap-2 font-serif text-xl font-semibold text-gray-900 dark:text-gray-100"
            >
              <MessageCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Discussion
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Join the conversation using GitHub Issues
            </p>
          </div>
          {state.status === 'success' && showSuccessIndicator && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="h-3.5 w-3.5" />
              Live
            </span>
          )}
        </div>
      </div>

      {/* Comments Container */}
      <div
        key={`${pageKey}-${state.retryCount}`}
        ref={containerRef}
        className="min-h-[250px] transition-opacity duration-300"
        aria-live="polite"
      />

      {/* Loading State */}
      {state.status === 'loading' && (
        <div className="px-6 py-8">
          {placeholder || defaultPlaceholder}
        </div>
      )}

      {/* Error State */}
      {(state.status === 'error' || state.status === 'timeout') && (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="inline-flex items-center justify-center rounded-full bg-red-100 p-3 dark:bg-red-900/30">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              {state.status === 'timeout' ? 'Loading Timeout' : 'Unable to Load Comments'}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {state.errorMessage || 'There was a problem loading the discussion.'}
            </p>
            {enableRetry && (
              <button
                onClick={handleRetry}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:bg-amber-500 dark:hover:bg-amber-600"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success State - Hidden but accessible */}
      {state.status === 'success' && (
        <div className="sr-only" role="status">
          Comments loaded successfully
        </div>
      )}

      {/* NoScript Fallback */}
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