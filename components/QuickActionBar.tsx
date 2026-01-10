// components/QuickActionBar.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import clsx from "clsx";

interface QuickActionBarProps {
  variant?: "light" | "dark";
  className?: string;
}

export default function QuickActionBar({
  variant = "light",
  className,
}: QuickActionBarProps) {
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(path + "/");
  };

  const baseClasses =
    "bg-warmWhite/90 backdrop-blur-lg border-b border-lightGrey/50 transition-all duration-300 sticky top-0 z-40";
  const variantClasses = {
    light: "bg-warmWhite/90 text-deepCharcoal shadow-sm",
    dark: "bg-deepCharcoal/90 text-cream border-cream/20 shadow-lg",
  };

  const linkClasses = (active: boolean) =>
    clsx(
      "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2",
      variant === "light"
        ? active
          ? "bg-gradient-to-r from-forest to-forest/90 text-cream shadow-lg transform scale-105"
          : "text-deepCharcoal/80 hover:text-forest hover:bg-white/80 hover:shadow-md hover:transform hover:scale-105"
        : active
          ? "bg-gradient-to-r from-cream to-cream/90 text-deepCharcoal shadow-lg transform scale-105"
          : "text-cream/80 hover:text-cream hover:bg-cream/10 hover:shadow-md hover:transform hover:scale-105"
    );

  const quickLinks = [
    { href: "/books", label: "Books", icon: "📚", badge: null },
    { href: "/blog", label: "Insights", icon: "💭", badge: "New" },
    { href: "/events", label: "Events", icon: "📅", badge: "Live" },
    { href: "/downloads", label: "Resources", icon: "📥", badge: "Free" },
    { href: "/consulting", label: "Consulting", icon: "🎯", badge: null },
  ];

  return (
    <div className={clsx(baseClasses, variantClasses[variant], className)}>
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span
              className={clsx(
                "font-medium px-3 py-1 rounded-full border",
                variant === "light"
                  ? "text-deepCharcoal/60 border-deepCharcoal/20 bg-white/50"
                  : "text-cream/60 border-cream/20 bg-cream/5"
              )}
            >
              Quick Access
            </span>
          </div>
          <nav className="flex items-center gap-2">
            {quickLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={linkClasses(active)}
                  prefetch={false}
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                  {link.badge && (
                    <span
                      className={clsx(
                        "text-xs px-1.5 py-0.5 rounded-full font-bold",
                        variant === "light"
                          ? "bg-forest/20 text-forest"
                          : "bg-cream/20 text-cream"
                      )}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

