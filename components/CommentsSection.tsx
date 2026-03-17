// components/comments/HyvorComments.tsx
"use client";

import * as React from "react";
import Script from "next/script";
import { MessageCircle, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

interface HyvorCommentsProps {
  slug: string;
  title?: string;
  websiteId?: string;
  className?: string;
  loadingTimeout?: number;
  enableRetry?: boolean;
  useDarkMode?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export const HyvorComments: React.FC<HyvorCommentsProps> = ({
  slug,
  title,
  websiteId: propWebsiteId,
  className = "",
  loadingTimeout = 10000,
  enableRetry = true,
  useDarkMode = true,
  onLoad,
  onError,
}) => {
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error' | 'timeout'>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [retryKey, setRetryKey] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // ✅ FIXED: Properly typed refs with initial values
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const scriptLoadedRef = React.useRef<boolean>(false);

  const websiteId = React.useMemo(() => {
    const id = propWebsiteId || process.env.NEXT_PUBLIC_HYVOR_WEBSITE_ID;
    return typeof id === 'string' && id.trim() ? id.trim() : null;
  }, [propWebsiteId]);

  const pageId = React.useMemo(() => {
    if (slug) return slug;
    if (typeof window !== "undefined") {
      return window.location.pathname;
    }
    return "";
  }, [slug]);

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Reset status when retry is triggered
  React.useEffect(() => {
    setStatus('loading');
    setErrorMessage(null);
    scriptLoadedRef.current = false;
    
    // Set a timeout to detect if loading takes too long
    if (loadingTimeout > 0) {
      timeoutRef.current = setTimeout(() => {
        // Only set timeout if still loading and script hasn't loaded
        setStatus(prev => {
          if (prev === 'loading' && !scriptLoadedRef.current) {
            return 'timeout';
          }
          return prev;
        });
        if (!scriptLoadedRef.current) {
          setErrorMessage('Comments are taking longer than expected to load.');
          onError?.('timeout');
        }
      }, loadingTimeout);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };
  }, [retryKey, loadingTimeout, onError]);

  const handleScriptLoad = React.useCallback(() => {
    scriptLoadedRef.current = true;
    
    // Clear timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    
    try {
      const anyWindow = window as unknown as {
        HYVOR_TALK?: { 
          init: (config: {
            websiteId: string;
            container: string;
            page: { id: string; title?: string };
            theme?: string;
            language?: string;
          }) => void;
        };
      };

      if (!anyWindow.HYVOR_TALK) {
        setStatus('error');
        setErrorMessage('Comment system failed to initialize.');
        onError?.('initialization_failed');
        return;
      }

      // Apply theme based on dark mode preference
      const theme = useDarkMode && document.documentElement.classList.contains('dark') 
        ? 'dark' 
        : 'light';

      anyWindow.HYVOR_TALK.init({
        websiteId: websiteId!,
        container: "#hyvor-talk-view",
        page: {
          id: pageId,
          title: title || document.title,
        },
        theme,
        language: "en",
      });

      setStatus('success');
      onLoad?.();
      
    } catch (error) {
      setStatus('error');
      const message = error instanceof Error ? error.message : 'Failed to initialize comments';
      setErrorMessage(message);
      onError?.(message);
    }
  }, [websiteId, pageId, title, useDarkMode, onLoad, onError]);

  const handleScriptError = React.useCallback(() => {
    scriptLoadedRef.current = false;
    setStatus('error');
    setErrorMessage('Failed to load comment system. Please check your connection.');
    onError?.('script_load_failed');
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, [onError]);

  const handleRetry = React.useCallback(() => {
    setRetryKey(prev => prev + 1);
  }, []);

  // If not configured, show graceful placeholder with better design
  if (!websiteId) {
    return (
      <section 
        className={`
          mt-16 rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-amber-100/30 
          px-8 py-8 text-left text-sm text-amber-800 shadow-sm
          dark:border-amber-800/30 dark:from-amber-900/20 dark:to-amber-800/10 dark:text-amber-200
          ${className}
        `}
        aria-label="Comments configuration notice"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="mb-1 font-serif text-base font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              Comments Configuration Required
            </h3>
            <p className="leading-relaxed text-amber-700 dark:text-amber-300/80">
              The comment system for this article is being prepared. 
              Please check back soon for community discussions.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className={`
        mt-16 overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm
        dark:border-gray-800 dark:bg-gray-900/50
        transition-all duration-200
        ${className}
      `}
      aria-label="Comments section"
      key={retryKey}
    >
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-gray-900 dark:text-gray-100">
              <MessageCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Join the Conversation
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Share your thoughts and insights with the community
            </p>
          </div>
          {status === 'success' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="h-3.5 w-3.5" />
              Comments loaded
            </span>
          )}
        </div>
      </div>

      {/* Comments Container */}
      <div className="p-6">
        <div 
          ref={containerRef}
          id="hyvor-talk-view"
          className="min-h-[300px] transition-opacity duration-300"
          aria-live="polite"
        />

        {/* Loading State */}
        {status === 'loading' && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
                <div className="absolute inset-0 animate-pulse rounded-full bg-amber-500/5" />
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Loading comments...
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This may take a moment
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {(status === 'error' || status === 'timeout') && (
          <div className="py-8 text-center">
            <div className="mx-auto max-w-md">
              <div className="inline-flex items-center justify-center rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                {status === 'timeout' ? 'Loading Timeout' : 'Unable to Load Comments'}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {errorMessage || 'There was a problem loading the comment section.'}
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
      </div>

      {/* NoScript Fallback */}
      <noscript>
        <div className="border-t border-amber-200 bg-amber-50 px-6 py-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              JavaScript is required to view and post comments. Please enable it in your browser settings.
            </p>
          </div>
        </div>
      </noscript>

      <Script
        src="https://talk.hyvor.com/web-api/embed.js"
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
        id={`hyvor-comments-script-${retryKey}`}
      />
    </section>
  );
};

export default HyvorComments;