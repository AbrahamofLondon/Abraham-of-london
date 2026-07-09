import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Copy, FileText, LockKeyhole, ShieldCheck } from "lucide-react";
import type { GmiEditionPublicContract } from "@/lib/intelligence/gmi-public-edition-contract";

type Props = {
  edition: GmiEditionPublicContract;
};

function shortHash(value: string | null): string {
  return value ? `${value.slice(0, 10)}...${value.slice(-6)}` : "Not public";
}

function formatDate(value: string | null): string {
  if (!value) return "Not published";
  const d = new Date(value);
  return Number.isFinite(d.getTime())
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : value;
}

function StatusPill({ edition }: Props) {
  const label = edition.isCurrent ? "Current Edition" : edition.lifecycleState === "SUPERSEDED" ? "Superseded Edition" : edition.lifecycleState;
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A96E]/35 bg-[#C9A96E]/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[#E6C98C]">
      <ShieldCheck className="h-4 w-4" aria-hidden />
      {label}
    </div>
  );
}

function CheckoutForm({ edition }: Props) {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = React.useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edition.commerce.checkoutEligible || state === "submitting") return;
    setError("");
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Enter an email address to attach access.");
      return;
    }
    setState("submitting");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          productCode: edition.commerce.productCode,
          contentId: `global-market-intelligence-report-${edition.shortTitle.toLowerCase().replace(/\s+/g, "-")}`,
          originPath: `/intelligence/${edition.slug}`,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.url) {
        throw new Error(data?.reason || data?.error || "Checkout could not be created.");
      }
      window.location.href = data.url;
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Checkout could not be created.");
    }
  }

  if (!edition.commerce.checkoutEligible) {
    return (
      <div className="rounded border border-white/10 bg-white/[0.035] p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">Reference edition</p>
        <p className="mt-3 text-sm leading-6 text-white/62">
          This edition is retained for accountability and historical access. New purchases route to the current edition.
        </p>
        <Link href={edition.archiveContext.currentEdition.href} className="mt-5 inline-flex items-center gap-2 rounded bg-[#C9A96E] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#E6C98C]">
          View current edition <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded border border-[#C9A96E]/30 bg-[#C9A96E]/10 p-5" aria-describedby="gmi-checkout-help gmi-checkout-error">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E6C98C]">Get {edition.shortTitle}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{edition.commerce.priceLabel}</p>
      <p id="gmi-checkout-help" className="mt-2 text-sm leading-6 text-white/62">
        Current edition access. Checkout binds product family, edition ID and release proof to {edition.editionId}.
      </p>
      <label htmlFor="gmi-checkout-email" className="mt-5 block text-sm font-medium text-white/80">
        Email for access
      </label>
      <input
        id="gmi-checkout-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="mt-2 min-h-12 w-full rounded border border-white/15 bg-black/50 px-4 py-3 text-base text-white outline-none transition focus:border-[#E6C98C] focus:ring-2 focus:ring-[#E6C98C]/30"
        required
      />
      {error ? <p id="gmi-checkout-error" className="mt-3 text-sm text-red-200" role="alert">{error}</p> : <span id="gmi-checkout-error" className="sr-only" />}
      <button
        type="submit"
        disabled={state === "submitting"}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded bg-[#C9A96E] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#E6C98C] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "submitting" ? "Creating checkout..." : `Purchase ${edition.shortTitle}`}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}

export default function GmiEditionLandingPage({ edition }: Props) {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 px-6 pb-16 pt-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            <StatusPill edition={edition} />
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-[#C9A96E]/80">{edition.hero.eyebrow}</p>
            <h1 className="mt-5 max-w-5xl font-serif text-5xl leading-[0.98] text-white md:text-7xl">{edition.hero.headline}</h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-white/68">{edition.hero.deck}</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/55">
              <span>Published {formatDate(edition.publishedAt)}</span>
              <span className="text-white/25">/</span>
              <span>{edition.periodStart} to {edition.periodEnd}</span>
              <span className="text-white/25">/</span>
              <span>Method {edition.methodologyVersion}</span>
            </div>
          </div>
          <aside className="rounded border border-white/10 bg-white/[0.03] p-5">
            <CheckoutForm edition={edition} />
          </aside>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#C9A96E]">Decision proposition</p>
            <h2 className="mt-4 font-serif text-4xl text-white">Judgement under conflicting signals.</h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-white/68">
            <p>{edition.executiveSummary}</p>
            <p><strong className="text-white">Primary buyer:</strong> {edition.hero.primaryBuyer}</p>
            <p><strong className="text-white">Market regime:</strong> {edition.marketRegime.label}. {edition.marketRegime.summary}</p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#C9A96E]">Headline intelligence</p>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {edition.headlineSignals.map((signal) => (
              <article key={signal.signal} className="rounded border border-white/10 bg-black/30 p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Confidence {signal.confidence}</p>
                <h3 className="mt-3 text-xl font-semibold text-white">{signal.signal}</h3>
                <p className="mt-4 text-sm leading-6 text-white/62"><strong className="text-white/82">Evidence:</strong> {signal.observedEvidence}</p>
                <p className="mt-3 text-sm leading-6 text-white/62"><strong className="text-white/82">Interpretation:</strong> {signal.interpretation}</p>
                <p className="mt-3 text-sm leading-6 text-white/62"><strong className="text-white/82">Consequence:</strong> {signal.businessConsequence}</p>
                <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-white/45">Would change if: {signal.falsificationTrigger}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#C9A96E]">What this changes for boards and operators</p>
          <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {edition.boardConsequences.map((item) => (
              <div key={`${item.area}-${item.timing}`} className="rounded border border-white/10 p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#E6C98C]">{item.area}</p>
                <p className="mt-3 text-sm leading-6 text-white/68">{item.consequence}</p>
                <p className="mt-3 text-xs text-white/40">Timing: {item.timing}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#090907] px-6 py-14">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="rounded border border-[#C9A96E]/25 bg-[#C9A96E]/[0.06] p-6">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#C9A96E]">Falsification discipline</p>
            <h2 className="mt-4 font-serif text-4xl text-white">What would prove this edition wrong.</h2>
            <p className="mt-5 text-sm leading-7 text-white/65"><strong className="text-white">Current belief:</strong> {edition.falsificationSummary.currentBelief}</p>
            <p className="mt-3 text-sm leading-7 text-white/65"><strong className="text-white">Evidence basis:</strong> {edition.falsificationSummary.evidenceBasis}</p>
            <p className="mt-3 text-sm leading-7 text-white/65"><strong className="text-white">Would change if:</strong> {edition.falsificationSummary.wouldChangeIf}</p>
            <p className="mt-3 text-sm leading-7 text-white/65"><strong className="text-white">Review:</strong> {edition.falsificationSummary.reviewCadence}</p>
          </div>
          <div className="grid gap-4">
            {edition.thesisCards.map((card) => (
              <div key={card.thesis} className="rounded border border-white/10 bg-black/25 p-5">
                <h3 className="text-lg font-semibold text-white">{card.thesis}</h3>
                <p className="mt-3 text-sm leading-6 text-white/62">{card.evidence}</p>
                <p className="mt-3 text-sm leading-6 text-white/62">{card.implication}</p>
                <p className="mt-3 text-xs text-white/42">Review trigger: {card.reviewTrigger}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          <div className="rounded border border-white/10 p-5">
            <FileText className="h-5 w-5 text-[#C9A96E]" aria-hidden />
            <h3 className="mt-4 text-lg font-semibold">Product contents</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/62">
              <li>Full intelligence report and board-ready synthesis</li>
              <li>Decision implications and evidence appendix</li>
              <li>Falsification framework and release proof</li>
              <li>Edition-specific PDF/digital access where available</li>
            </ul>
          </div>
          <div className="rounded border border-white/10 p-5">
            <LockKeyhole className="h-5 w-5 text-[#C9A96E]" aria-hidden />
            <h3 className="mt-4 text-lg font-semibold">Evidence and methodology</h3>
            <p className="mt-4 text-sm leading-6 text-white/62">{edition.methodology.callReview}</p>
            <p className="mt-3 text-sm leading-6 text-white/62">{edition.methodology.falsification}</p>
            <p className="mt-3 text-sm leading-6 text-white/62">{edition.methodology.boundary}</p>
          </div>
          <div className="rounded border border-white/10 p-5">
            <CheckCircle2 className="h-5 w-5 text-[#C9A96E]" aria-hidden />
            <h3 className="mt-4 text-lg font-semibold">Release proof</h3>
            <dl className="mt-4 space-y-3 text-sm text-white/62">
              <div><dt className="text-white/38">Receipt</dt><dd>{edition.releaseProof.receiptRef ?? "Not public"}</dd></div>
              <div><dt className="text-white/38">Candidate</dt><dd>{shortHash(edition.releaseProof.candidateHash)}</dd></div>
              <div><dt className="text-white/38">Report hash</dt><dd>{shortHash(edition.releaseProof.reportContentHash)}</dd></div>
              <div><dt className="text-white/38">PDF hash</dt><dd>{shortHash(edition.releaseProof.pdfHash)}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#C9A96E]">Archive and accountability</p>
            <p className="mt-3 text-sm text-white/58">Superseded editions remain public so calls, changes and learning remain inspectable.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {edition.archiveContext.previousEdition ? (
              <Link href={edition.archiveContext.previousEdition.href} className="inline-flex items-center gap-2 rounded border border-white/12 px-4 py-3 text-sm text-white/70 hover:text-white">
                Previous edition <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
            {!edition.isCurrent ? (
              <Link href={edition.archiveContext.currentEdition.href} className="inline-flex items-center gap-2 rounded border border-[#C9A96E]/35 px-4 py-3 text-sm text-[#E6C98C] hover:text-white">
                Current edition <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
            {edition.pdf.available && edition.pdf.downloadPath ? (
              <Link href={edition.pdf.downloadPath} className="inline-flex items-center gap-2 rounded border border-white/12 px-4 py-3 text-sm text-white/70 hover:text-white">
                PDF access <Copy className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}