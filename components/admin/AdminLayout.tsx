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
  const hasActive = section.items.some((item) => currentPath === item.href || currentPath.startsWith(item.href + "/"));
  const [open, setOpen] = React.useState(hasActive || section.id === "command");

  if (collapsed) {
    // Show only first item icon in collapsed mode
    const first = section.items[0];
    if (!first) return null;
    return (
      <Link
        href={first.href}
        className={`flex items-center justify-center rounded px-2 py-2 transition-colors ${
          hasActive ? "bg-amber-500/10 text-amber-400" : "text-white/30 hover:text-white/60 hover:bg-white/5"
        }`}
        title={section.label}
      >
        <span className="text-[9px] font-mono">{section.label.charAt(0)}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded px-3 py-1.5 text-left transition-colors hover:bg-white/5"
      >
        <span className={`text-[9px] font-mono uppercase tracking-[0.18em] ${hasActive ? "text-amber-500/70" : "text-white/25"}`}>
          {section.label}
        </span>
        {open ? (
          <ChevronDown className="h-3 w-3 text-white/20" />
        ) : (
          <ChevronRight className="h-3 w-3 text-white/15" />
        )}
      </button>
      {open && (
        <div className="mt-0.5 space-y-px pl-2">
          {section.items.map((item) => {
            const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/");
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs transition-colors ${
                  isActive
                    ? "bg-amber-500/10 text-amber-400"
                    : item.status === "stub" || item.status === "rough"
                      ? "text-white/20 hover:text-white/40 hover:bg-white/5"
                      : "text-white/45 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <span>{item.label}</span>
                {item.status === "stub" && (
                  <span className="rounded bg-white/5 px-1 py-0.5 text-[7px] font-mono text-white/15">stub</span>
                )}
                {item.status === "rough" && (
                  <span className="rounded bg-white/5 px-1 py-0.5 text-[7px] font-mono text-white/15">rough</span>
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
        {/* Admin Header */}
        <div className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="font-serif text-lg tracking-tight text-white">
                  Abraham of London
                </span>
                <span className="ml-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-amber-400">
                  Admin
                </span>
              </Link>
              <div className="h-4 w-px bg-white/10" />
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
                Exit Terminal
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-mono text-white/40">
                  {session?.user?.email}
                </p>
                <p className="text-[8px] font-mono text-amber-500/60">
                  Administrator
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded border border-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-white/60 transition-colors hover:border-white/20 hover:text-white"
              >
                <LogOut className="h-3 w-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="flex pt-16">
          {/* Sidebar Navigation */}
          <aside
            className={`fixed bottom-0 left-0 top-16 border-r border-white/10 bg-black/50 backdrop-blur-sm transition-all duration-300 ${
              collapsed ? "w-16" : "w-64"
            }`}
          >
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black text-white/40 hover:text-white transition-colors"
            >
              {collapsed ? "→" : "←"}
            </button>

            <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 10rem)" }}>
              {!collapsed && (
                <div className="mb-4 px-3">
                  <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/20">
                    Institutional Command
                  </p>
                </div>
              )}
              <nav className="space-y-3">
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

            {/* System Status */}
            {!collapsed && (
              <div className="absolute bottom-6 left-4 right-4">
                <div className="rounded border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-mono uppercase tracking-wider text-white/40">
                      System Operational
                    </span>
                  </div>
                  <p className="mt-2 text-[8px] font-mono text-white/20">
                    AES-256-GCM Encrypted
                  </p>
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className={`flex-1 transition-all duration-300 ${collapsed ? "ml-16" : "ml-64"}`}>
            {title && (
              <div className="border-b border-white/10 bg-white/5 px-8 py-4">
                <h1 className="font-serif text-2xl text-white">{title}</h1>
              </div>
            )}
            <div className="p-8">{children}</div>
          </main>
        </div>
      </div>
  );
}
