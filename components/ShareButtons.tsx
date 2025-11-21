"use client";

import * as React from "react";

type Platform = "twitter" | "linkedin" | "facebook" | "email" | "copy" | "whatsapp";

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

// Platform configurations with brand colors
const PLATFORM_CONFIG: Record<
  Platform,
  {
    name: string;
    color: string;
    icon: JSX.Element;
    ariaLabel: string;
  }
> = {
  twitter: {
    name: "Twitter",
    color: "hover:bg-blue-500/10 hover:text-blue-500 focus:ring-blue-500/50",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
    ariaLabel: "Share on Twitter"
  },
  linkedin: {
    name: "LinkedIn",
    color: "hover:bg-blue-600/10 hover:text-blue-600 focus:ring-blue-600/50",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.7 3H4.3A1.3 1.3 0 003 4.3v15.4A1.3 1.3 0 004.3 21h15.4a1.3 1.3 0 001.3-1.3V4.3A1.3 1.3 0 0019.7 3zM8.339 18.338H5.667v-8.59h2.672v8.59zM7.004 8.574a1.548 1.548 0 11-.002-3.096 1.548 1.548 0 01.002 3.096zm11.335 9.764H15.67v-4.177c0-.996-.017-2.278-1.387-2.278-1.389 0-1.601 1.086-1.601 2.206v4.25h-2.667v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.779 3.203 4.092v4.71z" />
      </svg>
    ),
    ariaLabel: "Share on LinkedIn"
  },
  facebook: {
    name: "Facebook",
    color: "hover:bg-blue-800/10 hover:text-blue-800 focus:ring-blue-800/50",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    ariaLabel: "Share on Facebook"
  },
  whatsapp: {
    name: "WhatsApp",
    color: "hover:bg-green-500/10 hover:text-green-500 focus:ring-green-500/50",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.18-1.24-6.17-3.495-8.418" />
      </svg>
    ),
    ariaLabel: "Share on WhatsApp"
  },
  email: {
    name: "Email",
    color: "hover:bg-gray-500/10 hover:text-gray-600 focus:ring-gray-500/50",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    ariaLabel: "Share via Email"
  },
  copy: {
    name: "Copy Link",
    color: "hover:bg-green-600/10 hover:text-green-600 focus:ring-green-600/50",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    ariaLabel: "Copy link to clipboard"
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
  platforms = ["twitter", "linkedin", "facebook", "whatsapp", "email", "copy"],
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
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, [url]);

  const visiblePlatforms: Platform[] = React.useMemo(() => {
    return platforms;
  }, [platforms]);

  // Early return after all hooks have been called
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
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
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
      "flex items-center gap-2 rounded-full border border-gold/20",
      "transition-all duration-200 bg-charcoal/40 backdrop-blur-sm",
      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-charcoal",
      "disabled:cursor-not-allowed disabled:opacity-50",
      sizeCfg.button,
      PLATFORM_CONFIG[platform].color,
      variant === "minimal" ? "bg-transparent border-none" : "",
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
          aria-label={copied ? "Link copied!" : config.ariaLabel}
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
            <span className={`${SIZE_CONFIG[size].text} text-cream/80`}>
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
        aria-label={config.ariaLabel}
      >
        <span className={SIZE_CONFIG[size].icon}>{config.icon}</span>
        {(showLabels || variant === "expanded") && (
          <span className={`${SIZE_CONFIG[size].text} text-cream/80`}>{config.name}</span>
        )}
      </a>
    );
  };

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
            "flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-amber-200 text-charcoal",
            "hover:from-amber-200 hover:to-gold font-semibold",
            "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-charcoal",
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
    platforms: ["twitter", "linkedin", "facebook", "whatsapp"] as Platform[],
  },
  allPlatforms: {
    platforms: ["twitter", "linkedin", "facebook", "whatsapp", "email", "copy"] as Platform[],
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