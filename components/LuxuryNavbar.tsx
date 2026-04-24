/* components/LuxuryNavbar.tsx — BULLETPROOF & ATMOSPHERIC WITH ADMIN ACCESS */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  Menu, X, ArrowRight, Vault, Shield, Compass, Briefcase, 
  Terminal, Crown, LayoutDashboard, Brain, Activity, LogOut, User 
} from "lucide-react";
import { hasAccess, normalizeUserTier } from "@/lib/access/tier-policy";

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

const NAV = [
  { href: "/canon", label: "Canon" },
  { href: "/resources/strategic-frameworks", label: "Decision assets" },
  { href: "/library", label: "Library" },
  { href: "/ventures", label: "Ventures" },
  { href: "/shorts", label: "Shorts" },
  { href: "/about", label: "About" },
  { href: "/vault", label: "Vault" },
] as const;

export default function Navbar(): React.ReactElement {
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [showAdminMenu, setShowAdminMenu] = React.useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const asPath = mounted ? router.asPath : "/";
  
  const sessionUser = session?.user as { tier?: string; role?: string } | undefined;
  const userTier = normalizeUserTier(sessionUser?.tier ?? sessionUser?.role ?? "public");
  const isAdmin = hasAccess(userTier, "architect");
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  // Scroll Orchestration
  const { scrollY } = useScroll();
  const bgColor = useTransform(scrollY, [0, 100], ["rgba(0, 0, 0, 0)", "rgba(10, 10, 10, 0.95)"]);
  const borderColor = useTransform(scrollY, [0, 100], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.1)"]);
  const backdropBlur = useTransform(scrollY, [0, 100], ["blur(0px)", "blur(12px)"]);
  const logoSaturation = useTransform(scrollY, [0, 200], ["grayscale(0%)", "grayscale(100%)"]);

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    if (!mounted) return;
    setOpen(false);
    setShowAdminMenu(false);
  }, [asPath, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open, mounted]);

  const isActive = React.useCallback((href: string): boolean => {
    if (!mounted) return false;
    const currentPath = (asPath || "/").split("#")[0] || "/";
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  }, [asPath, mounted]);

  const handleLogout = async () => {
    await signOut({ redirect: false, callbackUrl: "/" });
    window.location.href = "/";
  };

  // SSR Skeleton
  if (!mounted) {
    return (
      <header className="fixed inset-x-0 top-0 z-[100] h-20 bg-transparent border-b border-transparent" />
    );
  }

  return (
    <>
      <motion.header
        style={{ backgroundColor: bgColor, borderColor, backdropFilter: backdropBlur }}
        className="fixed inset-x-0 top-0 z-[100] border-b transition-colors duration-500"
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          
          {/* Brand with Desaturating Logo */}
          <Link href="/" className="group flex min-w-0 flex-col pr-2">
            <motion.div style={{ filter: logoSaturation }} className="flex flex-col">
              <span className="truncate font-serif text-xl font-semibold tracking-tight text-amber-100 sm:text-2xl transition-colors group-hover:text-white">
                Abraham<span className="text-amber-300 italic font-light"> of London</span>
              </span>
              <span className="mt-1 hidden sm:block truncate text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                Institutional Platform
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden min-w-0 flex-1 items-center lg:flex">
            <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ul className="flex items-center gap-8 whitespace-nowrap pr-6">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cx(
                        "text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300",
                        isActive(item.href) 
                          ? "text-amber-300" 
                          : "text-zinc-400 hover:text-white hover:tracking-[0.3em]"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Admin Section - Desktop */}
            {!isLoading && isAdmin && (
              <div className="relative mr-4">
                <button
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className="flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[9px] font-mono uppercase tracking-wider text-amber-400 transition-all hover:bg-amber-500/20"
                >
                  <Terminal className="h-3 w-3" />
                  Command
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showAdminMenu && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-sm border border-white/10 bg-black/95 backdrop-blur-xl py-2 shadow-2xl z-50">
                    <Link
                      href="/admin/authority-center"
                      className="flex items-center gap-3 px-4 py-2 text-xs text-amber-400/70 hover:text-amber-400 hover:bg-white/5 transition-colors"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Authority Center
                    </Link>
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Dashboard
                    </Link>
                    <Link
                      href="/admin/intelligence"
                      className="flex items-center gap-3 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      <Brain className="h-3.5 w-3.5" />
                      Intelligence Center
                    </Link>
                    <Link
                      href="/admin/command-wall"
                      className="flex items-center gap-3 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      <Activity className="h-3.5 w-3.5" />
                      Command Wall
                    </Link>
                    <div className="my-1 border-t border-white/10" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2 text-xs text-red-400/60 hover:text-red-400 hover:bg-white/5 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Exit Terminal
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* User Status Indicator */}
            {!isLoading && isAuthenticated && !isAdmin && (
              <div className="mr-4 flex items-center gap-2 rounded border border-white/10 px-3 py-2">
                <User className="h-3 w-3 text-white/40" />
                <span className="text-[8px] font-mono uppercase tracking-wider text-white/40">
                  {session?.user?.email?.split("@")[0]}
                </span>
              </div>
            )}

            {/* Inquiries CTA */}
            <Link
              href="/consulting"
              className="shrink-0 inline-flex items-center gap-3 bg-white/[0.03] border border-white/10 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 transition-all hover:bg-amber-500 hover:text-black hover:border-amber-500"
            >
              <Briefcase className="h-3.5 w-3.5" />
              Inquiries
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>

          {/* Mobile Toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-auto inline-flex h-11 w-11 items-center justify-center border border-white/10 bg-white/5 text-amber-200 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] lg:hidden"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setOpen(false)} />
            
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-[85vw] max-w-sm border-l border-white/10 bg-zinc-950 p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="font-serif text-lg italic text-amber-100">Archive Menu</span>
                <button onClick={() => setOpen(false)} className="text-zinc-500"><X size={24} /></button>
              </div>

              <div className="flex-1 space-y-4">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "block border-b border-white/5 py-4 text-[11px] font-black uppercase tracking-[0.3em]",
                      isActive(item.href) ? "text-amber-400" : "text-zinc-400"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Admin Section - Mobile */}
              {!isLoading && isAdmin && (
                <div className="pt-6 mt-6 border-t border-white/10">
                  <p className="mb-3 text-[8px] font-mono uppercase tracking-wider text-amber-500/60">
                    Command Terminal
                  </p>
                  <Link
                    href="/admin"
                    className="flex items-center justify-between py-3 text-sm text-white/60 hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <LayoutDashboard size={16} />
                      Dashboard
                    </span>
                    <ArrowRight size={12} />
                  </Link>
                  <Link
                    href="/admin/intelligence"
                    className="flex items-center justify-between py-3 text-sm text-white/60 hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <Brain size={16} />
                      Intelligence Center
                    </span>
                    <ArrowRight size={12} />
                  </Link>
                  <Link
                    href="/admin/command-wall"
                    className="flex items-center justify-between py-3 text-sm text-white/60 hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <Activity size={16} />
                      Command Wall
                    </span>
                    <ArrowRight size={12} />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mt-4 w-full flex items-center justify-center gap-3 rounded border border-red-500/20 bg-red-500/5 py-3 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Exit Terminal
                  </button>
                </div>
              )}

              <div className="pt-8 mt-auto border-t border-white/10">
                <Link
                  href="/vault"
                  className="flex items-center justify-between p-4 bg-amber-500/5 border border-amber-500/20 text-amber-200 text-[10px] font-black uppercase tracking-widest mb-4"
                  onClick={() => setOpen(false)}
                >
                  <span className="flex items-center gap-3"><Vault size={16}/> Secure Vault</span>
                  <Shield size={16}/>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
