// components/homepage/StatsBar.tsx
import React from "react";

interface StatsBarProps {
  stats: {
    articles?: number;
    readers?: number;
    experience?: number;
    clientFocus?: number;
    downloads?: number;
    resources?: number;
  };
  health?: {
    status: "healthy" | "degraded" | "unhealthy";
    message?: string;
  };
  className?: string;
}

interface StatItem {
  label: string;
  value: number | string;
  suffix?: string;
  description: string;
  icon: React.ReactNode;
}

// Memoized SVG icons to prevent re-renders
const ArticleIcon = React.memo(() => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v12m0 0h6m-6 0h6"
    />
  </svg>
));

ArticleIcon.displayName = "ArticleIcon";

const ReadersIcon = React.memo(() => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
));

ReadersIcon.displayName = "ReadersIcon";

const ExperienceIcon = React.memo(() => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
));

ExperienceIcon.displayName = "ExperienceIcon";

const ClientFocusIcon = React.memo(() => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
));

ClientFocusIcon.displayName = "ClientFocusIcon";

const ResourcesIcon = React.memo(() => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
    />
  </svg>
));

ResourcesIcon.displayName = "ResourcesIcon";

function StatsBarComponent({ stats, health, className = "" }: StatsBarProps) {
  const statItems: StatItem[] = React.useMemo(
    () => [
      {
        label: "Articles",
        value: stats.articles || 0,
        description: "Published Insights",
        icon: <ArticleIcon />,
      },
      {
        label: "Readers",
        value: stats.readers || 0,
        suffix: "+",
        description: "Global Audience",
        icon: <ReadersIcon />,
      },
      {
        label: "Experience",
        value: stats.experience || 0,
        suffix: "+ years",
        description: "Strategic Leadership",
        icon: <ExperienceIcon />,
      },
      {
        label: "Client Focus",
        value: stats.clientFocus || 0,
        suffix: "%",
        description: "Dedicated Partnership",
        icon: <ClientFocusIcon />,
      },
      {
        label: "Resources",
        value: stats.resources || stats.downloads || 0,
        description: "Curated Downloads",
        icon: <ResourcesIcon />,
      },
    ],
    [stats]
  );

  const formatNumber = React.useCallback((num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  }, []);

  const getHealthColor = React.useCallback((status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-500";
      case "degraded":
        return "text-amber-500";
      case "unhealthy":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  }, []);

  const progressWidth = React.useMemo(() => {
    switch (health?.status) {
      case "healthy":
        return "100%";
      case "degraded":
        return "75%";
      case "unhealthy":
        return "50%";
      default:
        return "100%";
    }
  }, [health?.status]);

  return (
    <section
      className={`bg-deepCharcoal text-cream py-8 lg:py-12 ${className}`}
      aria-label="Performance Metrics"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Health Status Indicator */}
        {health && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full text-sm">
              <div
                className={`w-2 h-2 rounded-full ${getHealthColor(health.status)}`}
              ></div>
              <span className="text-cream/80">
                System Status:{" "}
                <span className="capitalize font-medium">{health.status}</span>
                {health.message && ` • ${health.message}`}
              </span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {statItems.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center group"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="flex flex-col items-center">
                {/* Icon */}
                <div className="w-12 h-12 bg-forest/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-forest/30 transition-colors duration-300">
                  <div className="text-forest">{stat.icon}</div>
                </div>

                {/* Value */}
                <div className="mb-1">
                  <span className="text-2xl lg:text-3xl font-bold text-cream block">
                    {formatNumber(
                      typeof stat.value === "number"
                        ? stat.value
                        : parseInt(stat.value as string)
                    )}
                    {stat.suffix}
                  </span>
                </div>

                {/* Label */}
                <div className="text-cream/90 font-medium text-sm mb-1">
                  {stat.label}
                </div>

                {/* Description */}
                <div className="text-cream/70 text-xs">{stat.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-8 pt-6 border-t border-forest/30">
          <div className="flex items-center justify-between text-sm text-cream/70 mb-2">
            <span>Platform Performance</span>
            <span>Optimal</span>
          </div>
          <div className="w-full bg-forest/20 rounded-full h-2">
            <div
              className="bg-forest h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: progressWidth }}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Single export to fix the duplicate export error
export default StatsBarComponent;
