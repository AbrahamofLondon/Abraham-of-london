/* pages/inner-circle/admin/reports/index.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Layout from "@/components/Layout";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import ReportQueueTable from "@/components/admin/reports/ReportQueueTable";

type Props = {
  reports: any[];
  telemetry: {
    diagnosticsLast100: number;
    reportsLast100: number;
    paid: number;
    queued: number;
    inProgress: number;
    delivered: number;
  };
};

const Page: NextPage<Props> = ({ reports, telemetry }) => {
  return (
    <Layout title="Admin Reports Queue" className="bg-black">
      <main className="min-h-screen bg-black px-8 py-12 text-slate-200">
        <header className="mb-10 border-l-4 border-blue-600 pl-6">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
            Reports <span className="text-blue-600">Command</span>
          </h1>
          <p className="mt-2 text-xs font-mono uppercase tracking-widest text-slate-500">
            diagnostic telemetry → paid queue → delivery engine
          </p>
        </header>

        <section className="mb-10 grid gap-4 md:grid-cols-6">
          {[
            ["Diagnostics", telemetry.diagnosticsLast100],
            ["Reports", telemetry.reportsLast100],
            ["Paid", telemetry.paid],
            ["Queued", telemetry.queued],
            ["In Progress", telemetry.inProgress],
            ["Delivered", telemetry.delivered],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {label}
              </div>
              <div className="mt-3 text-3xl font-serif text-white">{value as any}</div>
            </div>
          ))}
        </section>

        <ReportQueueTable rows={reports} />
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const sessionId = readAccessCookie(context.req as any);
  if (!sessionId) {
    return {
      redirect: {
        destination: "/inner-circle",
        permanent: false,
      },
    };
  }

  const ctx = await getSessionContext(sessionId);
  if (!ctx.ok || !ctx.valid || !tierAtLeast(ctx.tier, "sovereign")) {
    return {
      redirect: {
        destination: "/inner-circle/locked",
        permanent: false,
      },
    };
  }

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://www.abrahamoflondon.org";

  const cookie = context.req.headers.cookie || "";
  const resp = await fetch(`${base}/api/admin/reports`, {
    headers: { cookie },
  });
  const json = await resp.json();

  return {
    props: {
      reports: json?.reports || [],
      telemetry:
        json?.telemetry || {
          diagnosticsLast100: 0,
          reportsLast100: 0,
          paid: 0,
          queued: 0,
          inProgress: 0,
          delivered: 0,
        },
    },
  };
};

export default Page;

