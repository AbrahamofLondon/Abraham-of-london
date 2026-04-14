/* pages/inner-circle/account.tsx — Member Account & Token Management */

import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { ShieldCheck, Key, RefreshCw, ArrowRight, Lock } from "lucide-react";

import Layout from "@/components/Layout";
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
       
      >
        <div>
          <WorkspaceNav />
          <header>
            <div>
              <span>
                {tier} Clearance
              </span>
              <span>
                {hasValidToken ? "Active Session" : "No Active Token"}
              </span>
            </div>

            <h1>
              Your <span>Account.</span>
            </h1>
            <p>
              Identity, tier, and active access key management for{" "}
              <span>{name ?? email ?? "Principal"}</span>.
            </p>

            <div>
              <Link
                href="/inner-circle/dashboard"
               
              >
                <ArrowRight size={14} />
                Back to Vault
              </Link>
            </div>
          </header>

          {flash && (
            <div>
              {flash}
            </div>
          )}

          {/* Identity Panel */}
          <section>
            <h2>Identity</h2>
            <div>
              <Field label="Name" value={name ?? "—"} />
              <Field label="Email" value={email ?? "—"} />
              <Field label="Tier" value={tier.toUpperCase()} />
              <Field
                label="Token Status"
                value={hasValidToken ? "ACTIVE" : "INACTIVE"}
                emphasis={hasValidToken ? "active" : "inactive"}
              />
            </div>
            <div>
              <Link href="/inner-circle/dashboard">
                Vault
              </Link>
              <Link href="/inner-circle/briefs">
                Briefs
              </Link>
              <Link href="/diagnostics">
                Diagnostics
              </Link>
            </div>
          </section>

          {/* Token Panel */}
          <section>
            <div>
              <Key size={20} />
              <h2>Access Key</h2>
            </div>

            {hasValidToken && activeKey ? (
              <div>
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
              <div>
                <Lock size={24} />
                <p>
                  No active access key on file. Request a new one to enter the vault.
                </p>
              </div>
            )}

            <div>
              <button
                onClick={() => void requestNewKey()}
                disabled={busy !== null}
               
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
      <div>
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


