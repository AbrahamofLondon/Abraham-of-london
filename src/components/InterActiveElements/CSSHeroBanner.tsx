// src/components/InterActiveElements/CSSHeroBanner.tsx
import React from "react";
import { useWebSocketStatus } from "@/lib/websocket-service";

export interface CSSHeroBannerProps {
  title: string;
  subtitle?: string;
  height?: string;
  textAlign?: "left" | "center" | "right";
  ctaText?: string;
  ctaOnClick?: () => void;
  showConnectionStatus?: boolean;
  eyebrow?: string;
  children?: React.ReactNode;
  gradient?: string;
}

const CSSHeroBanner: React.FC<CSSHeroBannerProps> = ({
  title,
  subtitle,
  height = "70vh",
  textAlign = "center",
  ctaText,
  ctaOnClick,
  showConnectionStatus = false,
  eyebrow,
  children,
  gradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
}) => {
  const connected = useWebSocketStatus();

  const bannerStyle: React.CSSProperties = {
    background: gradient,
    height,
  };

  const alignClass = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[textAlign];

  return (
    <section
      className="hero-banner relative overflow-hidden"
      style={bannerStyle}
      aria-label={title}
    >
      {/* Content */}
      <div className="hero-content relative z-10 flex h-full w-full px-6 py-10 sm:px-10 lg:px-16">
        <div
          className={[
            "flex w-full flex-col gap-4 justify-center",
            alignClass,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {/* Optional eyebrow + connection status row */}
          {(eyebrow || showConnectionStatus) && (
            <div className="mb-1 flex flex-wrap items-center gap-3">
              {eyebrow && (
                <span className="inline-flex items-center rounded-full bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  {eyebrow}
                </span>
              )}

              {showConnectionStatus && (
                <span
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-medium tracking-wide",
                    connected
                      ? "bg-emerald-500/80 text-white"
                      : "bg-red-500/80 text-white",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-live="polite"
                >
                  <span
                    className={[
                      "mr-2 inline-block h-2.5 w-2.5 rounded-full",
                      connected ? "bg-lime-200" : "bg-zinc-100",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  {connected ? "Live connection" : "Offline / reconnecting"}
                </span>
              )}
            </div>
          )}

          <h1 className="hero-title text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>

          {subtitle && (
            <p className="hero-subtitle max-w-2xl text-sm text-gray-100 sm:text-base lg:text-lg">
              {subtitle}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {ctaText && (
              <button
                type="button"
                className="hero-cta rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-md transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
                onClick={ctaOnClick}
              >
                {ctaText}
              </button>
            )}

            {children && (
              <div className="mt-2 w-full text-xs text-gray-100 sm:text-sm">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CSSHeroBanner;