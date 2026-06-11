/**
 * pages/admin/operations.tsx — Admin Operations Panel
 *
 * Background job triggers, diagnostic processing, and retention sweep.
 * Admin-guarded. Not public. No destructive actions without confirmation.
 */

import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import { AdminJobsPanel } from "@/components/dashboard/admin/AdminJobsPanel";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;
  return { props: {} };
};

export default function AdminOperationsPage() {
  return (
    <AdminLayout>
      <Head><title>Operations | Admin</title></Head>
      <div style={{ padding: "24px 32px", maxWidth: 800 }}>
        <BackToOperatorCommandCentre />
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#C9A96E", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            OPERATIONS
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: "#f5f0e8" }}>Admin Jobs</h1>
          <p style={{ fontSize: 13, color: "#7e7870", marginTop: 8, lineHeight: 1.6 }}>
            Trigger background processing jobs and maintenance sweeps. All actions are audit logged.
            Retention sweep marks expired diagnostic artifacts — it does not delete records.
          </p>
        </div>
        <AdminJobsPanel />
      </div>
    </AdminLayout>
  );
}
