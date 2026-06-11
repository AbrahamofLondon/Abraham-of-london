/**
 * pages/admin/briefs.tsx — Admin Brief Search
 *
 * Search intelligence assets from the content library.
 * Admin-guarded. Results are drawn from the static search index —
 * this is a content search, not a live DB query.
 * For order/dossier DB search, use the delivery queue or advisory queue.
 */

import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import BriefSearch from "@/components/dashboard/admin/BriefSearch";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;
  return { props: {} };
};

export default function AdminBriefsPage() {
  return (
    <AdminLayout>
      <Head><title>Brief Search | Admin</title></Head>
      <div style={{ padding: "24px 32px", maxWidth: 900 }}>
        <BackToOperatorCommandCentre />
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#C9A96E", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            BRIEF SEARCH
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: "#f5f0e8" }}>Intelligence Asset Search</h1>
          <p style={{ fontSize: 13, color: "#7e7870", marginTop: 8, lineHeight: 1.6 }}>
            Search the content library index. For Boardroom Brief orders or dossiers, use the
            delivery queue or advisory queue instead.
          </p>
        </div>
        <BriefSearch />
      </div>
    </AdminLayout>
  );
}
