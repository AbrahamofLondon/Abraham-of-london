/* pages/access/index.tsx — User Access Summary */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { Shield, Key, ChevronRight, Lock, Mail, LogOut } from "lucide-react";

import { signIn, signOut } from "next-auth/react";
import Layout from "@/components/Layout";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { getUserAccess } from "@/lib/access/get-user-access";
import type { EffectiveAccess } from "@/lib/access/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PageProps = {
  access: EffectiveAccess;
  email: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIER_LABELS: Record<string, string> = {
  public: "Public",
  member: "Member",
  "inner-circle": "Inner Circle",
  restricted: "Restricted",
  client: "Client",
  legacy: "Legacy",
  architect: "Architect",
  owner: "Owner",
  "top-secret": "Top Secret",
};

function tierLabel(tier: string): string {
  return TIER_LABELS[tier] || tier;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const AccessPage: NextPage<PageProps> = ({ access, email }) => {
  const hasEntitlements =
    access.entitlements.tiers.length > 0 ||
    access.entitlements.artifacts.length > 0 ||
    access.entitlements.products.length > 0;

  return (
    <Layout
      title="Access | Abraham of London"
      canonicalUrl="/access"
      fullWidth
    >
      <Head>
        <title>Access Summary | Abraham of London</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main
        className="min-h-screen"
        style={{ backgroundColor: "var(--ds-background)" }}
      >
        <div className="mx-auto max-w-2xl px-6 pb-24 pt-32">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4" style={{ color: "var(--ds-accent)" }} />
            <span
              className="font-mono text-[8px] uppercase tracking-[0.40em]"
              style={{ color: "var(--ds-accent)" }}
            >
              Access Summary
            </span>
          </div>

          <h1
            className="mt-6 font-serif text-3xl font-light"
            style={{ color: "var(--ds-text)" }}
          >
            Your Access
          </h1>

          {email && (
            <p
              className="mt-2 font-mono text-[11px] tracking-wide"
              style={{ color: "var(--ds-text-muted)" }}
            >
              {email}
            </p>
          )}

          <div
            className="my-8 h-px"
            style={{ background: "linear-gradient(to right, var(--ds-accent-soft), transparent)" }}
          />

          {/* Effective tier card */}
          <div
            className="rounded border p-6"
            style={{
              borderColor: "var(--ds-accent-soft)",
              backgroundColor: "var(--ds-panel)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div
                  className="font-mono text-[8px] uppercase tracking-[0.32em]"
                  style={{ color: "var(--ds-text-subtle)" }}
                >
                  Effective Tier
                </div>
                <div
                  className="mt-3 font-serif text-2xl"
                  style={{ color: "var(--ds-accent)" }}
                >
                  {tierLabel(access.tier)}
                </div>
              </div>
              {access.role && access.role !== "USER" && (
                <span
                  className="rounded border px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.24em]"
                  style={{
                    borderColor: "var(--ds-accent-soft)",
                    color: "var(--ds-accent)",
                    backgroundColor: "rgba(201,169,110,0.06)",
                  }}
                >
                  {access.role}
                </span>
              )}
            </div>

            {/* Permissions summary */}
            <div
              className="mt-5 flex flex-wrap gap-3 border-t pt-4"
              style={{ borderColor: "var(--ds-border)" }}
            >
              <span
                className="rounded-full border px-3 py-1 font-mono text-[8px] uppercase tracking-[0.2em]"
                style={{
                  borderColor: access.permissions.isAuthenticated ? "var(--ds-accent-soft)" : "var(--ds-border)",
                  color: access.permissions.isAuthenticated ? "var(--ds-accent)" : "var(--ds-text-subtle)",
                }}
              >
                {access.permissions.isAuthenticated ? "Authenticated" : "Guest"}
              </span>
              {access.permissions.isAdmin && (
                <span
                  className="rounded-full border px-3 py-1 font-mono text-[8px] uppercase tracking-[0.2em]"
                  style={{ borderColor: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
                >
                  Admin
                </span>
              )}
              {access.permissions.isOwner && (
                <span
                  className="rounded-full border px-3 py-1 font-mono text-[8px] uppercase tracking-[0.2em]"
                  style={{ borderColor: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
                >
                  Owner
                </span>
              )}
            </div>
          </div>

          {/* Active entitlements */}
          <div className="mt-8">
            <h2
              className="font-mono text-[9px] uppercase tracking-[0.32em]"
              style={{ color: "var(--ds-text-subtle)" }}
            >
              Active Entitlements
            </h2>

            {!hasEntitlements ? (
              <div
                className="mt-4 rounded border p-6 text-center"
                style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }}
              >
                <Lock className="mx-auto h-5 w-5" style={{ color: "var(--ds-text-subtle)", opacity: 0.5 }} />
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: "var(--ds-text-muted)" }}
                >
                  No active entitlements. Redeem an access key or accept an
                  email invitation to unlock tier upgrades, artifacts, or products.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {access.entitlements.tiers.map((t) => (
                  <div
                    key={`tier-${t}`}
                    className="flex items-center justify-between rounded border px-4 py-3"
                    style={{
                      borderColor: "var(--ds-accent-soft)",
                      backgroundColor: "var(--ds-panel)",
                    }}
                  >
                    <span
                      className="font-mono text-[8px] uppercase tracking-[0.24em]"
                      style={{ color: "var(--ds-accent)" }}
                    >
                      Tier
                    </span>
                    <span
                      className="font-mono text-[10px] tracking-wide"
                      style={{ color: "var(--ds-text)" }}
                    >
                      {tierLabel(t)}
                    </span>
                  </div>
                ))}

                {access.entitlements.artifacts.map((a) => (
                  <div
                    key={`artifact-${a}`}
                    className="flex items-center justify-between rounded border px-4 py-3"
                    style={{
                      borderColor: "var(--ds-border)",
                      backgroundColor: "var(--ds-panel)",
                    }}
                  >
                    <span
                      className="font-mono text-[8px] uppercase tracking-[0.24em]"
                      style={{ color: "var(--ds-text-subtle)" }}
                    >
                      Artifact
                    </span>
                    <span
                      className="font-mono text-[10px] tracking-wide"
                      style={{ color: "var(--ds-text)" }}
                    >
                      {a}
                    </span>
                  </div>
                ))}

                {access.entitlements.products.map((p) => (
                  <div
                    key={`product-${p}`}
                    className="flex items-center justify-between rounded border px-4 py-3"
                    style={{
                      borderColor: "var(--ds-border)",
                      backgroundColor: "var(--ds-panel)",
                    }}
                  >
                    <span
                      className="font-mono text-[8px] uppercase tracking-[0.24em]"
                      style={{ color: "var(--ds-text-subtle)" }}
                    >
                      Product
                    </span>
                    <span
                      className="font-mono text-[10px] tracking-wide"
                      style={{ color: "var(--ds-text)" }}
                    >
                      {p}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            className="mt-10 space-y-3"
            style={{ borderTop: "1px solid var(--ds-border)", paddingTop: "1.5rem" }}
          >
            <Link
              href="/access/redeem"
              className="flex items-center justify-between rounded border px-5 py-4 transition"
              style={{
                borderColor: "var(--ds-accent-soft)",
                backgroundColor: "var(--ds-accent-soft)",
                color: "var(--ds-accent)",
              }}
            >
              <span className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.28em]">
                <Key className="h-3.5 w-3.5" />
                Redeem Access Key
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            {!access.permissions.isAuthenticated ? (
              <button
                onClick={() => signIn(undefined, { callbackUrl: "/access" })}
                className="flex w-full items-center justify-between rounded border px-5 py-4 text-left transition"
                style={{
                  borderColor: "var(--ds-border)",
                  color: "var(--ds-text-muted)",
                }}
              >
                <span className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.28em]">
                  <Lock className="h-3.5 w-3.5" />
                  Sign In
                </span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center justify-between rounded border px-5 py-4 text-left transition"
                style={{
                  borderColor: "var(--ds-border)",
                  color: "var(--ds-text-subtle)",
                }}
              >
                <span className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.28em]">
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default AccessPage;

// ---------------------------------------------------------------------------
// Server-side
// ---------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const userId = (session?.user as any)?.id ?? null;
  const access = await getUserAccess(prisma, userId);

  return {
    props: {
      access: JSON.parse(JSON.stringify(access)),
      email: session?.user?.email ?? null,
    },
  };
};
