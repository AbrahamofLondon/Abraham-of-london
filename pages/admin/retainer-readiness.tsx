import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";

const SCORECARD = [
  ["Enterprise Control Room", "CLIENT_SAFE_VISIBLE", "Sponsor-safe command state exists, but portfolio exposure remains internal only."],
  ["Portfolio memory", "CONTRACT_ONLY", "Pattern memory exists but should remain gated and largely internal until entitlement and suppression controls are stronger."],
  ["Counsel workflow", "OPERATOR_VISIBLE", "Cumulative counsel status is now visible to buyers, but operator role controls are still env-driven."],
  ["Boardroom archive", "CLIENT_SAFE_VISIBLE", "Archive summary is visible as retained memory without exposing generation internals."],
  ["Scheduler-backed cadence", "LOADER_READY", "Cadence state is visible, but manual review is still the honest default in most cases."],
  ["Institutional memory archive", "CUMULATIVE_MEMORY_VISIBLE", "Cycle memory, checkpoint history, and escalation continuity are now visible."],
  ["Sponsor-safe reporting", "SPONSOR_SAFE_VISIBLE", "Retained Oversight Command now composes sponsor-safe command visibility."],
  ["Commercial defensibility", "SELECTIVELY_DEFENSIBLE", "£5k and selective £15k are supported. £50k remains operator-led only."],
];

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect;
  return { props: {} };
};

export default function RetainerReadinessPage(
  _props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <AdminLayout title="Retainer Readiness">
      <Head>
        <title>Retainer Readiness | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">Retainer discipline</p>
          <h1 className="mt-3 font-serif text-3xl text-white">Selective readiness only</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/55">
            Current product truth: retained oversight is selectively defensible for controlled high-value conversations, but not for a generalised £50k claim.
          </p>
        </section>

        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Current classification</p>
              <p className="mt-2 text-xl text-white">SELECTIVE_15K_READY</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Can be sold now</p>
              <p className="mt-2 text-xl text-white">£5k foundation</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Operator warning</p>
              <p className="mt-2 text-xl text-white">No public £50k claim</p>
            </div>
          </div>
        </section>

        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">Readiness scorecard</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm text-white/70">
              <thead className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
                <tr>
                  <th className="pb-3 pr-4">Area</th>
                  <th className="pb-3 pr-4">State</th>
                  <th className="pb-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {SCORECARD.map(([area, state, note]) => (
                  <tr key={area} className="border-t border-white/5 align-top">
                    <td className="py-3 pr-4 text-white">{area}</td>
                    <td className="py-3 pr-4 text-amber-200/80">{state}</td>
                    <td className="py-3">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

