import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type { AccessDiagnosticResult } from "@/lib/admin/access-diagnostics";

type PageProps = {
  result: AccessDiagnosticResult | null;
  query: string;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage<PageProps>(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const raw = ctx.query.email;
  const query = typeof raw === "string" ? raw.trim() : "";

  if (!query) {
    return { props: { result: null, query: "" } };
  }

  const { loadUserDiagnostics } = await import("@/lib/admin/access-diagnostics");
  const result = await loadUserDiagnostics(query).catch((err) => {
    console.error("[access-diagnostics] load error", err);
    return null;
  });

  return { props: { result, query } };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-[9px] font-mono uppercase tracking-[0.24em] text-amber-500/60">{title}</h3>
  );
}

function CheckRow({
  label,
  granted,
  detail,
}: {
  label: string;
  granted: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-white/5 py-2 text-sm">
      <span
        className={`mt-0.5 shrink-0 font-mono text-[10px] ${granted ? "text-emerald-400" : "text-white/25"}`}
        aria-label={granted ? "granted" : "denied"}
      >
        {granted ? "✓" : "—"}
      </span>
      <span className={granted ? "text-white/80" : "text-white/35"}>{label}</span>
      {detail && (
        <span className="ml-auto shrink-0 font-mono text-[9px] text-white/30">{detail}</span>
      )}
    </div>
  );
}

function PermissionsPanel({ result }: { result: AccessDiagnosticResult }) {
  if (!result.found || !result.effectiveRole) return null;
  return (
    <div className="border border-white/10 bg-zinc-950/70 p-5">
      <SectionHeader title={`Decision permissions — ${result.effectiveRole}`} />
      <div className="mt-3">
        {result.permissionChecks.map((c) => (
          <CheckRow key={c.permission} label={c.permission} granted={c.granted} />
        ))}
      </div>
    </div>
  );
}

function SurfacesPanel({ result }: { result: AccessDiagnosticResult }) {
  if (!result.found || !result.effectiveRole) return null;
  return (
    <div className="border border-white/10 bg-zinc-950/70 p-5">
      <SectionHeader title="Surface access" />
      <div className="mt-3">
        {result.surfaceChecks.map((c) => (
          <CheckRow
            key={c.surface}
            label={c.surface}
            granted={c.granted}
            detail={c.requiredPermission}
          />
        ))}
      </div>
    </div>
  );
}

function TiersPanel({ result }: { result: AccessDiagnosticResult }) {
  return (
    <div className="border border-white/10 bg-zinc-950/70 p-5">
      <SectionHeader title="Tier access" />
      <p className="mt-1 text-[10px] text-white/35">
        Effective tier: <span className="font-mono text-white/60">{result.access.tier}</span>
      </p>
      <div className="mt-3">
        {result.tierChecks.map((c) => (
          <CheckRow key={c.tier} label={c.tier} granted={c.granted} />
        ))}
      </div>
    </div>
  );
}

