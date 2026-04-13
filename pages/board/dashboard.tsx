/* pages/board/dashboard.tsx */
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import prisma from "@/lib/prisma";
import Layout from "@/components/Layout";
import { Users, Zap, Clock, ExternalLink, Activity, Shield, Key } from "lucide-react";
import { validateAdminAccess } from "@/lib/server/validation";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";
import { safeFirstChar } from "@/lib/utils/safe";

interface MemberRow {
  id: string;
  emailHash: string;
  emailHashPrefix: string | null;
  name?: string | null;
  status: string;
  tier: string;
  email?: string | null;
  createdAt: string;
  lastSeenAt: string;
  lastIp?: string | null;
  flags?: string | null;
}

interface StrategyIntakeRow {
  id: string;
  fullName: string;
  emailHash: string | null;
  organisation: string;
  status: string;
  score: number | null;
  payload: unknown;
  createdAt: string;
}

interface DashboardStats {
  totalMembers: number;
  totalIntakes: number;
  pendingIntakes: number;
  acceptedIntakes: number;
  activeMembers: number;
  todayDownloads: number;
  activeSessions: number;
  totalKeys: number;
  activeKeys: number;
}

type DashboardProps = {
  members: MemberRow[];
  intakes: StrategyIntakeRow[];
  stats: DashboardStats;
  lastUpdated: string;
};

