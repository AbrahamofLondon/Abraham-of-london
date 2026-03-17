/* components/Header.tsx — route-safe, App Router + Pages Router compatible */
import * as React from "react";
import Link from "next/link";
import { Menu, X, Command, ChevronRight } from "lucide-react";

type HeaderProps = {
  transparent?: boolean;
  minimal?: boolean;
};

const NAV_ITEMS = [
  { href: "/canon", label: "Canon", sub: "Doctrine & Method" },
  { href: "/books", label: "Books", sub: "Long-form Works" },
  { href: "/blog", label: "Essays", sub: "Ideas & Commentary" },
  { href: "/library", label: "Library", sub: "Knowledge Shelf" }, // restored original Library
  { href: "/artifacts", label: "Artifacts", sub: "Premium Editions" }, // new premium shelf
  { href: "/vault/briefs", label: "Briefs", sub: "Operational Intelligence" },
  { href: "/ventures", label: "Ventures", sub: "Execution Arms" },
  { href: "/shorts", label: "Shorts", sub: "Short-form Signal" },
  { href: "/vault", label: "Vault", sub: "Secure Repository" },
];

function normalizePath(path: string): string {
  if (!path) return "/";
  const base = path.split(/[?#]/)[0] ?? "";
  const clean = base.replace(/\/+$/, "");
  return clean || "/";
}

function isActivePath(currentPath: string, href: string): boolean {
  const current = normalizePath(currentPath);
  const target = normalizePath(href);

  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}

export default function Header({
  transparent = false,
  minimal = false,
}: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);
  const [currentPath, setCurrentPath] = React.useState("/");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const updatePath = () => {
      setCurrentPath(normalizePath(window.location.pathname));
      setIsReady(true);
    };

    updatePath();

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const patchedPushState: History["pushState"] = function (...args) {
      originalPushState.apply(window.history, args);
      updatePath();
    };

    const patchedReplaceState: History["replaceState"] = function (...args) {
      originalReplaceState.apply(window.history, args);
      updatePath();
    };

    window.history.pushState = patchedPushState;
    window.history.replaceState = patchedReplaceState;

    window.addEventListener("popstate", updatePath);
    window.addEventListener("hashchange", updatePath);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", updatePath);
      window.removeEventListener("hashchange", updatePath);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (!isReady) return;
    setIsOpen(false);
  }, [currentPath, isReady]);

  const shellClass =
    scrolled || isOpen || !transparent
      ? "border-b border-white/10 bg-black/86 py-4 backdrop-blur-xl"
      : "bg-transparent py-5";

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-[100] w-full transition-all duration-500 ${shellClass}`}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 lg:px-12">
          <Link href="/" className="group flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center border border-white/10 bg-white shadow-[0_10px_30px_rgba(255,255,255,0.08)]">
              <Command size={22} className="text-black" />
            </div>

            <div className="flex flex-col">
              <span className="text-[12px] font-black uppercase tracking-[0.34em] text-white">
                Abraham of London
              </span>
              <span className="hidden text-[9px] font-mono uppercase tracking-[0.24em] text-white/36 md:block">
                Strategy • Canon • Library
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 md:gap-6">
            {!minimal && isReady ? (
              <div className="hidden items-center gap-6 md:flex">
                {NAV_ITEMS.slice(0, 8).map((item) => {
                  const active = isActivePath(currentPath, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "text-[10px] font-mono uppercase tracking-[0.22em] transition-colors",
                        active
                          ? "text-amber-400"
                          : "text-white/62 hover:text-white",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}

            <Link
              href="/artifacts"
              className="hidden rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[9px] font-mono uppercase tracking-[0.24em] text-amber-300/90 transition-all hover:border-amber-400/35 hover:bg-amber-500/15 hover:text-amber-200 md:inline-flex"
            >
              Artifacts
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="border border-white/12 bg-white/[0.04] p-3 text-white transition-all hover:bg-white hover:text-black"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={[
          "fixed inset-0 z-[110] bg-black/98 transition-all duration-500 ease-out",
          isOpen
            ? "pointer-events-auto visible opacity-100"
            : "pointer-events-none invisible opacity-0",
        ].join(" ")}
        aria-hidden={!isOpen}
      >
        <div className="flex h-full flex-col overflow-y-auto p-8 md:p-10">
          <div className="mb-12 flex items-center justify-between md:mb-16">
            <div className="text-[11px] font-mono uppercase tracking-[0.42em] text-white/40">
              Directory
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="border border-white/10 p-4 text-white transition-colors hover:bg-white hover:text-black"
              aria-label="Close menu"
            >
              <X size={28} />
            </button>
          </div>

          <div className="flex flex-col gap-5 md:gap-6">
            {NAV_ITEMS.map((item, idx) => {
              const active = isReady ? isActivePath(currentPath, item.href) : false;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="group flex items-end justify-between border-b border-white/5 pb-5 md:pb-6"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-amber-500/60">
                      INDEX_{String(idx + 1).padStart(2, "0")}
                    </span>

                    <h2
                      className={[
                        "font-serif text-3xl uppercase italic transition-colors md:text-4xl",
                        active
                          ? "text-amber-400"
                          : "text-white group-hover:text-amber-500",
                      ].join(" ")}
                    >
                      {item.label}
                    </h2>

                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                      {item.sub}
                    </p>
                  </div>

                  <ChevronRight
                    size={24}
                    className={[
                      "mb-4 transition-all",
                      active
                        ? "text-amber-400"
                        : "text-white/10 group-hover:text-amber-500",
                    ].join(" ")}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}