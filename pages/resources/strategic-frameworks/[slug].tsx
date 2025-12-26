// pages/resources/strategic-frameworks/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Shield,
  Target,
  Layers,
  Workflow,
  Gauge,
  Scale,
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  FRAMEWORKS,
  LIBRARY_HREF,
  getAllFrameworkSlugs,
  getFrameworkBySlug,
  type Framework,
  type FrameworkTier,
} from "@/lib/resources/strategic-frameworks";
import { getInnerCircleAccess, type AccessState } from "@/lib/inner-circle/access";

const easeSettle: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easeSettle } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const ACCENTS = {
  gold: {
    ring: "ring-amber-400/25",
    border: "border-amber-400/20 hover:border-amber-400/35",
    chip: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    glow: "from-amber-500/18 via-amber-500/6 to-transparent",
    link: "text-amber-200 hover:text-amber-100",
    icon: "text-amber-200",
  },
  emerald: {
    ring: "ring-emerald-400/20",
    border: "border-emerald-400/20 hover:border-emerald-400/35",
    chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    glow: "from-emerald-500/16 via-emerald-500/6 to-transparent",
    link: "text-emerald-200 hover:text-emerald-100",
    icon: "text-emerald-200",
  },
  blue: {
    ring: "ring-sky-400/20",
    border: "border-sky-400/20 hover:border-sky-400/35",
    chip: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    glow: "from-sky-500/16 via-sky-500/6 to-transparent",
    link: "text-sky-200 hover:text-sky-100",
    icon: "text-sky-200",
  },
  rose: {
    ring: "ring-rose-400/20",
    border: "border-rose-400/20 hover:border-rose-400/35",
    chip: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    glow: "from-rose-500/16 via-rose-500/6 to-transparent",
    link: "text-rose-200 hover:text-rose-100",
    icon: "text-rose-200",
  },
  indigo: {
    ring: "ring-indigo-400/20",
    border: "border-indigo-400/20 hover:border-indigo-400/35",
    chip: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200",
    glow: "from-indigo-500/16 via-indigo-500/6 to-transparent",
    link: "text-indigo-200 hover:text-indigo-100",
    icon: "text-indigo-200",
  },
} as const;

function TierBadge({ tier }: { tier: FrameworkTier }) {
  const map: Record<FrameworkTier, { label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
    Board: { label: "Board-grade", Icon: Scale },
    Founder: { label: "Founder execution", Icon: Gauge },
    Household: { label: "Household formation", Icon: Layers },
  };
  const t = map[tier];
  const Icon = t.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/7 px-2.5 py-1 text-[11px] font-semibold text-white/80">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {t.label}
    </span>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/7 ring-1 ring-white/10">
          <Icon className="h-4 w-4 text-amber-200" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      {children}
    </div>
  );
}

type Props = {
  framework: Framework | null;
  allSlugs: string[];
};

