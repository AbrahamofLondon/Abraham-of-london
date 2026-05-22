/* pages/admin/command-centre.tsx — Security & Governance Command Centre */
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  Key,
  Activity,
  Radio,
  BarChart3,
  Users,
  Zap,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import GlobalLockToggle from "@/components/admin/GlobalLockToggle";
import GlobalLockStatus from "@/components/admin/GlobalLockStatus";
import UpgradeTerminal from "@/components/admin/UpgradeTerminal";
import AuditDashboard from "@/components/admin/AuditDashboard";
import DiagnosticTelemetryPanel from "@/components/admin/DiagnosticTelemetryPanel";
import LiveTrafficMonitor from "@/components/admin/LiveTrafficMonitor";
import ActivityFeed, { type FeedEntry } from "@/components/admin/ActivityFeed";
import { IntakeFeed } from "@/components/admin/IntakeFeed";
import { prisma } from "@/lib/prisma.server";

/* ─── Types ──────────────────────────────────────────────────── */

type UpgradeRequest = {
  id: string;
  actorId: string;
  actorEmail: string;
  createdAt: string;
  metadata: {
    reason?: string;
    requiredTier?: string;
    userTier?: string;
  };
};

type IntakeInquiry = {
  id: string;
  name: string;
  email: string;
  status: string;
  metadata?: { priorityScore?: number };
};

type PageProps = {
  isAuthorized: true;
  pendingAppeals: UpgradeRequest[];
  intakeInquiries: IntakeInquiry[];
};

/* ─── Section header ─────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, badge }: {
  icon: React.ElementType;
  title: string;
  badge?: string | number;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 bg-white/5 rounded-lg border border-white/10">
        <Icon className="h-4 w-4 text-amber-500/70" />
      </div>
      <div className="flex items-center gap-3">
        <h2 className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/40">{title}</h2>
        {badge !== undefined && (
          <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Activity feed transform ────────────────────────────────── */
function transformActivityFeed(data: unknown): FeedEntry[] {
  const items = (data as any)?.logs ?? [];
  return items.slice(0, 8).map((log: any) => ({
    id: log.id,
    timestamp: log.createdAt,
    label: String(log.action ?? "").replace(/_/g, " "),
    detail: log.actorEmail || undefined,
    status: (
      log.severity === "critical" ? "error"
      : log.severity === "high" ? "warn"
      : log.severity === "warning" ? "warn"
      : "ok"
    ) as FeedEntry["status"],
    metric: log.ipAddress ? { label: "IP", value: log.ipAddress } : undefined,
  }));
}

