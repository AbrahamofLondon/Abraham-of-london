"use client";

import React from "react";
import {
  ALIGNMENT_DOMAIN_LABELS,
  ALIGNMENT_DOMAIN_ORDER,
  PURPOSE_ALIGNMENT_QUESTIONS,
} from "@/lib/alignment/checklist";
import { buildAlignmentNarrativeFromResult } from "@/lib/alignment/report-language";
import AlignmentCTA from "@/components/alignment/AlignmentCTA";

type AssessmentApiResult = {
  ok: true;
  assessmentId: string;
  result: {
    totalScore: number;
    possibleScore: number;
    percent: number;
    band: string;
    domainScores: Array<{
      domain: string;
      earned: number;
      possible: number;
      percent: number;
    }>;
    weakestDomains: string[];
    strengths: string[];
    corrections: string[];
    createdAt: string;
  };
};

function formatBand(value: string): string {
  return value.toUpperCase();
}

function getBandSurface(band: string): string {
  switch (band) {
    case "aligned":
      return "border-emerald-200 bg-emerald-50";
    case "drifting":
      return "border-amber-200 bg-amber-50";
    case "misaligned":
      return "border-orange-200 bg-orange-50";
    case "disordered":
      return "border-red-200 bg-red-50";
    default:
      return "border-neutral-200 bg-neutral-50";
  }
}

function getBandText(band: string): string {
  switch (band) {
    case "aligned":
      return "text-emerald-700";
    case "drifting":
      return "text-amber-700";
    case "misaligned":
      return "text-orange-700";
    case "disordered":
      return "text-red-700";
    default:
      return "text-neutral-950";
  }
}

function getBandHeadline(band: string): string {
  switch (band) {
    case "aligned":
      return "Directional integrity is presently strong.";
    case "drifting":
      return "The structure still holds, but drift has begun.";
    case "misaligned":
      return "Effort and direction are no longer fully coherent.";
    case "disordered":
      return "Activity has overtaken governed direction.";
    default:
      return "Assessment outcome recorded.";
  }
}

