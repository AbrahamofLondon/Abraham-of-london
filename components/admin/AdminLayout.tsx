/* components/admin/AdminLayout.tsx — PROFESSIONAL ADMIN INTERFACE */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Brain,
  Terminal,
  FileText,
  Shield,
  Crown,
  LogOut,
  Activity,
  ChevronLeft,
  Key,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Pipeline overview",
  },
  {
    href: "/admin/intelligence",
    label: "Intelligence",
    icon: Brain,
    description: "Deal flow & audit",
  },
  {
    href: "/admin/command-wall",
    label: "Command Wall",
    icon: Terminal,
    description: "System controls",
  },
  {
    href: "/admin/pdf-dashboard",
    label: "PDF Analytics",
    icon: FileText,
    description: "Document metrics",
  },
  {
    href: "/admin/access-revoke",
    label: "Access Control",
    icon: Shield,
    description: "User permissions",
  },
  {
    href: "/admin/access-keys",
    label: "Access Keys",
    icon: Key,
    description: "Issue & manage keys",
  },
  {
    href: "/admin/validation",
    label: "Validation",
    icon: Activity,
    description: "Launch readiness",
  },
];

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

            <div className="p-4">
              <div className={`mb-6 px-3 ${collapsed ? "hidden" : "block"}`}>
                <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/20">
                  Command Center
                </p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = router.pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded px-3 py-2 transition-colors ${
                        isActive
                          ? "bg-amber-500/10 text-amber-400"
                          : "text-white/40 hover:text-white/80 hover:bg-white/5"
                      } ${collapsed ? "justify-center" : ""}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <div>
                          <p className="text-xs font-medium">{item.label}</p>
                          <p className="text-[9px] font-mono text-white/30">
                            {item.description}
                          </p>
                        </div>
                      )}
                    </Link>
                  );
                })}
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