const FrameworkDossierPage: NextPage<Props> = ({ framework, allSlugs }) => {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  // Client-side gating: show prelude immediately, then reveal full dossier if cookie exists.
  const [access, setAccess] = React.useState<AccessState>({ ok: false, reason: "missing" });

  React.useEffect(() => {
    setAccess(getInnerCircleAccess());
  }, []);

  if (router.isFallback) {
    return (
      <Layout title="Loading dossier">
        <div className="min-h-screen bg-black text-white">
          <div className="mx-auto max-w-4xl px-6 py-20">
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">Loading dossier…</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!framework) {
    return (
      <Layout title="Dossier not found">
        <Head>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="min-h-screen bg-black text-white">
          <div className="mx-auto max-w-4xl px-6 py-20">
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-8">
              <p className="font-serif text-2xl font-semibold">Dossier not found</p>
              <p className="mt-3 text-sm text-white/70">This dossier does not exist (or it has not been published yet).</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={LIBRARY_HREF}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-200"
                >
                  Back to library <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/inner-circle"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/10"
                >
                  Inner Circle <Shield className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const A = ACCENTS[framework.accent];

  const idx = allSlugs.indexOf(framework.slug);
  const prevSlug = idx > 0 ? allSlugs[idx - 1] : null;
  const nextSlug = idx >= 0 && idx < allSlugs.length - 1 ? allSlugs[idx + 1] : null;

  const canonical = `https://www.abrahamoflondon.org${LIBRARY_HREF}/${framework.slug}`;
  const isUnlocked = access.ok;

  // Use reduceMotion so it cannot be flagged unused
  const motionProps = reduceMotion ? { initial: false } : { initial: "hidden" as const };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${framework.title} — Strategic Dossier`,
    description: framework.oneLiner,
    author: { "@type": "Person", name: "Abraham of London" },
    mainEntityOfPage: canonical,
  };

  return (
    <Layout title={`${framework.title} Dossier`}>
      <Head>
        <title>{framework.title} — Dossier | Abraham of London</title>
        <meta name="description" content={framework.oneLiner} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${framework.title} — Dossier`} />
        <meta property="og:description" content={framework.oneLiner} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta name="theme-color" content="#0b0b10" />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* HERO */}
        <section className="relative isolate overflow-hidden border-b border-white/8">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[#06060b]" />
            <div className={cx("absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_55%)]")} />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.09),transparent_55%)]" />
            <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-black/75 via-black/30 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6 py-18 sm:py-22">
            <motion.div variants={stagger} {...motionProps} animate="visible">
              <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={LIBRARY_HREF}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to library
                </Link>

                <div className="flex flex-wrap items-center gap-2">
                  {framework.tier.map((t) => (
                    <TierBadge key={`${framework.slug}-${t}`} tier={t} />
                  ))}

                  <span className={cx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em]", A.chip)}>
                    <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                    {isUnlocked ? "Full dossier" : "Prelude"}
                  </span>
                </div>
              </motion.div>

              <motion.h1 variants={fadeUp} className="mt-8 font-serif text-5xl font-bold leading-[1.05] text-white sm:text-6xl">
                {framework.title}
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-5 max-w-3xl text-lg text-white/80 sm:text-xl">
                {framework.oneLiner}
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                {framework.artifactHref ? (
                  <a
                    href={framework.artifactHref}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-200"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download artifact
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}

                <Link
                  href="/consulting"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/10"
                >
                  Apply this in a Strategy Room <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <Link
                  href="/inner-circle"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/10"
                >
                  Inner Circle <Shield className="h-4 w-4" aria-hidden="true" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* BODY */}
        <section className="relative bg-[#070710] py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 lg:grid-cols-12">
              {/* MAIN */}
              <div className="space-y-8 lg:col-span-8">
                {/* Prelude (always visible) */}
                <Card title="Executive summary" icon={FileText}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-white/75">
                    {framework.executiveSummary.map((x) => (
                      <li key={x} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" aria-hidden="true" />
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card title="Use when" icon={Target}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-white/75">
                    {framework.useWhen.map((x) => (
                      <li key={x} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/55" />
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card title="Inputs" icon={Layers}>
                    <ul className="mt-2 space-y-2 text-sm leading-relaxed text-white/75">
                      {framework.inputs.map((x) => (
                        <li key={x} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/55" />
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card title="Outputs" icon={CheckCircle2}>
                    <ul className="mt-2 space-y-2 text-sm leading-relaxed text-white/75">
                      {framework.outputs.map((x) => (
                        <li key={x} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" aria-hidden="true" />
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                {/* Gating panel */}
                {!isUnlocked ? (
                  <div className="rounded-3xl border border-amber-400/20 bg-amber-400/8 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                          Prelude complete
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-white/80">
                          The full dossier includes operating logic, playbook, metrics, board questions, failure modes, and next actions.
                          This is designed for Inner Circle access: higher signal, usable artifacts, and accountability.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link
                          href="/inner-circle"
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-200"
                        >
                          Unlock via Inner Circle <Shield className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <Link
                          href="/inner-circle/resend"
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/7 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/10"
                        >
                          Resend access email <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">What you unlock</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {[
                          "Operating logic (why it works)",
                          "Application playbook (step-by-step)",
                          "Metrics + review cadence",
                          "Board questions + failure modes",
                        ].map((x) => (
                          <div key={x} className="flex items-center gap-2 text-sm text-white/80">
                            <CheckCircle2 className="h-4 w-4 text-emerald-200" aria-hidden="true" />
                            <span>{x}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Full dossier (gated) */}
                {isUnlocked ? (
                  <>
                    <Card title="Operating logic" icon={Workflow}>
                      <div className="mt-2 space-y-4">
                        {framework.operatingLogic.map((s) => (
                          <div key={s.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="font-semibold text-white">{s.title}</p>
                            <p className="mt-2 text-sm leading-relaxed text-white/75">{s.body}</p>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card title="Application playbook" icon={Gauge}>
                      <div className="mt-2 space-y-4">
                        {framework.applicationPlaybook.map((s) => (
                          <div key={s.step} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-sm font-semibold text-white">{s.step}</p>
                            <p className="mt-2 text-sm leading-relaxed text-white/75">{s.detail}</p>
                            <p className="mt-3 text-xs font-black uppercase tracking-[0.22em] text-white/55">Deliverable</p>
                            <p className="mt-1 text-sm text-white/78">{s.deliverable}</p>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card title="Failure modes" icon={AlertTriangle}>
                      <ul className="mt-2 space-y-2 text-sm leading-relaxed text-white/75">
                        {framework.failureModes.map((x) => (
                          <li key={x} className="flex gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" aria-hidden="true" />
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </>
                ) : null}
              </div>

              {/* SIDEBAR */}
              <aside className="space-y-6 lg:col-span-4">
                <div className="rounded-3xl border border-amber-400/20 bg-amber-400/8 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Canon root</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/78">{framework.canonRoot}</p>
                  <div className="mt-5">
                    <Link
                      href="/canon"
                      className={cx("inline-flex items-center gap-2 text-sm font-semibold", A.link)}
                    >
                      Enter the Canon <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                {isUnlocked ? (
                  <>
                    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-md">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">Metrics</p>
                      <div className="mt-3 space-y-3">
                        {framework.metrics.map((m) => (
                          <div key={m.metric} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="font-semibold text-white">{m.metric}</p>
                            <p className="mt-2 text-sm text-white/75">{m.whyItMatters}</p>
                            <p className="mt-3 text-xs font-black uppercase tracking-[0.22em] text-white/55">
                              Review cadence
                            </p>
                            <p className="mt-1 text-sm text-white/78">{m.reviewCadence}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-md">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">Board questions</p>
                      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/75">
                        {framework.boardQuestions.map((q) => (
                          <li key={q} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/55" />
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-md">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">What to do next</p>
                      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/75">
                        {framework.whatToDoNext.map((x) => (
                          <li key={x} className="flex gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" aria-hidden="true" />
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-5 flex flex-wrap gap-3">
                        {framework.artifactHref ? (
                          <a
                            href={framework.artifactHref}
                            className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-200"
                          >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            Artifact
                          </a>
                        ) : null}

                        <Link
                          href="/consulting"
                          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/10"
                        >
                          Strategy Room <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-md">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">
                      Full dossier access
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">
                      You are viewing the prelude. Unlock the full dossier via Inner Circle (cookie-based access).
                    </p>
                    <div className="mt-5 flex flex-col gap-2">
                      <Link
                        href="/inner-circle"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-200"
                      >
                        Unlock <Shield className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <Link
                        href="/inner-circle/resend"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/7 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/10"
                      >
                        Resend access email <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Prev / Next */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-md">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">Navigate</p>
                  <div className="mt-3 grid gap-2">
                    {prevSlug ? (
                      <Link
                        href={`${LIBRARY_HREF}/${prevSlug}`}
                        className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white/85 transition hover:border-white/20"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                          Previous dossier
                        </span>
                        <ChevronRight className="h-4 w-4 rotate-180 opacity-70" aria-hidden="true" />
                      </Link>
                    ) : null}

                    {nextSlug ? (
                      <Link
                        href={`${LIBRARY_HREF}/${nextSlug}`}
                        className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white/85 transition hover:border-white/20"
                      >
                        <span className="inline-flex items-center gap-2">
                          Next dossier <ChevronRight className="h-4 w-4 opacity-70" aria-hidden="true" />
                        </span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    ) : null}

                    <Link
                      href={LIBRARY_HREF}
                      className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white/85 transition hover:border-white/20"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Shield className="h-4 w-4" aria-hidden="true" />
                        Back to library
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-70" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* FINAL STRIP */}
        <section className="border-t border-white/10 bg-gradient-to-r from-amber-300 to-amber-500 py-14 text-center">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="font-serif text-3xl font-bold text-black sm:text-4xl">
              Build, don&apos;t drift.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-black/85 sm:text-lg">
              For boards: mandate + governance artifacts. For founders: execution cadence. For households: formation and order.
              Bring this into a Strategy Room if you want it applied to real decisions with clean deliverables.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/consulting"
                className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              >
                Request a Strategy Room <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/inner-circle"
                className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-transparent px-8 py-4 font-semibold text-black transition hover:bg-black hover:text-white"
              >
                Unlock full dossiers <Shield className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default FrameworkDossierPage;

// -----------------------------------------------------------------------------
// SSG
// -----------------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: getAllFrameworkSlugs().map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slug = String(ctx.params?.slug || "");
  const framework = getFrameworkBySlug(slug);

  // Keep a stable ordering identical to FRAMEWORKS.
  const allSlugs = FRAMEWORKS.map((f) => f.slug);

  return { props: { framework, allSlugs } };
};
