/**
 * pages/admin/artifacts.tsx — Admin Diagnostic Artifact Report Panel
 *
 * Shows diagnostic report artifacts for the current admin session.
 * Admin-guarded. Scoped to the authenticated user's own artifacts.
 * For full inventory across all users, use the diagnostics summary endpoint.
 */

import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import { MyReportsPanel } from "@/components/dashboard/admin/MyReportsPanel";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;
  return { props: {} };
};

export default function AdminArtifactsPage() {
  return (
    <AdminLayout>
      <Head><title>Artifacts | Admin</title></Head>
      <div style={{ padding: "24px 32px", maxWidth: 800 }}>
        <BackToOperatorCommandCentre />
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#C9A96E", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            ARTIFACTS
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: "#f5f0e8" }}>Diagnostic Report Artifacts</h1>
          <p style={{ fontSize: 13, color: "#7e7870", marginTop: 8, lineHeight: 1.6 }}>
            Report artifacts generated for the current session account. Scoped to this user.
            Retention class shows whether records are active, expired, or revoked.
          </p>
        </div>
        <MyReportsPanel />
      </div>
    </AdminLayout>
  );
}
