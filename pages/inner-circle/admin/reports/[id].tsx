/* pages/inner-circle/admin/reports/[id].tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Layout from "@/components/Layout";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import ReportBuilderForm from "@/components/admin/reports/ReportBuilderForm";

type Props = {
  item: any;
};

const Page: NextPage<Props> = ({ item }) => {
  return (
    <Layout title={`Report ${item.reference}`} className="bg-black">
      <main className="min-h-screen bg-black px-8 py-12 text-slate-200">
        <header className="mb-10 border-b border-slate-800 pb-8">
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-500">
            {item.reference}
          </div>
          <h1 className="mt-3 text-4xl font-serif text-white">{item.title}</h1>
          <p className="mt-3 text-sm text-slate-400">
            Client: {item.userEmail || "—"} • Status: {item.status}
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <aside className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Package
                </div>
                <div className="mt-1">{item.packageKey}</div>
              </div>

              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Diagnostic Type
                </div>
                <div className="mt-1">{item.diagnosticType || "—"}</div>
              </div>

              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Diagnostic Record
                </div>
                <div className="mt-1">{item.diagnosticRecordId || "—"}</div>
              </div>

              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Amount
                </div>
                <div className="mt-1">£{item.amountGbp}</div>
              </div>

              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Notes
                </div>
                <div className="mt-1 whitespace-pre-wrap text-slate-400">
                  {item.notes || "—"}
                </div>
              </div>
            </div>
          </aside>

          <ReportBuilderForm item={item} />
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const sessionId = readAccessCookie(context.req as any);
  if (!sessionId) {
    return {
      redirect: { destination: "/inner-circle", permanent: false },
    };
  }

  const ctx = await getSessionContext(sessionId);
  if (!ctx.ok || !ctx.valid || !tierAtLeast(ctx.tier, "sovereign")) {
    return {
      redirect: { destination: "/inner-circle/locked", permanent: false },
    };
  }

  const id = typeof context.params?.id === "string" ? context.params.id : "";
  if (!id) return { notFound: true };

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://www.abrahamoflondon.org";

  const cookie = context.req.headers.cookie || "";
  const resp = await fetch(`${base}/api/admin/reports/${id}`, {
    headers: { cookie },
  });
  const json = await resp.json();

  if (!resp.ok || !json?.item) return { notFound: true };

  return {
    props: {
      item: json.item,
    },
  };
};

export default Page;

