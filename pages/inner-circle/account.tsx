/* pages/inner-circle/account.tsx — Chamber mode: operating environment */

import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import WorkspaceNav from "@/components/inner-circle/WorkspaceNav";
import { getUnifiedSession } from "@/lib/auth/session-helpers";

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

  const sessionExpiresDisplay = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : activeKey?.expiresAt
    ? new Date(activeKey.expiresAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <Layout title="Account | Inner Circle">
      <div className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <WorkspaceNav />
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-20 lg:px-12 lg:pb-20">
          <header className="max-w-3xl">
            <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/38">
              INNER CIRCLE · ACCOUNT
            </p>
            <h1 className="mt-5 font-serif text-[clamp(2rem,4vw,3rem)] font-light italic leading-[0.95] text-white/92">
              The operating environment.
            </h1>
            <p className="mt-4 font-mono text-[7.5px] uppercase tracking-[0.12em] text-white/48">
              Active session · {name ?? "Member"} · {tier}
            </p>
          </header>

          <section className="mt-12">
            <h2 className="font-mono text-[7.5px] uppercase tracking-[0.28em] text-white/38">
              Identity
            </h2>
            <div className="mt-4 border-t border-white/8">
              <div className="flex items-center justify-between border-b border-white/6 py-3 text-sm text-white/72">
                <span className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-white/38">
                  Email
                </span>
                <span>{email ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/6 py-3 text-sm text-white/72">
                <span className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-white/38">
                  Tier
                </span>
                <span>{tier}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/6 py-3 text-sm text-white/72">
                <span className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-white/38">
                  Session expires
                </span>
                <span>{sessionExpiresDisplay}</span>
              </div>
            </div>
          </section>

          {flash ? (
            <p className="mt-8 font-mono text-[7.5px] uppercase tracking-[0.12em] text-[#C9A96E]">
              {flash}
            </p>
          ) : null}

          <section className="mt-12 space-y-3">
            <button
              type="button"
              onClick={() => void requestNewKey()}
              disabled={busy !== null}
              className="block font-mono text-[7.5px] uppercase tracking-[0.16em] text-white/38 transition-colors hover:text-[#C9A96E] disabled:opacity-40"
            >
              {busy === "resend" ? "Dispatching…" : "Request new access key →"}
            </button>
            <button
              type="button"
              onClick={() => void revokeMyAccess()}
              disabled={busy !== null || !hasValidToken}
              className="block font-mono text-[7.5px] uppercase tracking-[0.16em] text-white/38 transition-colors hover:text-[#C9A96E] disabled:opacity-40"
            >
              {busy === "revoke" ? "Revoking…" : "Revoke session →"}
            </button>
          </section>

          <section className="mt-12">
            <Link
              href="/inner-circle/dashboard"
              className="font-mono text-[7.5px] uppercase tracking-[0.16em] text-white/38 transition-colors hover:text-white/62"
            >
              Back to workspace →
            </Link>
          </section>
        </div>
      </div>
    </Layout>
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
  const tier = String(unified.innerCircle.tier ?? "public");

  let activeKey: ActiveKeyInfo | null = null;

  if (email) {
    try {
      const { prisma } = await import("@/lib/prisma");
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