export default function PurposeAlignmentAssessment() {
  const [answers, setAnswers] = React.useState<Record<string, boolean>>({});
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<AssessmentApiResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const grouped = React.useMemo(() => {
    const base: Record<string, typeof PURPOSE_ALIGNMENT_QUESTIONS> = {};
    for (const domain of ALIGNMENT_DOMAIN_ORDER) {
      base[domain] = PURPOSE_ALIGNMENT_QUESTIONS.filter((q) => q.domain === domain);
    }
    return base;
  }, []);

  function toggleAnswer(id: string) {
    setAnswers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/purpose-alignment/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
          notes,
        }),
      });

      const data = (await response.json()) as
        | AssessmentApiResult
        | { ok: false; error: string };

      if (!response.ok || !data.ok) {
        throw new Error("error" in data ? data.error : "Unable to save assessment");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const checkedCount = Object.values(answers).filter(Boolean).length;
  const narrative = result ? buildAlignmentNarrativeFromResult(result.result) : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="rounded-[32px] border bg-white p-8 shadow-sm">
        <div className="max-w-4xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A6A2F]">
            Purpose Alignment System
          </div>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950">
            Directional Integrity Assessment
          </h1>

          <p className="mt-4 text-sm leading-7 text-neutral-600">
            Assess mandate, decisions, environment, behaviour, emotional order,
            and legacy posture through a governed diagnostic instrument.
          </p>

          <div className="mt-6 inline-flex rounded-2xl border bg-[#FCFBF7] px-4 py-2 text-sm text-neutral-600">
            Current completion: {checkedCount}/{PURPOSE_ALIGNMENT_QUESTIONS.length}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6">
        {ALIGNMENT_DOMAIN_ORDER.map((domain) => (
          <section
            key={domain}
            className="rounded-[28px] border bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A6A2F]">
                  Alignment Domain
                </div>
                <h2 className="mt-2 text-xl font-semibold text-neutral-950">
                  {ALIGNMENT_DOMAIN_LABELS[domain]}
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {grouped[domain].map((question) => (
                <label
                  key={question.id}
                  className="flex cursor-pointer items-start gap-3 rounded-[22px] border p-4 transition hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(answers[question.id])}
                    onChange={() => toggleAnswer(question.id)}
                    className="mt-1"
                  />
                  <span className="text-sm leading-6 text-neutral-900">
                    {question.statement}
                  </span>
                </label>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-[28px] border bg-white p-6 shadow-sm">
          <label
            htmlFor="purpose-alignment-notes"
            className="block text-sm font-medium text-neutral-700"
          >
            Operating Notes
          </label>
          <textarea
            id="purpose-alignment-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="mt-3 w-full rounded-[22px] border px-4 py-3 text-sm outline-none"
            placeholder="Optional strategic notes, drift observations, or correction priorities."
          />
        </section>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex rounded-2xl border bg-white px-5 py-3 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50"
          >
            {submitting ? "Scoring and saving..." : "Score and save"}
          </button>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        {result ? (
          <>
            <section className="rounded-[32px] border bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-4xl">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">
                    Assessment Outcome
                  </div>

                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
                    {getBandHeadline(result.result.band)}
                  </h2>

                  <p className="mt-4 text-base leading-7 text-neutral-800">
                    {narrative?.posture}
                  </p>

                  <p className="mt-4 text-sm leading-7 text-neutral-600">
                    {narrative?.executiveSummary}
                  </p>
                </div>

                <div
                  className={`rounded-[22px] border px-5 py-4 ${getBandSurface(
                    result.result.band
                  )}`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Current Band
                  </div>
                  <div
                    className={`mt-2 text-2xl font-semibold ${getBandText(
                      result.result.band
                    )}`}
                  >
                    {formatBand(result.result.band)}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-3">
              <div className="rounded-[28px] border bg-white p-6 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Total Score
                </div>
                <div className="mt-4 text-5xl font-semibold tracking-tight text-neutral-950">
                  {result.result.totalScore}
                </div>
                <div className="mt-2 text-sm text-neutral-500">
                  of {result.result.possibleScore}
                </div>
              </div>

              <div className="rounded-[28px] border bg-white p-6 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Percent Integrity
                </div>
                <div className="mt-4 text-5xl font-semibold tracking-tight text-neutral-950">
                  {result.result.percent}%
                </div>
                <div className="mt-2 text-sm text-neutral-500">
                  current structural reading
                </div>
              </div>

              <div className="rounded-[28px] border bg-white p-6 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Weakest Domains
                </div>
                <div className="mt-4 text-base font-semibold leading-7 text-neutral-950">
                  {result.result.weakestDomains
                    .map(
                      (domain) =>
                        ALIGNMENT_DOMAIN_LABELS[
                          domain as keyof typeof ALIGNMENT_DOMAIN_LABELS
                        ]
                    )
                    .join(", ")}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border bg-[#FCFBF7] p-8 shadow-sm">
              <div className="max-w-4xl">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">
                  Decision Pressure
                </div>

                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">
                  {narrative?.correctivePriorityTitle}
                </h3>

                <p className="mt-4 text-sm leading-7 text-neutral-700">
                  {narrative?.correctivePriorityBody}
                </p>

                <div className="mt-6 rounded-[22px] border bg-white p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Required Action
                  </div>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">
                    Delay increases drift. The correct move now is not more reflection,
                    but structured correction. Tighten the weakest domain, remove one
                    source of noise, and reassess before a compromised pattern hardens.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border bg-white p-8 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
                Domain Reading
              </div>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                Domain Performance
              </h3>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {result.result.domainScores.map((item) => (
                  <div
                    key={item.domain}
                    className="rounded-[22px] border bg-[#FCFBF7] p-5"
                  >
                    <div className="text-sm font-semibold text-neutral-950">
                      {
                        ALIGNMENT_DOMAIN_LABELS[
                          item.domain as keyof typeof ALIGNMENT_DOMAIN_LABELS
                        ]
                      }
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                          Score
                        </div>
                        <div className="mt-1 text-3xl font-semibold text-neutral-950">
                          {item.earned}/{item.possible}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                          Percent
                        </div>
                        <div className="mt-1 text-lg font-medium text-neutral-700">
                          {item.percent}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-[28px] border bg-white p-8 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
                  Band Interpretation
                </div>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                  {narrative?.bandInterpretationTitle}
                </h3>
                <p className="mt-4 text-sm leading-7 text-neutral-600">
                  {narrative?.bandInterpretationBody}
                </p>
              </section>

              <section className="rounded-[28px] border bg-white p-8 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
                  Strongest Signal
                </div>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                  {narrative?.strongestSignalTitle}
                </h3>
                <p className="mt-4 text-sm leading-7 text-neutral-600">
                  {narrative?.strongestSignalBody}
                </p>
              </section>
            </div>

            <section className="rounded-[28px] border bg-white p-8 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
                Correction Priorities
              </div>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                Immediate Actions
              </h3>

              <div className="mt-6 grid gap-3">
                {result.result.corrections.map((item) => (
                  <div
                    key={item}
                    className="rounded-[20px] border bg-[#FCFBF7] p-4 text-sm leading-7 text-neutral-700"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`/api/purpose-alignment/report/${result.assessmentId}`}
                  className="inline-flex rounded-2xl border bg-white px-5 py-3 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50"
                >
                  Download alignment report PDF
                </a>

                <a
                  href="/dashboard/purpose-alignment"
                  className="inline-flex rounded-2xl border bg-white px-5 py-3 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50"
                >
                  Open executive dashboard
                </a>
              </div>
            </section>

            <AlignmentCTA
              narrative={narrative!}
              reportUrl={`/api/purpose-alignment/report/${result.assessmentId}`}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}