/**
 * pages/admin/billing.tsx — Admin Billing & Entitlements
 *
 * View paid product grants and active entitlements by email lookup.
 * Admin-guarded. No raw Stripe secrets exposed. No unrelated customer records.
 */

import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import BillingEntitlementsPanel from "@/components/dashboard/admin/BillingEntitlementsPanel";
import { prisma } from "@/lib/prisma.server";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

type Entitlement = { productCode: string; tier: string; status: string; endsAt?: string | null };
type PageProps = { email: string; entitlements: Entitlement[] };

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;

  const lookupEmail = typeof ctx.query.email === "string" ? ctx.query.email.toLowerCase().trim() : null;

  if (!lookupEmail) {
    return { props: { email: "", entitlements: [] } };
  }

  const rows = await prisma.clientEntitlement.findMany({
    where: { email: lookupEmail },
    select: { productCode: true, tier: true, status: true, endsAt: true },
    orderBy: { createdAt: "desc" },
  });

  const entitlements: Entitlement[] = rows.map(r => ({
    productCode: r.productCode,
    tier: r.tier,
    status: r.status,
    endsAt: r.endsAt?.toISOString() ?? null,
  }));

  return { props: { email: lookupEmail, entitlements } };
};

export default function AdminBillingPage({
  email,
  entitlements,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout>
      <Head><title>Billing & Entitlements | Admin</title></Head>
      <div style={{ padding: "24px 32px", maxWidth: 800 }}>
        <BackToOperatorCommandCentre />
        <div style={{ marginBottom: 32 }}>
          <p style={{ ...mono, fontSize: 11, color: "#C9A96E", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            BILLING & ENTITLEMENTS
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: "#f5f0e8" }}>Commercial Access</h1>
          <p style={{ fontSize: 13, color: "#7e7870", marginTop: 8 }}>
            Look up paid product grants and active entitlements by email address.
          </p>
        </div>

        {/* Email lookup form */}
        <form method="GET" style={{ marginBottom: 32, display: "flex", gap: 10 }}>
          <input
            name="email"
            type="email"
            defaultValue={email}
            placeholder="client@example.com"
            style={{
              ...mono, fontSize: 12, background: "#0d0d12", border: "1px solid #2a2a32",
              color: "#e8e0d0", padding: "9px 12px", borderRadius: 3, width: 280,
            }}
          />
          <button
            type="submit"
            style={{
              ...mono, fontSize: 11, background: "#1a1a24", color: "#C9A96E",
              border: "1px solid #2a2a38", padding: "9px 16px", borderRadius: 3, cursor: "pointer",
            }}
          >
            Look Up
          </button>
        </form>

        {email ? (
          <BillingEntitlementsPanel entitlements={entitlements} email={email} />
        ) : (
          <p style={{ fontSize: 13, color: "#5e5850" }}>Enter an email address to look up entitlements.</p>
        )}
      </div>
    </AdminLayout>
  );
}
