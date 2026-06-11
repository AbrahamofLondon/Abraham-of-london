/**
 * pages/admin/dev/session.tsx — Session Debugger (dev-only)
 *
 * Shows access matrix and identity hash for the current session.
 * SessionDebugger component already returns null in production
 * (process.env.NODE_ENV !== "development" guard).
 * This page is admin-guarded and not listed in normal admin navigation.
 */

import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import { SessionDebugger } from "@/components/dashboard/admin/SessionDebugger";
import { resolvePageAccess } from "@/lib/access/server";

type AolSession = {
  tier?: string;
  innerCircleAccess?: boolean;
  allowPrivate?: boolean;
  emailHash?: string;
};

type PageProps = { aol: AolSession };

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;

  const { session } = await resolvePageAccess(ctx);
  const aol: AolSession = {
    tier: (session as any)?.aol?.tier ?? "unknown",
    innerCircleAccess: (session as any)?.aol?.innerCircleAccess ?? false,
    allowPrivate: (session as any)?.aol?.allowPrivate ?? false,
    emailHash: (session as any)?.aol?.emailHash ?? null,
  };

  return { props: { aol } };
};

export default function AdminDevSessionPage({
  aol,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout>
      <Head>
        <title>Session Debugger | Admin Dev</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ padding: "24px 32px", maxWidth: 800 }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#C9A96E", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            DEV ONLY
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: "#f5f0e8" }}>Session Debugger</h1>
        </div>
        {process.env.NODE_ENV !== "development" ? (
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#5e5850" }}>
            Session Debugger is only available in development mode.
          </p>
        ) : (
          <SessionDebugger aol={aol} />
        )}
      </div>
    </AdminLayout>
  );
}
