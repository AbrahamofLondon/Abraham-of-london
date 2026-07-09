import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, LockKeyhole } from "lucide-react";
import type { GmiEditionPublicContract } from "@/lib/intelligence/gmi-public-edition-contract";

type Props = { edition: GmiEditionPublicContract };

const ink = "#091017";
const paper = "#F1EEE6";
const warm = "#FAF8F3";
const brass = "#B59258";

function shortHash(value: string | null): string {
  return value ? `${value.slice(0, 12)}...${value.slice(-8)}` : "Not public";
}

function formatDate(value: string | null): string {
  if (!value) return "Not published";
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : value;
}

function editionStateLabel(edition: GmiEditionPublicContract): string {
  if (edition.isCurrent) return "Current authorised edition";
  if (edition.lifecycleState === "SUPERSEDED") return "Reference edition";
  return edition.lifecycleState.replace(/_/g, " ");
}

function ClassificationStamp({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center border px-3 py-1 font-mono text-[12px] uppercase tracking-[0.18em] ${dark ? "border-white/20 text-white/62" : "border-[#B59258]/35 text-[#5D503A]"}`}>
      {children}
    </span>
  );
}

function RegimeFingerprint({ edition }: Props) {
  return (
    <div className="border border-white/12 bg-white/[0.035] p-5" aria-label="Regime Fingerprint structured summary">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-white/55">Regime Fingerprint</p>
        <span className="font-mono text-[12px] text-[#D7BC84]">{edition.shortTitle}</span>
      </div>
      <div className="mt-6 space-y-5">
        {edition.regimeFingerprint.map((axis) => {
          const delta = axis.previousValue == null ? null : axis.value - axis.previousValue;
          return (
            <div key={axis.axis}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-medium text-white/82">{axis.axis}</p>
                <p className="font-mono text-[12px] text-white/52">
                  {axis.value}/100 {delta == null ? "baseline" : `${delta >= 0 ? "+" : ""}${delta}`}
                </p>
              </div>
              <div className="mt-2 h-2 bg-white/10" aria-hidden>
                <div className="h-full bg-[#B59258]" style={{ width: `${Math.max(4, Math.min(100, axis.value))}%` }} />
              </div>
              <p className="mt-2 text-sm leading-6 text-white/55">{axis.definition} Confidence: {axis.confidence.toLowerCase()}.</p>
            </div>
          );
        })}
      </div>
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
      if (!response.ok || !data?.url) throw new Error(data?.reason || data?.error || "Checkout could not be created.");
      window.location.href = data.url;
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Checkout could not be created.");
    }
  }

  if (!edition.commerce.checkoutEligible) {
    return (
      <div className="border border-white/14 bg-white/[0.035] p-5">
        <ClassificationStamp dark>Reference record</ClassificationStamp>
        <p className="mt-4 text-sm leading-7 text-white/64">This edition remains public as part of the accountability archive. New acquisition routes to the current authorised edition.</p>
        <Link href={edition.archiveContext.currentEdition.href} className="mt-5 inline-flex min-h-11 items-center gap-2 bg-[#B59258] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#D7BC84]">
          Go to current edition <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-[#B59258]/40 bg-[#B59258]/10 p-5" aria-describedby="gmi-checkout-help gmi-checkout-error">
      <ClassificationStamp dark>Current acquisition</ClassificationStamp>
      <p className="mt-5 text-3xl font-semibold text-white">{edition.commerce.priceLabel}</p>
      <p id="gmi-checkout-help" className="mt-3 text-sm leading-7 text-white/64">Checkout binds the GMI family, {edition.editionId}, price authority and release receipt. No ambiguous edition purchase.</p>
      <label htmlFor="gmi-checkout-email" className="mt-5 block text-sm font-medium text-white/82">Email for access</label>
      <input id="gmi-checkout-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full border border-white/18 bg-black/45 px-4 py-3 text-base text-white outline-none transition focus:border-[#D7BC84] focus:ring-2 focus:ring-[#D7BC84]/30" required />
      {error ? <p id="gmi-checkout-error" className="mt-3 text-sm text-red-200" role="alert">{error}</p> : <span id="gmi-checkout-error" className="sr-only" />}
      <button type="submit" disabled={state === "submitting"} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[#B59258] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#D7BC84] disabled:cursor-not-allowed disabled:opacity-60">
        {state === "submitting" ? "Creating checkout..." : `Acquire ${edition.shortTitle}`}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}

export default function GmiEditionLandingPage({ edition }: Props) {
  return (
    <main className="min-h-screen bg-[#091017] text-white">
      <section className="px-6 pb-12 pt-28" style={{ backgroundColor: ink }}>
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <ClassificationStamp dark>{editionStateLabel(edition)}</ClassificationStamp>
              <ClassificationStamp dark>{edition.readerAccessState.replace(/_/g, " ")}</ClassificationStamp>
            </div>
            <p className="mt-8 font-mono text-[13px] uppercase tracking-[0.24em] text-[#D7BC84]">Global Market Intelligence / {edition.shortTitle}</p>
            <h1 className="mt-5 max-w-5xl font-serif text-5xl leading-[0.98] text-white md:text-7xl">{edition.hero.headline}</h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-white/70">{edition.hero.deck}</p>
            <dl className="mt-8 grid gap-3 font-mono text-[12px] uppercase tracking-[0.14em] text-white/55 sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="text-white/35">Published</dt><dd>{formatDate(edition.publishedAt)}</dd></div>
              <div><dt className="text-white/35">Data lock</dt><dd>{edition.evidenceSummary.sourceSnapshotHash ? "Release locked" : "Reference"}</dd></div>
              <div><dt className="text-white/35">Method</dt><dd>{edition.methodologyVersion}</dd></div>
            </dl>
          </div>
          <RegimeFingerprint edition={edition} />
        </div>
      </section>

      <section className="px-6 py-16 text-[#11161C]" style={{ backgroundColor: paper }}>
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[#7A6A4C]">The quarter in one sentence</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">{edition.quarterInOneSentence}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries({ "What changed": edition.quarterDelta.whatChanged, "What held": edition.quarterDelta.whatHeld, "What surprised us": edition.quarterDelta.whatSurprisedUs, "What now matters": edition.quarterDelta.whatNowMatters }).map(([label, value]) => (
              <div key={label} className="border-t border-[#B59258]/45 pt-4">
                <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-[#7A6A4C]">{label}</p>
                <p className="mt-3 text-base leading-7 text-[#343A40]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16" style={{ backgroundColor: "#11161C" }}>
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[#D7BC84]">Key calls</p>
          <div className="mt-8 space-y-5">
            {edition.headlineSignals.map((signal, index) => (
              <article key={signal.signal} className="grid gap-5 border border-white/12 bg-black/20 p-5 lg:grid-cols-[0.18fr_0.82fr]">
                <div className="font-mono text-[13px] text-[#D7BC84]">CALL {String(index + 1).padStart(2, "0")}</div>
                <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                  <div>
                    <h3 className="font-serif text-2xl text-white">{signal.signal}</h3>
                    <p className="mt-4 text-sm leading-7 text-white/65"><strong className="text-white/88">Observed:</strong> {signal.observedEvidence}</p>
                    <p className="mt-3 text-sm leading-7 text-white/65"><strong className="text-white/88">Our reading:</strong> {signal.interpretation}</p>
                  </div>
                  <div className="border-l border-white/10 pl-5">
                    <p className="text-sm leading-7 text-white/65"><strong className="text-white/88">Decision consequence:</strong> {signal.businessConsequence}</p>
                    <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[#D7BC84]">Confidence {signal.confidence}</p>
                    <p className="mt-3 text-sm leading-7 text-white/55">Changes our view if: {signal.falsificationTrigger}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-[#11161C]" style={{ backgroundColor: warm }}>
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[#7A6A4C]">What changed since the last edition</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {edition.crossEditionDeltas.map((delta) => (
              <article key={delta.priorPosition} className="border border-[#11161C]/15 bg-white/45 p-5">
                <ClassificationStamp>{delta.movement}</ClassificationStamp>
                <p className="mt-4 text-sm leading-7"><strong>Prior:</strong> {delta.priorPosition}</p>
                <p className="mt-2 text-sm leading-7"><strong>What happened:</strong> {delta.whatHappened}</p>
                <p className="mt-2 text-sm leading-7"><strong>Current:</strong> {delta.currentPosition}</p>
                <p className="mt-3 text-sm leading-7 text-[#343A40]">{delta.reason}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16" style={{ backgroundColor: "#11161C" }}>
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[#D7BC84]">Board consequence matrix</p>
          <div className="mt-8 grid gap-4">
            {edition.consequenceMatrix.map((row) => (
              <article key={row.decisionDomain} className="grid gap-5 border border-white/12 bg-black/20 p-5 lg:grid-cols-[0.35fr_0.65fr]">
                <div>
                  <h3 className="font-serif text-2xl text-white">{row.decisionDomain}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/62">{row.publicDiagnostic}</p>
                  <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.16em] text-white/45">{row.timeHorizon} / {row.confidence}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#D7BC84]">Public implication</p><p className="mt-2 text-sm leading-7 text-white/62">{row.publicImplication}</p></div>
                  <div className="border border-[#B59258]/25 bg-[#B59258]/10 p-4">
                    <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#D7BC84]">Proprietary analysis / licensed reader access</p>
                    <p className="mt-2 text-sm leading-7 text-white/58">The full action vector, trigger, risk of inaction and evidence chain are reserved for entitled readers.</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-[#11161C]" style={{ backgroundColor: paper }}>
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[#7A6A4C]">Underlying intelligence</p>
            <h2 className="mt-4 font-serif text-4xl">The Vault citation loop</h2>
            <p className="mt-5 text-base leading-8 text-[#343A40]">The quarterly edition is the synthesis layer. Specialist briefs remain governed by their own publication and access state.</p>
          </div>
          <div className="space-y-3">
            {edition.supportingBriefs.length ? edition.supportingBriefs.map((brief) => (
              <div key={brief.ref} className="border border-[#11161C]/15 bg-white/40 p-4">
                <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#7A6A4C]">{brief.ref} / {brief.publicationState}</p>
                <h3 className="mt-2 text-lg font-semibold">{brief.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#343A40]">{brief.relationship}</p>
              </div>
            )) : <p className="text-base leading-8 text-[#343A40]">This historical edition is linked through the successor review rather than active brief citations.</p>}
          </div>
        </div>
      </section>

      <section className="px-6 py-16" style={{ backgroundColor: ink }}>
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[#D7BC84]">What would prove us wrong</p>
            <h2 className="mt-4 font-serif text-4xl text-white">Falsification ledger</h2>
            <p className="mt-5 text-sm leading-7 text-white/65"><strong className="text-white">Current belief:</strong> {edition.falsificationSummary.currentBelief}</p>
            <p className="mt-3 text-sm leading-7 text-white/65"><strong className="text-white">Evidence basis:</strong> {edition.falsificationSummary.evidenceBasis}</p>
            <p className="mt-3 text-sm leading-7 text-white/65"><strong className="text-white">We reconsider if:</strong> {edition.falsificationSummary.wouldChangeIf}</p>
          </div>
          <div className="space-y-4">
            {edition.thesisCards.map((card, index) => (
              <article key={card.thesis} className="border border-white/12 bg-white/[0.035] p-5">
                <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#D7BC84]">Thesis {String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-xl font-semibold text-white">{card.thesis}</h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{card.evidence}</p>
                <p className="mt-3 text-sm leading-7 text-white/62">Watch: {card.reviewTrigger}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-[#11161C]" style={{ backgroundColor: warm }}>
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          <div className="border border-[#11161C]/15 p-5"><FileText className="h-5 w-5 text-[#7A6A4C]" aria-hidden /><h3 className="mt-4 text-xl font-semibold">Evidence receipt</h3><dl className="mt-4 space-y-3 text-sm"><div><dt>Receipt</dt><dd className="font-mono text-[12px]">{edition.releaseProof.receiptRef ?? "Reference"}</dd></div><div><dt>Candidate</dt><dd className="font-mono text-[12px]">{shortHash(edition.releaseProof.candidateHash)}</dd></div><div><dt>Report hash</dt><dd className="font-mono text-[12px]">{shortHash(edition.releaseProof.reportContentHash)}</dd></div><div><dt>PDF hash</dt><dd className="font-mono text-[12px]">{shortHash(edition.releaseProof.pdfHash)}</dd></div></dl></div>
          <div className="border border-[#11161C]/15 p-5"><LockKeyhole className="h-5 w-5 text-[#7A6A4C]" aria-hidden /><h3 className="mt-4 text-xl font-semibold">Methodology</h3><p className="mt-4 text-sm leading-7 text-[#343A40]">{edition.methodology.callReview}</p><p className="mt-3 text-sm leading-7 text-[#343A40]">{edition.methodology.falsification}</p><p className="mt-3 text-sm leading-7 text-[#343A40]">{edition.methodology.boundary}</p></div>
          <div className="border border-[#11161C]/15 p-5"><CheckCircle2 className="h-5 w-5 text-[#7A6A4C]" aria-hidden /><h3 className="mt-4 text-xl font-semibold">Edition contents</h3><ul className="mt-4 space-y-3 text-sm leading-7 text-[#343A40]"><li>Full digital report</li><li>Board consequence analysis</li><li>Evidence appendix</li><li>Falsification ledger</li><li>Release-bound PDF where authorised</li></ul></div>
        </div>
      </section>

      <section className="px-6 py-16" style={{ backgroundColor: "#11161C" }}>
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-start">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[#D7BC84]">Commercial corridor</p>
            <h2 className="mt-4 font-serif text-4xl text-white">Acquire the current edition, or inspect the record.</h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/64">GMI is sold edition-by-edition. Current checkout is governed by lifecycle, commerce authority, price authority and fulfilment identity.</p>
          </div>
          <CheckoutForm edition={edition} />
        </div>
      </section>

      <section className="px-6 py-14 text-[#11161C]" style={{ backgroundColor: paper }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[#7A6A4C]">The record</p><p className="mt-3 text-base text-[#343A40]">Historical editions remain visible so judgement, revision and call review stay inspectable.</p></div>
          <div className="flex flex-wrap gap-3">
            {edition.archiveContext.previousEdition ? <Link href={edition.archiveContext.previousEdition.href} className="inline-flex min-h-11 items-center gap-2 border border-[#11161C]/18 px-4 py-3 text-sm font-medium">Previous edition <ArrowRight className="h-4 w-4" aria-hidden /></Link> : null}
            {!edition.isCurrent ? <Link href={edition.archiveContext.currentEdition.href} className="inline-flex min-h-11 items-center gap-2 border border-[#B59258]/45 px-4 py-3 text-sm font-medium">Current edition <ArrowRight className="h-4 w-4" aria-hidden /></Link> : null}
            {edition.pdf.available && edition.pdf.downloadPath ? <Link href={edition.pdf.downloadPath} className="inline-flex min-h-11 items-center gap-2 border border-[#11161C]/18 px-4 py-3 text-sm font-medium">PDF access</Link> : null}
          </div>
        </div>
      </section>
    </main>
  );
}