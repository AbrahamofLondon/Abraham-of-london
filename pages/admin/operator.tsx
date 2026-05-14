import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ShieldAlert,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import type {
  OperatorCommandCentreSummary,
  OperatorMetricTone,
  OperatorQueueCard,
} from "@/lib/admin/operator-command-centre";

type PageProps = {
  summary: OperatorCommandCentreSummary;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const { buildOperatorCommandCentreSummary } = await import("@/lib/admin/operator-command-centre");
  const summary = await buildOperatorCommandCentreSummary();

  return { props: { summary } };
};

function toneClass(tone?: OperatorMetricTone): string {
  switch (tone) {
    case "risk":
      return "text-rose-300";
    case "attention":
      return "text-amber-300";
    case "good":
      return "text-emerald-300";
    default:
      return "text-white";
  }
}

function priorityBorder(priority: OperatorQueueCard["priority"], status: OperatorQueueCard["status"]): string {
  if (status === "unavailable") return "border-white/10";
  if (priority === "risk") return "border-rose-500/25";
  if (priority === "attention") return "border-amber-500/20";
  return "border-white/10";
}

function MetricValue({ value }: { value: number | null }) {
  return <>{typeof value === "number" ? value : "Unavailable"}</>;
}

function HeadlineCard({
  label,
  value,
  detail,
  tone,
}: OperatorCommandCentreSummary["headlines"][number]) {
  return (
    <section className="border border-white/10 bg-zinc-950/70 p-4">
      <p className="text-[8px] font-mono uppercase tracking-[0.24em] text-white/35">{label}</p>
      <p className={`mt-3 text-2xl font-light ${toneClass(tone)}`}>
        <MetricValue value={value} />
      </p>
      <p className="mt-1 text-[10px] text-white/35">{detail}</p>
    </section>
  );
}

function QueueCard({ card }: { card: OperatorQueueCard }) {
  return (
    <section className={`border ${priorityBorder(card.priority, card.status)} bg-zinc-950/70 p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[8px] font-mono uppercase tracking-[0.24em] text-white/35">
            {card.status === "available" ? "Connected" : "Not yet connected"}
          </p>
          <h2 className="mt-2 font-serif text-xl text-white">{card.title}</h2>
          <p className="mt-2 max-w-xl text-sm text-white/50">{card.description}</p>
        </div>
        {card.priority === "risk" ? (
          <ShieldAlert className="h-5 w-5 shrink-0 text-rose-300/70" />
        ) : card.priority === "attention" ? (
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300/70" />
        ) : (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300/60" />
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {card.metrics.map((item) => (
          <div key={`${card.id}-${item.label}`} className="border border-white/5 bg-black/20 p-3">
            <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/30">{item.label}</p>
            <p className={`mt-2 text-lg font-light ${toneClass(item.tone)}`}>
              <MetricValue value={item.value} />
            </p>
            {item.detail ? <p className="mt-1 text-[10px] text-white/30">{item.detail}</p> : null}
          </div>
        ))}
      </div>

      {card.note ? <p className="mt-4 text-xs text-white/35">{card.note}</p> : null}

      <Link
        href={card.href}
        className="mt-5 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/55 transition-colors hover:border-amber-500/25 hover:text-amber-200"
      >
        Open surface
        <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}

export default function OperatorCommandCentrePage({
  summary,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const generatedAt = new Date(summary.generatedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <AdminLayout title="Operator Command Centre">
      <Head>
        <title>Operator Command Centre | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-amber-500/80" />
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">
                  Operator Command Centre
                </p>
              </div>
              <h1 className="mt-3 font-serif text-3xl text-white">Today&apos;s operational queues</h1>
              <p className="mt-2 max-w-3xl text-sm text-white/55">
                A compact operator cockpit for overdue work, blocked records, safe approvals, and escalation risk. Specialist surfaces remain the source of action.
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-2 border border-white/10 bg-black/20 px-3 py-2 md:flex">
              <Clock3 className="h-3.5 w-3.5 text-white/30" />
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/35">
                {generatedAt}
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          {summary.headlines.map((item) => (
            <HeadlineCard key={item.label} {...item} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          {summary.cards.map((card) => (
            <QueueCard key={card.id} card={card} />
          ))}
        </section>
      </div>
    </AdminLayout>
  );
}