export const getServerSideProps: GetServerSideProps<DashboardProps> = async ({ req }) => {
  const startTime = Date.now();

  const auth = await validateAdminAccess(req as any);

  if (!auth.valid) {
    await logAuditEvent({
      actorType: "member",
      actorId: "anonymous",
      action: AUDIT_ACTIONS.ACCESS_DENIED,
      resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
      status: "failed",
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
      details: {
        path: "/board/dashboard",
        reason: auth.reason,
      },
    });

    return { notFound: true };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      members,
      intakes,
      membersCount,
      activeMembersCount,
      intakesCount,
      pendingIntakesCount,
      acceptedIntakesCount,
      todayDownloadsCount,
      activeSessionsCount,
      totalKeysCount,
      activeKeysCount,
    ] = await Promise.all([
      prisma.innerCircleMember.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          emailHash: true,
          emailHashPrefix: true,
          name: true,
          status: true,
          tier: true,
          email: true,
          createdAt: true,
          lastSeenAt: true,
          lastIp: true,
          flags: true,
        },
      }),

      prisma.strategyIntake.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          fullName: true,
          emailHash: true,
          organisation: true,
          status: true,
          score: true,
          payload: true,
          createdAt: true,
        },
      }),

      prisma.innerCircleMember.count(),

      prisma.innerCircleMember.count({
        where: { status: "active" },
      }),

      prisma.strategyIntake.count(),

      prisma.strategyIntake.count({
        where: {
          status: {
            in: ["PENDING", "IN_REVIEW"],
          },
        },
      }),

      prisma.strategyIntake.count({
        where: { status: "ANALYZED" },
      }),

      prisma.downloadAuditEvent.count({
        where: {
          createdAt: {
            gte: today,
          },
          success: true,
        },
      }),

      prisma.session.count({
        where: {
          expiresAt: { gt: new Date() },
          status: "active",
        },
      }),

      prisma.innerCircleKey.count(),

      prisma.innerCircleKey.count({
        where: {
          status: "active",
          expiresAt: { gt: new Date() },
          revokedAt: null,
        },
      }),
    ]);

    const stats: DashboardStats = {
      totalMembers: membersCount,
      totalIntakes: intakesCount,
      pendingIntakes: pendingIntakesCount,
      acceptedIntakes: acceptedIntakesCount,
      activeMembers: activeMembersCount,
      todayDownloads: todayDownloadsCount,
      activeSessions: activeSessionsCount,
      totalKeys: totalKeysCount,
      activeKeys: activeKeysCount,
    };

    await logAuditEvent({
      actorType: "admin",
      actorId: auth.userId,
      action: AUDIT_ACTIONS.READ,
      resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
      status: "success",
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
      details: {
        durationMs: Date.now() - startTime,
        stats,
      },
    });

    return {
      props: {
        members: JSON.parse(JSON.stringify(members)),
        intakes: JSON.parse(JSON.stringify(intakes)),
        stats,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Institutional Dashboard Data Failure:", error);

    await logAuditEvent({
      actorType: "system",
      action: AUDIT_ACTIONS.API_ERROR,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      status: "failed",
      details: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    const fallbackStats: DashboardStats = {
      totalMembers: 0,
      totalIntakes: 0,
      pendingIntakes: 0,
      acceptedIntakes: 0,
      activeMembers: 0,
      todayDownloads: 0,
      activeSessions: 0,
      totalKeys: 0,
      activeKeys: 0,
    };

    return {
      props: {
        members: [],
        intakes: [],
        stats: fallbackStats,
        lastUpdated: new Date().toISOString(),
      },
    };
  }
};

const BoardDashboard: NextPage<DashboardProps> = ({
  members,
  intakes,
  stats,
  lastUpdated,
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const filteredMembers = React.useMemo(() => {
    return members.filter((member) => {
      const prefix = member.emailHashPrefix || "";
      const matchesSearch =
        searchTerm === "" ||
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prefix.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || member.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [members, searchTerm, statusFilter]);

  const filteredIntakes = React.useMemo(() => {
    return intakes.filter((intake) => {
      return (
        searchTerm === "" ||
        intake.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intake.organisation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [intakes, searchTerm]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activePercentage =
    stats.totalMembers > 0
      ? Math.round((stats.activeMembers / stats.totalMembers) * 100)
      : 0;

  const getDecisionStatement = (payload: unknown, score: number | null) => {
    const p =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {};

    const analysisNotes =
      p.analysisNotes &&
      typeof p.analysisNotes === "object" &&
      !Array.isArray(p.analysisNotes)
        ? (p.analysisNotes as Record<string, unknown>)
        : null;

    const statement =
      typeof analysisNotes?.decisionStatement === "string"
        ? analysisNotes.decisionStatement
        : null;

    if (statement) return statement;
    if (typeof score === "number" && score >= 22) {
      return "Escalate to directorate review due to elevated institutional gravity.";
    }
    if (typeof score === "number") {
      return "Proceed through standard acceptance workflow with monitored follow-up.";
    }
    return "Assessment pending final review.";
  };

  return (
    <Layout title="Board Intelligence">
      <Head>
        <title>Board Intelligence Dashboard | Abraham of London</title>
        <meta
          name="description"
          content="Institutional oversight dashboard for Abraham of London"
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4 text-white md:p-8">
        <header className="mx-auto mb-8 max-w-7xl border-b border-white/10 pb-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/60 italic">
                Institutional Oversight
              </p>
              <h1 className="font-serif text-3xl font-bold italic text-white md:text-4xl">
                Board Intelligence <span className="text-white/30">Dashboard</span>
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <p className="font-mono text-xs uppercase text-emerald-400">
                    Operational
                  </p>
                </div>
                <p className="text-[10px] font-bold uppercase text-gray-500">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto mb-8 max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search members, intakes, organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 pl-10 text-sm focus:border-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 transform">
                  <svg
                    className="h-4 w-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="disabled">Disabled</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto mb-8 max-w-7xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-blue-950/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase text-blue-400/80">
                    Members
                  </p>
                  <p className="text-2xl font-bold">{stats.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400/30" />
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-gray-400">
                  <span>Active: {stats.activeMembers}</span>
                  <span>{activePercentage}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-800">
                  <div
                    className="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${activePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-900/20 to-amber-950/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase text-amber-400/80">
                    Intakes
                  </p>
                  <p className="text-2xl font-bold">{stats.totalIntakes}</p>
                </div>
                <Zap className="h-8 w-8 text-amber-400/30" />
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-green-400">✓ {stats.acceptedIntakes}</span>
                  <span className="text-yellow-400">⏳ {stats.pendingIntakes}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-purple-950/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase text-purple-400/80">
                    Access Keys
                  </p>
                  <p className="text-2xl font-bold">{stats.totalKeys}</p>
                </div>
                <Key className="h-8 w-8 text-purple-400/30" />
              </div>
              <div className="mt-3">
                <p className="text-xs text-green-400">{stats.activeKeys} active</p>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/20 to-emerald-950/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase text-emerald-400/80">
                    Today
                  </p>
                  <p className="text-2xl font-bold">{stats.todayDownloads}</p>
                </div>
                <Activity className="h-8 w-8 text-emerald-400/30" />
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-400">
                  {stats.activeSessions} active sessions
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700/20 bg-gradient-to-br from-gray-900/20 to-gray-950/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase text-gray-400/80">
                    System
                  </p>
                  <p className="text-2xl font-bold">100%</p>
                </div>
                <Shield className="h-8 w-8 text-gray-400/30" />
              </div>
              <div className="mt-3">
                <p className="text-xs text-emerald-400">All systems normal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          <section className="lg:col-span-1">
            <div className="rounded-xl border border-white/10 bg-black/40 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                    Members
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-500/10 px-2 py-1 font-mono text-xs text-blue-400">
                    {filteredMembers.length}
                  </span>
                  <button className="text-xs text-gray-500 hover:text-white">
                    View All
                  </button>
                </div>
              </div>

              <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const initial =
                      safeFirstChar(member?.name) ||
                      safeFirstChar(member?.emailHashPrefix || "") ||
                      "A";

                    return (
                      <div
                        key={member.id}
                        className="group rounded-lg border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-4 transition-all hover:border-blue-500/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold">
                                {initial}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">
                                  {member.name || "Anonymous Member"}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-400">
                                  {member.email
                                    ? `${member.email.substring(0, 3)}•••@••••.com`
                                    : "No email"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span
                              className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                                member.status === "active"
                                  ? "bg-green-500/20 text-green-400"
                                  : member.status === "suspended"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-gray-800 text-gray-400"
                              }`}
                            >
                              {member.status}
                            </span>
                            <span className="mt-1 text-[9px] text-gray-500">
                              {member.tier}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-400">Joined:</span>
                            <span className="text-white">{formatDate(member.createdAt)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-400">Prefix:</span>
                            <span className="ml-1 text-white">
                              {member.emailHashPrefix || "n/a"}
                            </span>
                          </div>
                        </div>

                        {member.lastSeenAt && (
                          <div className="mt-2 border-t border-white/5 pt-2">
                            <p className="text-[10px] text-gray-500">
                              Last seen: {formatDateTime(member.lastSeenAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-white/10 py-10 text-center">
                    <Users className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                    <p className="text-sm text-gray-400">No members found</p>
                    {searchTerm && (
                      <p className="mt-1 text-xs text-gray-600">
                        Try a different search term
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="lg:col-span-2">
            <div className="rounded-xl border border-white/10 bg-black/40 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                    Strategic Intakes
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-500/10 px-2 py-1 font-mono text-xs text-amber-500">
                    {filteredIntakes.length} of {stats.totalIntakes}
                  </span>
                  <button className="text-xs text-gray-500 hover:text-white">
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
                {filteredIntakes.length > 0 ? (
                  filteredIntakes.map((intake) => {
                    const score = intake.score ?? 0;
                    const decisionStatement = getDecisionStatement(intake.payload, intake.score);

                    return (
                      <div
                        key={intake.id}
                        className={`group relative overflow-hidden rounded-xl border p-5 transition-all ${
                          intake.status === "ACCEPTED"
                            ? "border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent"
                            : intake.status === "REJECTED"
                              ? "border-red-500/20 bg-gradient-to-r from-red-500/5 to-transparent"
                              : "border-white/10 bg-gradient-to-r from-white/5 to-transparent"
                        }`}
                      >
                        <div
                          className={`absolute bottom-0 left-0 top-0 w-1 ${
                            intake.status === "ACCEPTED"
                              ? "bg-amber-500"
                              : intake.status === "REJECTED"
                                ? "bg-red-500"
                                : "bg-gray-600"
                          }`}
                        />

                        <div className="ml-2">
                          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
                            <div className="flex-1">
                              <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700">
                                  <span className="text-sm font-bold">{score}</span>
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-white">
                                    {intake.fullName}
                                  </h3>
                                  <p className="text-sm text-gray-300">
                                    {intake.organisation}
                                  </p>
                                </div>
                                <span
                                  className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase ${
                                    intake.status === "ACCEPTED"
                                      ? "bg-amber-500 text-black"
                                      : intake.status === "REJECTED"
                                        ? "bg-red-500/20 text-red-400"
                                        : intake.status === "PENDING" ||
                                            intake.status === "PENDING_DIRECTORATE_REVIEW"
                                          ? "bg-yellow-500/20 text-yellow-400"
                                          : "bg-gray-800 text-gray-400"
                                  }`}
                                >
                                  {intake.status}
                                </span>
                              </div>

                              <div className="mt-4">
                                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-400/80">
                                  Decision Anchor
                                </p>
                                <p className="border-l-2 border-amber-500/30 pl-4 text-sm italic leading-relaxed text-gray-200">
                                  &ldquo;{decisionStatement}&rdquo;
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end">
                              <div className="mb-4 text-right">
                                <div className="mb-1 text-3xl font-black text-white">
                                  {score}
                                  <span className="text-sm text-gray-600">/25</span>
                                </div>
                                <p className="text-xs text-gray-500">Assessment Score</p>

                                <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-gray-800">
                                  <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                                    style={{ width: `${(score / 25) * 100}%` }}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <button className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 transition hover:bg-white/10 hover:text-white">
                                  <ExternalLink className="h-3.5 w-3.5" /> Review
                                </button>
                                <span className="text-xs text-gray-600">
                                  {formatDateTime(intake.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-white/10 py-12 text-center">
                    <Zap className="mx-auto mb-3 h-12 w-12 text-gray-600" />
                    <p className="text-sm text-gray-400">No strategic intakes found</p>
                    {searchTerm && (
                      <p className="mt-1 text-xs text-gray-600">
                        No matches for "{searchTerm}"
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Form submissions will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <footer className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 md:mb-0">
              <p className="mb-1 text-xs text-gray-600">
                Abraham of London • Board Intelligence Dashboard v2.1
              </p>
              <p className="text-[10px] text-gray-700">
                Secure access granted to authorized personnel only
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>Database: Connected</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Key className="h-3 w-3" />
                <span>Updated: {formatDateTime(lastUpdated)}</span>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-amber-500 transition hover:text-amber-400"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </footer>
      </main>
    </Layout>
  );
};

export default BoardDashboard;