function EntitlementsPanel({ result }: { result: AccessDiagnosticResult }) {
  const { tiers, products, artifacts } = result.entitlements;
  const total = tiers.length + products.length + artifacts.length;
  return (
    <div className="border border-white/10 bg-zinc-950/70 p-5">
      <SectionHeader title="Active entitlements" />
      {total === 0 ? (
        <p className="mt-3 text-sm text-white/35">No active entitlements.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {tiers.length > 0 && (
            <div>
              <p className="mb-1 text-[9px] font-mono uppercase tracking-wider text-white/35">Tiers</p>
              <div className="flex flex-wrap gap-1.5">
                {tiers.map((t) => (
                  <AdminStatusBadge key={t} label={t} tone="info" size="md" />
                ))}
              </div>
            </div>
          )}
          {products.length > 0 && (
            <div>
              <p className="mb-1 text-[9px] font-mono uppercase tracking-wider text-white/35">Products</p>
              <div className="flex flex-wrap gap-1.5">
                {products.map((p) => (
                  <AdminStatusBadge key={p} label={p} tone="success" size="md" />
                ))}
              </div>
            </div>
          )}
          {artifacts.length > 0 && (
            <div>
              <p className="mb-1 text-[9px] font-mono uppercase tracking-wider text-white/35">Artifacts</p>
              <div className="flex flex-wrap gap-1.5">
                {artifacts.map((a) => (
                  <AdminStatusBadge key={a} label={a} tone="neutral" size="md" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminNavPanel({ result }: { result: AccessDiagnosticResult }) {
  if (!result.found) return null;
  const sections = result.visibleAdminNav;
  if (sections.length === 0) {
    return (
      <div className="border border-white/10 bg-zinc-950/70 p-5">
        <SectionHeader title="Admin nav visibility" />
        <p className="mt-3 text-sm text-white/35">No admin nav sections visible for this user.</p>
      </div>
    );
  }
  return (
    <div className="border border-white/10 bg-zinc-950/70 p-5">
      <SectionHeader title="Admin nav visibility" />
      <p className="mt-1 text-[10px] text-white/35">
        Surfaces this user would see if they held an admin session.
      </p>
      <div className="mt-4 space-y-4">
        {sections.map((section) => (
          <div key={section.id}>
            <p className="mb-1.5 text-[9px] font-mono uppercase tracking-wider text-white/40">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border border-white/5 bg-black/20 px-3 py-2">
                  <Link
                    href={item.href}
                    className="text-sm text-blue-300/80 hover:text-blue-300"
                  >
                    {item.label}
                  </Link>
                  <AdminStatusBadge
                    label={item.visibility}
                    tone={item.visibility === "admin" ? "warning" : item.visibility === "operator" ? "info" : "muted"}
                    size="md"
                  />
                  {item.status !== "active" && (
                    <AdminStatusBadge label={item.status} tone="muted" size="md" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccessDiagnosticsPage({
  result,
  query,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout title="Access Diagnostics">
      <Head>
        <title>Access Diagnostics | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <Link href="/admin" className="text-[10px] font-mono uppercase tracking-widest text-white/35 hover:text-white/60">
          ← Admin
        </Link>

        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">
            Security &amp; Audit
          </p>
          <h1 className="mt-3 font-serif text-3xl text-white">Access Diagnostics</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/55">
            Read-only diagnostic snapshot for any registered user. Shows their effective role,
            tier, entitlements, permissions, and which surfaces would be visible to them.
          </p>
          <p className="mt-1 max-w-3xl text-[11px] text-amber-500/50">
            Diagnostic mode only — no data is mutated and no session is issued for the target user.
          </p>
        </section>

        {/* Search form */}
        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <form method="GET" className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="email-input"
                className="block text-[10px] font-mono uppercase tracking-[0.18em] text-white/40"
              >
                User email
              </label>
              <input
                id="email-input"
                name="email"
                type="email"
                defaultValue={query}
                placeholder="user@example.com"
                className="mt-1 w-80 border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-amber-500/30 focus:outline-none"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-amber-300 hover:bg-amber-500/15"
            >
              Load diagnostic
            </button>
          </form>
        </section>

        {/* No query yet */}
        {!query && (
          <div className="border border-dashed border-white/10 bg-black/20 px-5 py-6 text-sm text-white/40">
            Enter a user email above to load their access snapshot.
          </div>
        )}

        {/* User not found */}
        {query && result && !result.found && (
          <div className="border border-amber-500/20 bg-amber-500/5 px-5 py-4">
            <p className="text-sm text-amber-200">{result.notFoundReason}</p>
            <p className="mt-1 text-[11px] text-white/35">
              The email may be unregistered, or the user may not have completed sign-up.
            </p>
          </div>
        )}

        {/* Load error */}
        {query && !result && (
          <div className="border border-rose-500/20 bg-rose-500/5 px-5 py-4">
            <p className="text-sm text-rose-300">
              Failed to load diagnostics for <span className="font-mono">{query}</span>. Check server logs.
            </p>
          </div>
        )}

        {/* Results */}
        {result && result.found && (
          <>
            {/* Identity strip */}
            <section className="border border-white/10 bg-zinc-950/70 p-5">
              <SectionHeader title="Identity" />
              <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-4">
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-white/35">Email</p>
                  <p className="mt-0.5 font-mono text-[11px] text-white/70">{result.email}</p>
                </div>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-white/35">User ID</p>
                  <p className="mt-0.5 font-mono text-[11px] text-white/70">{result.userId ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-white/35">Access role</p>
                  <p className="mt-0.5 text-sm text-white/80">{result.access.role ?? "USER"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-white/35">Decision role</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <AdminStatusBadge
                      label={result.effectiveRole ?? "CLIENT"}
                      tone={
                        result.effectiveRole === "ADMIN" || result.effectiveRole === "OWNER"
                          ? "danger"
                          : result.effectiveRole === "OPERATOR"
                          ? "warning"
                          : "info"
                      }
                    />
                    {result.roleSource && (
                      <span className="font-mono text-[9px] text-white/30">{result.roleSource}</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-white/35">Is admin</p>
                  <AdminStatusBadge
                    label={result.access.permissions.isAdmin ? "Yes" : "No"}
                    tone={result.access.permissions.isAdmin ? "danger" : "muted"}
                    size="md"
                  />
                </div>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-white/35">Is owner</p>
                  <AdminStatusBadge
                    label={result.access.permissions.isOwner ? "Yes" : "No"}
                    tone={result.access.permissions.isOwner ? "critical" : "muted"}
                    size="md"
                  />
                </div>
              </div>
            </section>

            <EntitlementsPanel result={result} />
            <TiersPanel result={result} />
            <PermissionsPanel result={result} />
            <SurfacesPanel result={result} />
            <AdminNavPanel result={result} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
