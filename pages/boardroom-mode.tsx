/**
 * pages/boardroom-mode.tsx — Boardroom Mode: Evidence-gated explanation
 *
 * Access mode: evidence_gated
 * Who: Operators who have completed Executive Reporting and need
 *      adversarial boardroom scrutiny of a judgement that has been built.
 *
 * Boardroom Mode is NOT the same as Boardroom Brief:
 * - Boardroom Brief: early framing tool, public entry, £99 one-time
 * - Boardroom Mode: adversarial challenge engine, evidence-gated, requires
 *   a prior Executive Reporting or governed case record
 *
 * This page explains Boardroom Mode, states the prerequisite clearly,
 * and routes the user to the correct prerequisite or enquiry path.
 * It never implies self-serve checkout.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Lock, Shield } from "lucide-react";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

const WHAT_IT_IS = [
  "Adversarial challenge of a built executive judgement",
  "Tests whether the judgement survives contrary evidence",
  "Surfaces hidden dependencies and approval risks",
  "Identifies objection patterns a board will actually raise",
  "Produces a structured boardroom-challenge record",
];

const PREREQUISITES = [
  "Completion of Executive Reporting or a governed case record",
  "An identified decision with a stated executive judgement",
  "Evidence of prior diagnostic engagement (Fast Diagnostic, Team Assessment, or Enterprise Assessment)",
];

const BoardroomModePage: NextPage = () => {
  return (
    <Layout
      title="Boardroom Mode | Abraham of London"
      description="Boardroom Mode applies adversarial challenge to an executive judgement. Evidence-gated: requires prior Executive Reporting or a governed case record."
      canonicalUrl="/boardroom-mode"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main
        className="min-h-screen px-6 pb-24 pt-28 lg:px-12"
        style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}
      >
        <div className="mx-auto max-w-3xl space-y-10">

          {/* Gate notice */}
          <div
            className="flex items-start gap-4 border p-5"
            style={{ borderColor: `${GOLD}30`, backgroundColor: `${GOLD}06` }}
          >
            <Lock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: `${GOLD}AA` }} />
            <div>
              <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                Evidence-gated
              </p>
              <p className="mt-1.5 text-[13px] leading-[1.7] text-white/[0.65]">
                Boardroom Mode requires a prior Executive Reporting record or a governed case at challenge-ready state.
                Complete Executive Reporting first if you have not already done so.
              </p>
            </div>
          </div>

          {/* Header */}
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
              <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}88` }}>
                Operational Decision Intelligence Corridor — Stage 4
              </p>
            </div>
            <h1
              className="max-w-[30rem]"
              style={{ ...serif, fontSize: "clamp(2.2rem, 6vw, 3.8rem)", lineHeight: 0.95, fontStyle: "italic", color: "rgba(255,255,255,0.92)" }}
            >
              Boardroom Mode
            </h1>
            <p className="max-w-[60ch] text-[15px] leading-[1.8] text-white/[0.60]">
              Adversarial boardroom challenge for a built executive judgement.
              Not a framing tool — a scrutiny engine that tests whether the
              decision survives contrary evidence, hidden dependencies, and
              the objections a board will actually raise.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <span
                className="inline-flex items-center gap-1.5 border px-3 py-1.5"
                style={{ ...mono, fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", borderColor: "rgba(216,180,254,0.22)", color: "rgba(216,180,254,0.90)", backgroundColor: "rgba(216,180,254,0.06)" }}
              >
                <Lock className="h-3 w-3" />
                Evidence-gated
              </span>
              <span
                className="inline-flex items-center border px-3 py-1.5"
                style={{ ...mono, fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", borderColor: `${GOLD}30`, color: `${GOLD}BB`, backgroundColor: `${GOLD}08` }}
              >
                Requires prior Executive Reporting
              </span>
            </div>
          </header>

          {/* Distinction from Boardroom Brief */}
          <div
            className="border p-5"
            style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)" }}
          >
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>
              Boardroom Mode vs Boardroom Brief
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}88` }}>
                  Boardroom Brief — public entry
                </p>
                <p className="mt-1.5 text-[13px] leading-[1.65] text-white/[0.60]">
                  Early framing for one serious decision. Open entry, £99 one-time.
                  No prior record required. Produces a structured brief with objections
                  and next admissible move.
                </p>
                <Link
                  href="/boardroom-brief"
                  className="group mt-3 inline-flex items-center gap-1.5 text-white/[0.55] transition-colors hover:text-white/[0.80]"
                  style={{ ...mono, fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  Generate Boardroom Brief
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(216,180,254,0.85)" }}>
                  Boardroom Mode — evidence-gated
                </p>
                <p className="mt-1.5 text-[13px] leading-[1.65] text-white/[0.60]">
                  Adversarial scrutiny for a judgement already built through Executive
                  Reporting. Requires a prior governed record. Tests whether the
                  judgement survives challenge — not whether it can be framed.
                </p>
              </div>
            </div>
          </div>

          {/* What it does */}
          <div>
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
              What Boardroom Mode produces
            </p>
            <div className="mt-4 space-y-2.5">
              {WHAT_IT_IS.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: `${GOLD}70` }} />
                  <p className="text-[13px] leading-[1.65] text-white/[0.65]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prerequisites */}
          <div
            className="border p-5"
            style={{ borderColor: "rgba(216,180,254,0.15)", backgroundColor: "rgba(216,180,254,0.03)" }}
          >
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(216,180,254,0.75)" }}>
              Prerequisites to access Boardroom Mode
            </p>
            <div className="mt-4 space-y-2.5">
              {PREREQUISITES.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                  <p className="text-[13px] leading-[1.65] text-white/[0.60]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA routes */}
          <div className="space-y-4">
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
              What to do next
            </p>

            <Link
              href="/diagnostics/executive-reporting"
              className="group flex items-center justify-between border p-5 transition-colors hover:border-white/[0.15] hover:bg-white/[0.02]"
              style={{ borderColor: `${GOLD}28`, backgroundColor: `${GOLD}06` }}
            >
              <div>
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.20em", textTransform: "uppercase", color: `${GOLD}AA` }}>
                  Recommended first step
                </p>
                <p className="mt-1.5 text-[14px] text-white/[0.82]">Proceed to Executive Reporting</p>
                <p className="mt-0.5 text-[12px] text-white/[0.45]">
                  Builds the governed record that qualifies a decision for Boardroom Mode.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/boardroom-brief"
              className="group flex items-center justify-between border border-white/[0.07] bg-white/[0.012] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.02]"
            >
              <div>
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>
                  Not ready for Executive Reporting?
                </p>
                <p className="mt-1.5 text-[14px] text-white/[0.72]">Start with a Boardroom Brief</p>
                <p className="mt-0.5 text-[12px] text-white/[0.42]">
                  Public entry, £99. Produces early framing — the logical predecessor to Boardroom Mode.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/decision-pressure"
              className="group flex items-center justify-between border border-white/[0.07] bg-white/[0.012] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.02]"
            >
              <div>
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>
                  Starting from scratch?
                </p>
                <p className="mt-1.5 text-[14px] text-white/[0.72]">Start with the free pressure signal</p>
                <p className="mt-0.5 text-[12px] text-white/[0.42]">
                  Identifies the decision fracture and routes you to the right corridor entry point.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div
            className="border-t border-white/[0.06] pt-6"
            style={{ ...mono, fontSize: "11px", letterSpacing: "0.12em", lineHeight: 1.8, color: "rgba(255,255,255,0.30)" }}
          >
            <p>Access: Evidence-gated — Operational Decision Intelligence Corridor, Stage 4.</p>
            <p className="mt-1">No self-serve checkout. Access opens when a qualifying governed record is confirmed.</p>
          </div>

        </div>
      </main>
    </Layout>
  );
};

export default BoardroomModePage;
