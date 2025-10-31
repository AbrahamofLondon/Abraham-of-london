import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { useRouter } from "next/router"; // 💡 UPGRADE: Import useRouter for auto-closing the mobile menu

const ThemeToggle = dynamic(() => import("@/components/ThemeToggle"), { ssr: false });

export default function Header() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter(); // Initialize router

  // 💡 CRITICAL FIX: Automatically close the mobile menu on route change
  React.useEffect(() => {
    const handleRouteChange = () => setOpen(false);
    
    // Listen for route changes to automatically close the menu
    router.events.on("routeChangeComplete", handleRouteChange);
    
    // Cleanup the event listener
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  const toggleMenu = React.useCallback(() => {
    setOpen((v) => !v);
  }, []);

  return (
    <header className="sticky top-0 z-[60] bg-white/85 dark:bg-[color:var(--color-secondary)]/85 backdrop-blur border-b border-lightGrey">
      <div className="mx-auto max-w-7xl h-14 px-4 flex items-center justify-between">
        {/* Brand */}
        <Link 
          href="/" 
          className="font-serif text-xl font-semibold text-deepCharcoal dark:text-[var(--color-on-secondary)]" 
          prefetch={false}
        >
          Abraham of London
        </Link>

        {/* Desktop nav */}
        {/* 💡 IMPROVEMENT: Use Array.map for desktop nav too to avoid duplication and ensure consistency */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-[color:var(--color-on-secondary)]/80">
          {[
            ["/blog", "Blog"],
            ["/books", "Books"],
            ["/events", "Events"],
            ["/downloads", "Downloads"],
            ["/about", "About"],
            ["/contact", "Contact"],
          ].map(([href, label]) => (
            <Link 
              key={href}
              href={href} 
              prefetch={false} 
              className={clsx(
                "hover:text-deepCharcoal transition-colors", 
                router.pathname.startsWith(href) && "text-deepCharcoal font-medium" // 💡 UPGRADE: Highlight active link
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* 💡 NOTE: ThemeToggle is intentionally outside the mobile menu to always be accessible */}
          <div className="hidden md:block"> 
             <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-lightGrey text-[color:var(--color-on-secondary)]/80"
            aria-label={open ? "Close menu" : "Open menu"}
            // 💡 CRITICAL FIX: Add accessibility attributes
            aria-expanded={open}
            onClick={toggleMenu}
          >
            {/* 💡 IMPROVEMENT: Use the `clsx` utility for cleaner conditional class merging (assuming i-heroicons-bars-3 is an icon class) */}
            <svg 
              className={clsx("w-6 h-6", open ? "hidden" : "block")} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24"
              fill="currentColor"
            >
                <path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 17.25Z" clipRule="evenodd" />
            </svg>
            <svg 
              className={clsx("w-6 h-6", !open ? "hidden" : "block")} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24"
              fill="currentColor"
            >
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {/* 💡 CRITICAL FIX: Added `aria-modal` and `role="dialog"` for better accessibility */}
      {open && (
        <div 
          className="md:hidden border-t border-lightGrey bg-white dark:bg-[color:var(--color-secondary)]"
          aria-modal="true"
          role="dialog"
        >
          <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-2 text-sm">
            {[
              ["/blog", "Blog"],
              ["/books", "Books"],
              ["/events", "Events"],
              ["/downloads", "Downloads"],
              ["/about", "About"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={clsx(
                  "py-2 text-[color:var(--color-on-secondary)]/85 hover:text-deepCharcoal transition-colors",
                  router.pathname.startsWith(href) && "text-deepCharcoal font-medium" // 💡 UPGRADE: Highlight active link
                )}
                // 💡 NOTE: onClick is now redundant due to the useEffect auto-closing, but harmless.
              >
                {label}
              </Link>
            ))}
            {/* 💡 UPGRADE: Add ThemeToggle to the mobile menu for convenience */}
            <div className="py-2 mt-2 border-t border-lightGrey/50">
               <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}