"use client";

import React from "react";

type Platform = "twitter" | "linkedin" | "facebook" | "email" | "copy";

interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
  variant?: "minimal" | "standard" | "expanded";
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  platforms?: Platform[];
  onShare?: (platform: Platform | "native" | "validation", url: string) => void;
  onError?: (error: Error, platform: Platform | "native" | "validation") => void;
}

// Platform configurations
const PLATFORM_CONFIG: Record<
  Exclude<Platform, never>,
  {
    name: string;
    color: string;
    icon: JSX.Element;
  }
> = {
  twitter: {
    name: "Twitter",
    color: "hover:bg-blue-50 hover:text-blue-600",
    icon: (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
  },
  linkedin: {
    name: "LinkedIn",
    color: "hover:bg-blue-50 hover:text-blue-700",
    icon: (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M19.7 3H4.3A1.3 1.3 0 003 4.3v15.4A1.3 1.3 0 004.3 21h15.4a1.3 1.3 0 001.3-1.3V4.3A1.3 1.3 0 0019.7 3zM8.339 18.338H5.667v-8.59h2.672v8.59zM7.004 8.574a1.548 1.548 0 11-.002-3.096 1.548 1.548 0 01.002 3.096zm11.335 9.764H15.67v-4.177c0-.996-.017-2.278-1.387-2.278-1.389 0-1.601 1.086-1.601 2.206v4.25h-2.667v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.779 3.203 4.092v4.71z" />
      </svg>
    ),
  },
  facebook: {
    name: "Facebook",
    color: "hover:bg-blue-50 hover:text-blue-800",
    icon: (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  email: {
    name: "Email",
    color: "hover:bg-gray-50 hover:text-gray-700",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  copy: {
    name: "Copy Link",
    color: "hover:bg-green-50 hover:text-green-600",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
  },
} as const;

// Size configurations
const SIZE_CONFIG = {
  sm: {
    button: "p-1.5",
    icon: "h-4 w-4",
    text: "text-xs",
  },
  md: {
    button: "p-2",
    icon: "h-5 w-5",
    text: "text-sm",
  },
  lg: {
    button: "p-3",
    icon: "h-6 w-6",
    text: "text-base",
  },
} as const;

export default function ShareButtons({
  url,
  title,
  className = "",
  variant = "standard",
  size = "md",
  showLabels = false,
  platforms = ["twitter", "linkedin", "facebook", "email", "copy"],
  onShare,
  onError,
}: ShareButtonsProps) {
  const [copied, setCopied] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(false);

  // Check if Web Share API is supported (client-only)
  React.useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setIsSupported(true);
    }
  }, []);

  // Validate URL
  const isValidUrl = React.useMemo(() => {
    try {
      // eslint-disable-next-line no-new
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, [url]);

  if (!isValidUrl) {
    console.warn("ShareButtons: Invalid URL provided", url);
    if (onError) {
      onError(new Error("Invalid URL"), "validation");
    }
    return null;
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  type SharePlatform = Exclude<Platform, "copy">;

  const shareLinks: Record<SharePlatform, string> = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
  };

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        onShare?.("copy", url);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();

      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopied(true);
      onShare?.("copy", url);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      if (onError) {
        onError(error as Error, "copy");
      }
    }
  };

  const handleNativeShare = async () => {
    if (!isSupported || typeof navigator === "undefined" || !navigator.share) return;

    try {
      await navigator.share({ title, url, text: title });
      onShare?.("native", url);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Native share failed:", error);
      if (onError && error instanceof Error) {
        onError(error, "native");
      }
    }
  };

  const getButtonClass = (platform: Platform) => {
    const sizeCfg = SIZE_CONFIG[size];
    const base = [
      "flex items-center gap-2 rounded-full",
      "transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      sizeCfg.button,
      PLATFORM_CONFIG[platform].color,
      variant === "minimal" ? "bg-transparent" : "bg-gray-100",
      variant === "expanded" ? "px-4" : "",
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return base;
  };

  const renderShareButton = (platform: Platform) => {
    const config = PLATFORM_CONFIG[platform];

    if (platform === "copy") {
      return (
        <button
          key={platform}
          type="button"
          onClick={handleCopy}
          className={getButtonClass(platform)}
          aria-label={copied ? "Link copied!" : config.name}
          disabled={copied}
        >
          <span className={SIZE_CONFIG[size].icon}>
            {copied ? (
              <svg
                className="h-full w-full"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              config.icon
            )}
          </span>
          {(showLabels || variant === "expanded") && (
            <span className={SIZE_CONFIG[size].text}>
              {copied ? "Copied!" : config.name}
            </span>
          )}
        </button>
      );
    }

    const shareUrl = shareLinks[platform as SharePlatform];

    return (
      <a
        key={platform}
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onShare?.(platform, shareUrl)}
        className={getButtonClass(platform)}
        aria-label={`Share on ${config.name}`}
      >
        <span className={SIZE_CONFIG[size].icon}>{config.icon}</span>
        {(showLabels || variant === "expanded") && (
          <span className={SIZE_CONFIG[size].text}>{config.name}</span>
        )}
      </a>
    );
  };

  const visiblePlatforms: Platform[] = React.useMemo(() => {
    // If native share exists, we still keep copy button explicitly unless you want to hide it.
    return platforms;
  }, [platforms]);

  return (
    <div
      className={[
        "flex flex-wrap gap-2",
        variant === "expanded" ? "items-stretch" : "items-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="group"
      aria-label="Share options"
    >
      {/* Native Share Button (when supported) */}
      {isSupported && (
        <button
          type="button"
          onClick={handleNativeShare}
          className={[
            "flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white",
            "hover:from-purple-600 hover:to-pink-600",
            "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
            SIZE_CONFIG[size].button,
            variant === "expanded" ? "px-4" : "",
          ]
            .join(" ")
            .trim()}
          aria-label="Share using native share dialog"
        >
          <svg
            className={SIZE_CONFIG[size].icon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          {(showLabels || variant === "expanded") && (
            <span className={SIZE_CONFIG[size].text}>Share</span>
          )}
        </button>
      )}

      {/* Platform-specific buttons */}
      {visiblePlatforms.map((platform) => renderShareButton(platform))}

      {/* Accessibility announcement for copy status */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {copied && "Link copied to clipboard"}
      </div>
    </div>
  );
}

// Presets for convenient reuse
export const ShareButtonsPresets = {
  minimal: {
    variant: "minimal" as const,
    showLabels: false,
    size: "sm" as const,
  },
  standard: {
    variant: "standard" as const,
    showLabels: false,
    size: "md" as const,
  },
  expanded: {
    variant: "expanded" as const,
    showLabels: true,
    size: "md" as const,
  },
  socialOnly: {
    platforms: ["twitter", "linkedin", "facebook"] as Platform[],
  },
  allPlatforms: {
    platforms: ["twitter", "linkedin", "facebook", "email", "copy"] as Platform[],
  },
};

// Hook for custom share functionality
export function useShare() {
  const [isSupported, setIsSupported] = React.useState(false);

  React.useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setIsSupported(true);
    }
  }, []);

  const share = React.useCallback(
    async (data: { title: string; url: string; text?: string }) => {
      if (!isSupported || typeof navigator === "undefined" || !navigator.share) {
        return false;
      }
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Share failed:", error);
        }
        return false;
      }
    },
    [isSupported]
  );

  const copyToClipboard = React.useCallback(async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch (error) {
      console.error("Copy failed:", error);
      return false;
    }
  }, []);

  return {
    isSupported,
    share,
    copyToClipboard,
  };
}