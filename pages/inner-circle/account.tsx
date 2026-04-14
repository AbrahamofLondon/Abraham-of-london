/* pages/inner-circle/account.tsx — Member Account & Token Management */

import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { ShieldCheck, Key, RefreshCw, ArrowRight, Lock } from "lucide-react";

import Layout from "@/components/layout/Layout";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import WorkspaceNav from "@/components/inner-circle/WorkspaceNav";
import { getUnifiedSession } from "@/lib/auth/session-helpers";
import { prisma } from "@/lib/prisma";

interface ActiveKeyInfo {
  keySuffix: string | null;
  keyHash: string;
  expiresAt: string;
  lastUsedAt: string | null;
}

interface AccountProps {
  name: string | null;
  email: string | null;
  tier: string;
  hasValidToken: boolean;
  expiresAt: string | null;
  activeKey: ActiveKeyInfo | null;
}

export default function InnerCircleAccount({
  name,
  email,
  tier,
  hasValidToken,
  expiresAt,
  activeKey,
}: AccountProps) {
  const [busy, setBusy] = React.useState<null | "resend" | "revoke">(null);
  const [flash, setFlash] = React.useState<string | null>(null);

  const keyDisplay = activeKey
    ? activeKey.keySuffix
      ? `****${activeKey.keySuffix}`
      : `****${activeKey.keyHash.slice(-8)}`
    : "—";

  async function requestNewKey() {
    if (!email) {
      setFlash("No email on file — cannot request a new key.");
      return;
    }
    setBusy("resend");
    setFlash(null);
    try {
      const res = await fetch("/api/inner-circle/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name ?? "", recaptchaToken: "" }),
      });
      const data = await res.json();
      if (data.ok) {
        setFlash("A fresh access key has been dispatched to your inbox.");
      } else {
        setFlash(data.error || "Unable to issue a new key.");
      }
    } catch (err) {
      console.error("Resend failed", err);
      setFlash("Network error — please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function revokeMyAccess() {
    const confirmed = window.confirm(
      "Revoke your current access session?\n\nYou will need to unlock again with a fresh key before reaching protected content.",
    );
    if (!confirmed) return;

    setBusy("revoke");
    setFlash(null);
    try {
      const res = await fetch("/api/inner-circle/self-revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "self_revoke" }),
      });
      const data = await res.json();
      if (data.ok) {
        setFlash("Access session revoked. Redirecting…");
        window.setTimeout(() => {
          // Redirect to the public root — /inner-circle is Tier 2 and
          // would redirect-loop without the cookie we just cleared.
          window.location.href = "/";
        }, 1200);
      } else {
        setFlash(data.error || "Unable to revoke session.");
      }
    } catch (err) {
      console.error("Revoke failed", err);
      setFlash("Network error — please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <ErrorBoundary>
      <Layout
        title="Account | Abraham of London"
        currentPath="/inner-circle/account"
        className="bg-white"
      >
        <div className="max-w-4xl mx-auto">
          <WorkspaceNav />
          <header className="mb-12 border-b border-gray-100 pb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-blue-50 text-blue-700 border border-blue-100 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                {tier} Clearance
              </span>
              <span className="text-gray-400 text-[10px] font-mono uppercase tracking-widest">
                {hasValidToken ? "Active Session" : "No Active Token"}
              </span>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl text-gray-900 tracking-tighter leading-none italic">
              Your <span className="text-gray-300">Account.</span>
            </h1>
            <p className="mt-6 text-gray-500 max-w-xl text-lg font-light leading-relaxed italic">
              Identity, tier, and active access key management for{" "}
              <span className="text-gray-900 font-medium">{name ?? email ?? "Principal"}</span>.
            </p>

            <div className="mt-8">
              <Link
                href="/inner-circle/dashboard"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowRight size={14} className="rotate-180" />
                Back to Vault
              </Link>
            </div>
          </header>

          {flash && (
            <div className="mb-8 border border-blue-100 bg-blue-50 p-6 text-sm text-blue-900 font-light">
              {flash}
            </div>
          )}

          {/* Identity Panel */}
          <section className="mb-12 border border-gray-100 bg-white p-8">
            <h2 className="font-serif text-2xl italic text-gray-900 mb-8">Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="Name" value={name ?? "—"} />
              <Field label="Email" value={email ?? "—"} />
              <Field label="Tier" value={tier.toUpperCase()} />
              <Field
                label="Token Status"
                value={hasValidToken ? "ACTIVE" : "INACTIVE"}
                emphasis={hasValidToken ? "active" : "inactive"}
              />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-[10px] font-mono uppercase tracking-[0.22em] text-gray-400">
              <Link href="/inner-circle/dashboard" className="hover:text-blue-600 transition-colors">
                Vault
              </Link>
              <Link href="/inner-circle/briefs" className="hover:text-blue-600 transition-colors">
                Briefs
              </Link>
              <Link href="/diagnostics" className="hover:text-blue-600 transition-colors">
                Diagnostics
              </Link>
            </div>
          </section>

          {/* Token Panel */}
          <section className="mb-12 border border-gray-100 bg-white p-8">
            <div className="flex items-center gap-3 mb-8">
              <Key size={20} className="text-gray-400" />
              <h2 className="font-serif text-2xl italic text-gray-900">Access Key</h2>
            </div>

            {hasValidToken && activeKey ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <Field label="Key Suffix" value={keyDisplay} mono />
                <Field
                  label="Expires"
                  value={
                    expiresAt
                      ? new Date(expiresAt).toLocaleDateString()
                      : activeKey.expiresAt
                      ? new Date(activeKey.expiresAt).toLocaleDateString()
                      : "—"
                  }
                />
                <Field
                  label="Last Used"
                  value={
                    activeKey.lastUsedAt
                      ? new Date(activeKey.lastUsedAt).toLocaleString()
                      : "Never"
                  }
                />
              </div>
            ) : (
              <div className="mb-8 py-8 border border-dashed border-gray-100 rounded-lg text-center">
                <Lock size={24} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 italic font-serif">
                  No active access key on file. Request a new one to enter the vault.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => void requestNewKey()}
                disabled={busy !== null}
                className="flex items-center justify-center gap-2 bg-black text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={14}
                  className={busy === "resend" ? "animate-spin" : undefined}
                />
                {busy === "resend" ? "Dispatching…" : "Request New Access Key"}
              </button>

              <button
                onClick={() => void revokeMyAccess()}
                disabled={busy !== null || !hasValidToken}
                className="flex items-center justify-center gap-2 border border-red-100 bg-white text-red-700 px-8 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldCheck size={14} />
                {busy === "revoke" ? "Revoking…" : "Revoke My Access"}
              </button>
            </div>
          </section>
        </div>
      </Layout>
    </ErrorBoundary>
  );
}

function Field({
  label,
  value,
  mono,
  emphasis,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasis?: "active" | "inactive";
}) {
  const valueClass = [
    mono ? "font-mono text-sm" : "text-lg font-light",
    emphasis === "active" ? "text-emerald-600 font-bold" : "",
    emphasis === "inactive" ? "text-gray-400 italic" : "",
    !emphasis ? "text-gray-900" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-2">
        {label}
      </div>
      <div className={valueClass}>{value}</div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<AccountProps> = async (
  context,
) => {
  const unified = await getUnifiedSession(context);

  if (!unified) {
    return {
      redirect: {
        destination: `/inner-circle?returnTo=${encodeURIComponent("/inner-circle/account")}`,
        permanent: false,
      },
    };
  }

  const email = (unified.user?.email ?? "").toLowerCase() || null;
  const name = unified.user?.name ?? null;
  const tier = String(unified.user?.tier ?? unified.innerCircle.tier ?? "public");

  let activeKey: ActiveKeyInfo | null = null;

  if (email) {
    try {
      const member = await prisma.innerCircleMember.findUnique({
        where: { email },
        select: {
          keys: {
            where: { status: "active" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              keyHash: true,
              keySuffix: true,
              expiresAt: true,
              lastUsedAt: true,
            },
          },
        },
      });

      const top = member?.keys?.[0];
      if (top) {
        activeKey = {
          keySuffix: top.keySuffix ?? null,
          keyHash: top.keyHash,
          expiresAt: top.expiresAt.toISOString(),
          lastUsedAt: top.lastUsedAt ? top.lastUsedAt.toISOString() : null,
        };
      }
    } catch (err) {
      console.error("[ACCOUNT_PAGE] Failed to load active key", err);
    }
  }

  return {
    props: {
      name,
      email,
      tier,
      hasValidToken: unified.innerCircle.hasValidToken,
      expiresAt: unified.innerCircle.expiresAt,
      activeKey,
    },
  };
};
