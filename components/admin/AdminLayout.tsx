/* components/admin/AdminLayout.tsx — INSTITUTIONAL ADMIN COMMAND SURFACE */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import {
  Crown,
  LogOut,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ADMIN_NAVIGATION } from "@/lib/admin/admin-navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

function NavSection({
  section,
  collapsed,
  currentPath,
}: {
  section: (typeof ADMIN_NAVIGATION)[number];
  collapsed: boolean;
  currentPath: string;
}) {
  const hasActive = section.items.some(
    (item) => currentPath === item.href || currentPath.startsWith(item.href + "/"),
  );
  const [open, setOpen] = React.useState(hasActive || section.id === "command");

  if (collapsed) {
    const first = section.items[0];
    if (!first) return null;
    return (
      <Link
        href={first.href}
        className={`flex items-center justify-center rounded px-2 py-2.5 transition-colors ${
          hasActive
            ? "bg-amber-500/15 text-amber-400"
            : "text-white/45 hover:text-white/70 hover:bg-white/5"
        }`}
        title={section.label}
      >
        <span className="text-[10px] font-mono font-medium">{section.label.charAt(0)}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded px-2 py-2 text-left transition-colors hover:bg-white/5"
      >
        <span
          className={`text-[10px] font-mono uppercase tracking-[0.2em] font-medium ${
            hasActive ? "text-amber-400/90" : "text-white/50"
          }`}
        >
          {section.label}
        </span>
        {open ? (
          <ChevronDown className={`h-3 w-3 ${hasActive ? "text-amber-400/50" : "text-white/30"}`} />
        ) : (
          <ChevronRight className={`h-3 w-3 ${hasActive ? "text-amber-400/50" : "text-white/25"}`} />
        )}
      </button>

      {open && (
        <div className="mt-1 space-y-px pl-1">
          {section.items.map((item) => {
            const isActive =
              currentPath === item.href || currentPath.startsWith(item.href + "/");
            const isStub =
              item.status === "stub" ||
              item.status === "rough" ||
              item.status === "broken" ||
              item.status === "deprecated";

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-2 rounded py-2 pl-3 pr-2 text-[13px] transition-colors ${
                  isActive
                    ? "border-l-2 border-amber-500/70 bg-amber-500/8 text-white font-medium pl-2.5"
                    : isStub
                    ? "text-white/35 hover:text-white/55 hover:bg-white/5"
                    : "text-white/70 hover:text-white/95 hover:bg-white/5"
                }`}
              >
                <span className="truncate">{item.label}</span>
                {item.status === "stub" && (
                  <span className="ml-auto shrink-0 rounded bg-white/5 px-1 py-0.5 text-[7px] font-mono text-white/20">
                    stub
                  </span>
                )}
                {item.status === "rough" && (
                  <span className="ml-auto shrink-0 rounded bg-amber-950/40 px-1 py-0.5 text-[7px] font-mono text-amber-500/40">
                    rough
                  </span>
                )}
                {item.status === "broken" && (
                  <span className="ml-auto shrink-0 rounded bg-red-950/40 px-1 py-0.5 text-[7px] font-mono text-red-500/55">
                    broken
                  </span>
                )}
                {item.status === "deprecated" && (
                  <span className="ml-auto shrink-0 rounded bg-white/5 px-1 py-0.5 text-[7px] font-mono text-white/20">
                    old
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = React.useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-black">
      {/* ── Fixed header ── */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="font-serif text-base tracking-tight text-white/90">
                Abraham of London
              </span>
              <span className="ml-1.5 rounded border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-amber-400/90">
                Admin
              </span>
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-white/45 hover:text-white/70 transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
              Exit
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-mono text-white/50">{session?.user?.email}</p>
              <p className="text-[9px] font-mono text-amber-500/60 uppercase tracking-wider">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded border border-white/15 px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider text-white/65 transition-colors hover:border-white/30 hover:text-white"
            >
              <LogOut className="h-3 w-3" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        {/* ── Sidebar ── */}
        <aside
          className={`fixed bottom-0 left-0 top-14 z-30 border-r border-white/10 bg-black/80 backdrop-blur-sm transition-all duration-200 ${
            collapsed ? "w-14" : "w-60"
          }`}
        >
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-5 flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-zinc-900 text-white/50 hover:text-white transition-colors z-10"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="text-[10px]">{collapsed ? "→" : "←"}</span>
          </button>

          {/* Nav content */}
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
              {!collapsed && (
                <p className="mb-3 px-2 text-[9px] font-mono uppercase tracking-[0.3em] text-white/25">
                  Command Surface
                </p>
              )}
              <nav className="space-y-2">
                {ADMIN_NAVIGATION.map((section) => (
                  <NavSection
                    key={section.id}
                    section={section}
                    collapsed={collapsed}
                    currentPath={router.pathname}
                  />
                ))}
              </nav>
            </div>

            {/* System status footer */}
            {!collapsed && (
              <div className="border-t border-white/8 px-3 py-3">
                <div className="rounded border border-white/10 bg-white/[0.04] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/55">
                      System operational
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10px] font-mono text-white/35">AES-256-GCM · Encrypted</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main
          className={`flex-1 min-w-0 transition-all duration-200 ${collapsed ? "ml-14" : "ml-60"}`}
        >
          {title && (
            <div className="sticky top-14 z-20 border-b border-white/10 bg-black/80 backdrop-blur-sm px-6 py-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">
                {router.pathname.split("/").filter(Boolean).join(" › ")}
              </p>
              <h1 className="mt-0.5 font-serif text-xl text-white/90">{title}</h1>
            </div>
          )}
          <div className="p-6 pb-24">{children}</div>
        </main>
      </div>
    </div>
  );
}
