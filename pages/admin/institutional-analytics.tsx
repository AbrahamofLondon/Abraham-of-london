import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import AdminLayout from "@/components/admin/AdminLayout";

const AnalyticsDashboard = dynamic(
  () => import("@/components/analytics/AnalyticsDashboard").then((m) => m.AnalyticsDashboard),
  { ssr: false },
);

type Props = { authenticated: boolean };

const InstitutionalAnalyticsPage: NextPage<Props> = ({ authenticated }) => {
  if (!authenticated) {
    return (
      <AdminLayout title="Institutional Analytics">
        <p className="text-white/60">Admin access required.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Institutional Analytics">
      <Head>
        <title>Institutional Analytics | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <AnalyticsDashboard />
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { requireAdminPage } = await import("@/lib/access/server");
  const adminCheck = await requireAdminPage(ctx);
  if ("redirect" in adminCheck) return adminCheck as any;
  return { props: { authenticated: true } };
};

export default InstitutionalAnalyticsPage;