/* ─── Page ───────────────────────────────────────────────────── */
const CommandCentrePage: NextPage<PageProps> = ({ pendingAppeals, intakeInquiries }) => {
  return (
    <AdminLayout title="Security Command Centre">
      <Head>
        <title>Command Centre | Admin — Abraham of London</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-10">

        {/* ── LOCK STATUS BANNER ─────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/25 mb-1">
              Control Plane
            </p>
            <h1 className="font-serif text-3xl text-white">
              Security & Governance
            </h1>
          </div>
          <GlobalLockStatus />
        </div>

        {/* ── 1. PLATFORM LOCK ───────────────────────────────── */}
        <section>
          <SectionHeader icon={Lock} title="Platform Lock" />
          <GlobalLockToggle />
        </section>

        {/* ── 2. ACCESS ESCALATION QUEUE ─────────────────────── */}
        <section>
          <SectionHeader
            icon={ShieldCheck}
            title="Access Escalation Queue"
            badge={pendingAppeals.length > 0 ? pendingAppeals.length : undefined}
          />
          {pendingAppeals.length > 0 ? (
            <UpgradeTerminal requests={pendingAppeals} />
          ) : (
            <div className="border border-white/5 bg-zinc-900/20 rounded-2xl p-8 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500/40 mb-3" />
              <p className="text-[11px] font-mono text-white/30 uppercase tracking-widest">
                No pending escalation appeals
              </p>
            </div>
          )}
        </section>

        {/* ── 3. REVOCATION / KEY MANAGEMENT ────────────────── */}
        <section>
          <SectionHeader icon={Key} title="Revocation & Key Management" />
          <div className="border border-white/10 bg-zinc-950/70 p-6 rounded-2xl">
            <p className="text-sm text-white/60 mb-4">
              Manage institutional access keys, revoke compromised credentials, and audit key
              issuance history.
            </p>
            <Link
              href="/admin/access-keys"
              className="inline-flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-amber-100 transition-colors hover:border-amber-400/50 hover:bg-amber-500/15 rounded-lg"
            >
              <Key className="h-3 w-3" />
              Open Access Key Management
            </Link>
          </div>
        </section>

        {/* ── 4–5. ACTIVITY FEED + LIVE TRAFFIC ──────────────── */}
        <section>
          <SectionHeader icon={Activity} title="Live Activity" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-3">
                Activity Feed
              </p>
              <ActivityFeed
                title="Recent Audit Events"
                fetchUrl="/api/admin/audit-logs"
                transform={transformActivityFeed}
                emptyMessage="No audit events yet."
                maxItems={8}
              />
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-3">
                Live Traffic
              </p>
              <LiveTrafficMonitor />
            </div>
          </div>
        </section>

        {/* ── 6. AUDIT DASHBOARD ─────────────────────────────── */}
        <section>
          <SectionHeader icon={BarChart3} title="Institutional Audit Trail" />
          <div className="border border-white/5 bg-zinc-950/40 rounded-2xl p-6">
            <AuditDashboard />
          </div>
        </section>

        {/* ── 7. DIAGNOSTIC TELEMETRY ────────────────────────── */}
        <section>
          <SectionHeader icon={Zap} title="Diagnostic Telemetry" />
          <DiagnosticTelemetryPanel />
        </section>

        {/* ── 8. INTAKE QUEUE ────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={Users}
            title="Intake Queue"
            badge={intakeInquiries.length > 0 ? intakeInquiries.length : undefined}
          />
          {intakeInquiries.length > 0 ? (
            <IntakeFeed inquiries={intakeInquiries} />
          ) : (
            <div className="border border-white/5 bg-zinc-900/20 rounded-2xl p-8 text-center">
              <Radio className="mx-auto h-8 w-8 text-white/20 mb-3" />
              <p className="text-[11px] font-mono text-white/30 uppercase tracking-widest">
                No pending intake inquiries
              </p>
            </div>
          )}
        </section>

      </div>
    </AdminLayout>
  );
};

/* ─── Server-side data ───────────────────────────────────────── */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const guard = await requireAdminPage(context);
  if (!guard.authorized) return guard.redirect;

  // Pending clearance appeals from audit log
  const appealRows = await prisma.systemAuditLog
    .findMany({
      where: { action: "CLEARANCE_UPGRADE_REQUEST", status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 25,
    })
    .catch(() => []);

  const pendingAppeals: UpgradeRequest[] = appealRows.map((row) => {
    const meta = (() => {
      try {
        return JSON.parse(String(row.metadata ?? "{}"));
      } catch {
        return {};
      }
    })();
    return {
      id: row.id,
      actorId: row.actorId ?? "",
      actorEmail: row.actorEmail ?? "unknown",
      createdAt: row.createdAt.toISOString(),
      metadata: {
        reason: meta.reason,
        requiredTier: meta.requiredTier,
        userTier: meta.userRole,
      },
    };
  });

  // Intake inquiries — sourced from deal-flow contact submissions
  const intakeRows = await prisma.systemAuditLog
    .findMany({
      where: { action: "CONTACT_SUBMISSION", status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    .catch(() => []);

  const intakeInquiries: IntakeInquiry[] = intakeRows.map((row) => {
    const meta = (() => {
      try {
        return JSON.parse(String(row.metadata ?? "{}"));
      } catch {
        return {};
      }
    })();
    return {
      id: row.id,
      name: meta.name ?? row.actorEmail ?? "Unknown",
      email: row.actorEmail ?? "",
      status: meta.priority ? "PRIORITY" : "PENDING",
      metadata: { priorityScore: meta.priorityScore ?? 0 },
    };
  });

  return {
    props: {
      isAuthorized: true,
      pendingAppeals,
      intakeInquiries,
    },
  };
};

export default CommandCentrePage;
