import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ShieldCheck, Lock, AlertTriangle, CheckCircle } from "lucide-react";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type SealEntry = {
  level: string;
  color: string;
  borderColor: string;
  confidence: string;
  verification: string;
  financialImpact: boolean;
  contractTrace: boolean;
  publication: string;
  currentlyIssuable: boolean;
  currentlyPublished: boolean;
  meaning: string;
  notMeaning: string;
};

const SEALS: SealEntry[] = [
  {
    level: "BRONZE",
    color: "text-amber-700/70",
    borderColor: "border-amber-700/20",
    confidence: "85%",
    verification: "Any method",
    financialImpact: false,
    contractTrace: false,
    publication: "Not permitted",
    currentlyIssuable: true,
    currentlyPublished: false,
    meaning: "The outcome has been recorded and passes minimum confidence. It has not been independently confirmed.",
    notMeaning: "The outcome is proven, validated, or ready for external consumption.",
  },
  {
    level: "SILVER",
    color: "text-zinc-300/70",
    borderColor: "border-zinc-400/20",
    confidence: "85%",
    verification: "Behavioural or documentary evidence required",
    financialImpact: true,
    contractTrace: false,
    publication: "Permitted after human review",
    currentlyIssuable: true,
    currentlyPublished: false,
    meaning: "The outcome has behavioural or documentary evidence, includes financial impact, and has been reviewed for publication eligibility.",
    notMeaning: "The outcome is guaranteed or universally replicable.",
  },
  {
    level: "GOLD",
    color: "text-amber-400/80",
    borderColor: "border-amber-400/25",
    confidence: "90%",
    verification: "Operator-confirmed or documentary with contract trace",
    financialImpact: true,
    contractTrace: true,
    publication: "Permitted after human review",
    currentlyIssuable: true,
    currentlyPublished: false,
    meaning: "The evidence includes operator confirmation, documentary support, financial impact trace, and human review.",
    notMeaning: "Perfection. It means the evidence met a governed threshold for transparency and accountability.",
  },
  {
    level: "PLATINUM",
    color: "text-zinc-500/60",
    borderColor: "border-zinc-600/15",
    confidence: "95%",
    verification: "Operator-confirmed with repeated patterns across multiple cases",
    financialImpact: true,
    contractTrace: true,
    publication: "Reserved — not currently issued",
    currentlyIssuable: false,
    currentlyPublished: false,
    meaning: "When operational, this will require repeated verified patterns across multiple independent cases.",
    notMeaning: "We claim to have platinum evidence. We do not. This level is reserved until the evidence threshold can be truthfully met.",
  },
];

function Rule() {
  return <hr className="my-10 border-white/[0.04]" />;
}

function BoolBadge({ value, label }: { value: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider ${value ? "text-emerald-400/50" : "text-zinc-600"}`}>
      {value ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
      {label}: {value ? "Yes" : "No"}
    </span>
  );
}

export default function IntegritySealRegistryPage() {
  return (
    <Layout>
      <Head>
        <title>Integrity Seal Registry | Decision Infrastructure</title>
        <meta name="description" content="Integrity seal levels for evidence classification. How outcomes are graded and what each seal means." />
      </Head>

      <main className="min-h-screen bg-[#030305] pt-32 pb-28 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}50`, marginBottom: "0.75rem" }}>Evidence Integrity</p>
          <h1 style={{ ...serif, fontSize: "2.2rem", lineHeight: 1.2, color: "rgba(255,255,255,0.80)", fontStyle: "italic" }}>
            Integrity Seal Registry
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-500 max-w-xl" style={serif}>
            Every evidence asset receives an integrity seal based on confidence, verification method, and data completeness.
            The seal determines whether evidence may be published and under what conditions.
          </p>

          <Rule />

          {/* Seal Cards */}
          <div className="space-y-6">
            {SEALS.map((seal) => (
              <div key={seal.level} className={`border ${seal.borderColor} bg-white/[0.02] p-6`}>
                {/* Level Header */}
                <div className="flex items-center gap-3 mb-4">
                  {seal.currentlyIssuable ? (
                    <ShieldCheck className={`w-5 h-5 ${seal.color}`} />
                  ) : (
                    <Lock className={`w-5 h-5 ${seal.color}`} />
                  )}
                  <h2 className={`font-mono text-sm tracking-widest uppercase ${seal.color}`}>{seal.level}</h2>
                </div>

                {/* Requirements Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div>
                    <span className="block text-[8px] font-mono uppercase tracking-wider text-zinc-600 mb-1">Confidence</span>
                    <span className="text-xs text-zinc-400">{seal.confidence}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-mono uppercase tracking-wider text-zinc-600 mb-1">Publication</span>
                    <span className="text-xs text-zinc-400">{seal.publication}</span>
                  </div>
                  <div>
                    <BoolBadge value={seal.financialImpact} label="Financial impact" />
                  </div>
                  <div>
                    <BoolBadge value={seal.contractTrace} label="Contract trace" />
                  </div>
                </div>

                {/* Verification */}
                <div className="mb-4">
                  <span className="block text-[8px] font-mono uppercase tracking-wider text-zinc-600 mb-1">Verification</span>
                  <span className="text-xs text-zinc-500">{seal.verification}</span>
                </div>

                {/* Status */}
                <div className="flex gap-4 mb-4">
                  <BoolBadge value={seal.currentlyIssuable} label="Currently issuable" />
                  <BoolBadge value={seal.currentlyPublished} label="Currently published" />
                </div>

                {/* Meaning */}
                <div className="border-t border-white/[0.04] pt-3 mt-3 space-y-2">
                  <p className="text-xs text-zinc-500 leading-5">
                    <span className="text-zinc-400 font-medium">What it means:</span> {seal.meaning}
                  </p>
                  <p className="text-xs text-zinc-500 leading-5">
                    <span className="text-zinc-400 font-medium">What it does not mean:</span> {seal.notMeaning}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Rule />

          {/* Navigation */}
          <div className="flex flex-wrap gap-4 mt-4">
            <Link href="/evidence/standards" style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}AA` }}>
              Verification standards
            </Link>
            <Link href="/evidence" style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
              View evidence
            </Link>
          </div>

        </div>
      </main>
    </Layout>
  );
}
