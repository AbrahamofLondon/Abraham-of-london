import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ShieldCheck, FileSearch, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function Rule() {
  return <hr className="my-10 border-white/[0.04]" />;
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl">
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "0.5rem" }}>{eyebrow}</p>
      <h2 style={{ ...serif, fontSize: "1.45rem", lineHeight: 1.3, color: "rgba(255,255,255,0.75)", fontStyle: "italic", marginBottom: "1rem" }}>{title}</h2>
      {children}
    </div>
  );
}

function StandardItem({ icon: Icon, label, detail }: { icon: typeof ShieldCheck; label: string; detail: string }) {
  return (
    <div className="border border-white/[0.06] bg-white/[0.02] px-4 py-3 mb-2">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3 h-3 text-zinc-400/60 shrink-0" />
        <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>{label}</span>
      </div>
      <p className="text-xs leading-5 text-zinc-500 pl-5">{detail}</p>
    </div>
  );
}

export default function VerificationStandardsPage() {
  return (
    <Layout>
      <Head>
        <title>Verification Standards | Decision Infrastructure</title>
        <meta name="description" content="How evidence becomes publishable. Verification methods, integrity seals, and publication thresholds." />
      </Head>

      <main className="min-h-screen bg-[#030305] pt-32 pb-28 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}50`, marginBottom: "0.75rem" }}>Evidence Governance</p>
          <h1 style={{ ...serif, fontSize: "2.2rem", lineHeight: 1.2, color: "rgba(255,255,255,0.80)", fontStyle: "italic" }}>
            How evidence becomes publishable.
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-500 max-w-xl" style={serif}>
            Published evidence must pass governed thresholds for confidence, verification, and review.
            These standards exist before any outcome is published. They define what qualifies as proof.
          </p>

          <Rule />

          {/* 1. How proof is classified */}
          <Section eyebrow="Classification" title="How proof is classified">
            <div className="space-y-2">
              <StandardItem icon={ShieldCheck} label="Live evidence" detail="Data derived from real assessments, decisions, and verified outcomes. Sample size and verification method are attached." />
              <StandardItem icon={FileSearch} label="Aggregate evidence" detail="Statistics computed across multiple cases. Published only when minimum sample thresholds are met." />
              <StandardItem icon={Eye} label="Demonstration pattern" detail="Illustrative examples showing how the system classifies and governs. Not verified outcomes. Visibly labelled." />
              <StandardItem icon={Lock} label="Static proof asset" detail="Anonymised case dossiers built from real operating patterns. Not live data. Labelled accordingly." />
            </div>
          </Section>

          <Rule />

          {/* 2. Verification methods */}
          <Section eyebrow="Verification" title="How outcomes are verified">
            <div className="space-y-2">
              <StandardItem icon={CheckCircle} label="Self-reported" detail="Captured from user feedback. Never represented as independently verified. Not eligible for publication." />
              <StandardItem icon={CheckCircle} label="Behavioural" detail="Derived from observed user actions within the system. Tracked through execution records and commitment checkpoints." />
              <StandardItem icon={CheckCircle} label="Documentary" detail="Supported by documentary evidence: contracts, financial records, organisational data. Requires source tracing." />
              <StandardItem icon={CheckCircle} label="Operator-confirmed" detail="Independently reviewed and confirmed by a human operator. Highest individual verification method." />
            </div>
          </Section>

          <Rule />

          {/* 3. Evidence origin hierarchy */}
          <Section eyebrow="Hierarchy" title="Evidence origin hierarchy">
            <p className="text-xs leading-6 text-zinc-500 mb-4" style={serif}>
              Not all evidence carries equal weight. The system distinguishes between:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-500">
              <li><span className="text-zinc-400">Operator-confirmed</span> — highest trust. Human review of documentary evidence.</li>
              <li><span className="text-zinc-400">Documentary</span> — source-traced to financial, contractual, or organisational records.</li>
              <li><span className="text-zinc-400">Behavioural</span> — observed actions within the system over time.</li>
              <li><span className="text-zinc-400">Self-reported</span> — user-submitted feedback. Useful for calibration. Not publishable as proof.</li>
            </ol>
          </Section>

          <Rule />

          {/* 4. Integrity seal levels */}
          <Section eyebrow="Integrity seals" title="What the seal levels mean">
            <p className="text-xs leading-6 text-zinc-500 mb-4" style={serif}>
              Every evidence asset receives an integrity seal based on confidence, verification method, and data completeness.
              See the <Link href="/evidence/seals" className="text-amber-600/60 border-b border-amber-600/20 hover:text-amber-500 transition-colors">full seal registry</Link> for details.
            </p>
            <div className="space-y-2">
              <StandardItem icon={ShieldCheck} label="Bronze" detail="Verified internally. Not publishable. Minimum 85% confidence." />
              <StandardItem icon={ShieldCheck} label="Silver" detail="Outcome-supported. Publication-eligible after human review. Requires behavioural or documentary evidence and financial impact." />
              <StandardItem icon={ShieldCheck} label="Gold" detail="Operator-confirmed with documentary trace. Requires 90%+ confidence, financial impact, and contract trace." />
              <StandardItem icon={Lock} label="Platinum" detail="Reserved. Not currently issued. Will require repeated verified patterns across multiple independent cases." />
            </div>
          </Section>

          <Rule />

          {/* 5. Publication thresholds */}
          <Section eyebrow="Publication" title="When evidence may be published">
            <div className="space-y-3 text-xs leading-6 text-zinc-500" style={serif}>
              <p>Publication requires at minimum a <strong className="text-zinc-400">Silver</strong> integrity seal.</p>
              <p>Aggregate metrics require a minimum of <strong className="text-zinc-400">15 verified cases</strong> before any public claim is made.</p>
              <p>Case studies require <strong className="text-zinc-400">human review</strong> and <strong className="text-zinc-400">anonymisation verification</strong> before publication.</p>
              <p>Self-reported outcomes are <strong className="text-zinc-400">never publishable</strong> as proof. They are used for internal calibration.</p>
            </div>
          </Section>

          <Rule />

          {/* 6. Human review gate */}
          <Section eyebrow="Review" title="The human review gate">
            <p className="text-xs leading-6 text-zinc-500" style={serif}>
              No evidence auto-publishes. Every case draft, aggregate metric, and proof block passes through human review
              before reaching any external surface. The review confirms anonymisation, accuracy, and that no identifying
              information can be derived by cross-referencing public data.
            </p>
          </Section>

          <Rule />

          {/* 7. Anonymisation */}
          <Section eyebrow="Privacy" title="Anonymisation and privacy controls">
            <p className="text-xs leading-6 text-zinc-500 mb-3" style={serif}>
              All published evidence is anonymised. No client name, individual name, or organisation identifier
              appears in any public proof unless expressly authorised. Financial figures are presented as ranges
              where identification risk exists. Timeframes are generalised when specificity could enable de-anonymisation.
            </p>
          </Section>

          <Rule />

          {/* 8. What we do not publish */}
          <Section eyebrow="Boundaries" title="What we do not publish">
            <ul className="space-y-1.5 text-xs text-zinc-500">
              <li>Internal classification methods or computational structures</li>
              <li>Routing logic or decision-engine internals</li>
              <li>Exact admission or refusal thresholds</li>
              <li>Internal state architecture</li>
              <li>Proprietary operating mechanics</li>
              <li>Individual respondent data</li>
              <li>Unapproved or suppressed evidence</li>
              <li>Client-identifying information without permission</li>
              <li>Outcomes below the publication seal threshold</li>
            </ul>
          </Section>

          <Rule />

          {/* 9. What proof labels mean */}
          <Section eyebrow="Labels" title="What proof labels mean">
            <div className="space-y-2">
              <StandardItem icon={Eye} label="Demonstration pattern" detail="This illustrates how the system classifies proof. It is not a published verified outcome." />
              <StandardItem icon={FileSearch} label="Static proof asset" detail="Anonymised case built from real operating patterns. Not live data." />
              <StandardItem icon={ShieldCheck} label="Verified case evidence" detail="Outcome verified through the integrity seal system and approved for publication." />
              <StandardItem icon={EyeOff} label="Insufficient sample" detail="Not enough verified cases to publish aggregate metrics. This is honest, not evasive." />
            </div>
          </Section>

          <Rule />

          {/* 10. Current publication posture */}
          <Section eyebrow="Current status" title="Current publication posture">
            <p className="text-xs leading-6 text-zinc-500 mb-3" style={serif}>
              Some outputs displayed on this platform are demonstration patterns. Published evidence requires human review.
              Self-reported outcomes are not treated as publishable proof. Aggregate metrics require minimum cohort thresholds.
              Client-identifying data is not published without explicit permission.
            </p>
            <p className="text-xs leading-6 text-zinc-500" style={serif}>
              We publish our standards before our outcomes. The standards are the proof that the institution exists.
            </p>
          </Section>

          <Rule />

          {/* Navigation */}
          <div className="flex flex-wrap gap-4 mt-4">
            <Link href="/evidence" style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}AA` }}>
              View evidence
            </Link>
            <Link href="/evidence/seals" style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
              Integrity seal registry
            </Link>
          </div>

        </div>
      </main>
    </Layout>
  );
}
