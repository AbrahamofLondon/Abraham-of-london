/* pages/consulting/strategy-room.tsx */
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  ShieldCheck,
  FileSpreadsheet,
  Presentation,
  ClipboardCheck,
  Map,
  Layers,
  Workflow,
  Cpu,
  Hammer,
  Landmark,
  ScrollText,
  Lock,
  ArrowRight,
  CheckCircle,
  FileStack,
  GraduationCap,
  Building2,
} from "lucide-react";

import Layout from "@/components/Layout";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";
import { hasInnerCircleAccess } from "@/lib/inner-circle/access";
import type { StrategyRoomIntakePayload, StrategyRoomIntakeResult } from "@/lib/consulting/strategy-room";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

// Artifacts used in Strategy Room environment
const strategyRoomArtifacts = [
  {
    title: "Board Decision Log Template",
    description: "Excel template for documenting board-level decisions with accountability matrices",
    href: "/resources/board-decision-log-template",
    status: 'public' as const,
    icon: FileSpreadsheet,
    fileType: "Excel (.xlsx)",
    purpose: "Decision documentation and accountability tracking"
  },
  {
    title: "Operating Cadence Pack",
    description: "Complete presentation deck for board meeting design and execution rhythm",
    href: "/resources/operating-cadence-pack",
    status: 'inner-circle' as const,
    icon: Presentation,
    fileType: "PowerPoint (.pptx)",
    purpose: "Meeting architecture and execution discipline"
  },
  {
    title: "Builder's Catechism",
    description: "Authoritative question-set for founder legitimacy and execution discipline",
    href: "/canon/builders-catechism",
    status: 'inner-circle' as const,
    icon: Hammer,
    purpose: "Founder legitimacy and execution clarity"
  },
  {
    title: "Multi-Generational Legacy Ledger",
    description: "Framework for legacy mapping across financial, intellectual, relational domains",
    href: "/resources/multi-generational-legacy-ledger",
    status: 'inner-circle' as const,
    icon: Landmark,
    purpose: "Legacy architecture and stewardship planning"
  },
  {
    title: "Strategic Frameworks",
    description: "Complete collection of decision matrices, prioritization logic, and governance templates",
    href: "/resources/strategic-frameworks",
    status: 'public' as const,
    icon: Map,
    purpose: "Decision architecture and prioritization"
  },
  {
    title: "Canon Council Table Agenda",
    description: "Structured agenda format for board-level strategic conversations",
    href: "/resources/canon-council-table-agenda",
    status: 'inner-circle' as const,
    icon: ClipboardCheck,
    purpose: "Strategic conversation structure"
  }
];

// Canon Volumes used in Strategy Room
const strategyCanonVolumes = [
  {
    volume: "Volume I",
    title: "Foundations of Purpose",
    description: "Teaching edition on epistemology, authority, responsibility, and truth",
    href: "/canon/volume-i-teaching-edition",
    status: 'inner-circle' as const,
    icon: ScrollText,
    keyConcept: "Authority and responsibility frameworks"
  },
  {
    volume: "Volume II",
    title: "Governance and Formation",
    description: "Teaching edition on board mechanics, stakeholder alignment, ethical boundaries",
    href: "/canon/volume-ii-teaching-edition",
    status: 'inner-circle' as const,
    icon: ShieldCheck,
    keyConcept: "Governance architecture"
  },
  {
    volume: "Volume X",
    title: "The Arc of Future Civilisation",
    description: "Integration and deployment of full implementation stack",
    href: "/canon/volume-x-the-arc-of-future-civilisation",
    status: 'consulting' as const,
    icon: Cpu,
    keyConcept: "Implementation and deployment"
  }
];

// Ultimate Purpose of Man section
const ultimatePurposeMaterials = [
  {
    title: "Architecture of Human Purpose",
    description: "Complete framework for understanding human purpose across seven domains",
    href: "/canon/the-architecture-of-human-purpose-landing",
    status: 'inner-circle' as const,
    icon: Layers,
    domains: "Seven domains of human purpose"
  },
  {
    title: "Legacy Canvas Implementation",
    description: "Practical implementation of multi-generational legacy planning",
    href: "/resources/multi-generational-legacy-ledger",
    status: 'inner-circle' as const,
    icon: Landmark,
    domains: "Financial, intellectual, relational, spiritual"
  },
  {
    title: "Vault Resources",
    description: "Curated collection of implementation tools, templates, and frameworks",
    href: "/resources/vault",
    status: 'inner-circle' as const,
    icon: FileStack,
    domains: "Complete implementation toolkit"
  }
];

const StrategyRoomPage: NextPage = () => {
  // --- STATE DEFINITIONS ---
  const [role, setRole] = React.useState<"Founder/Owner" | "Board Member" | "Executive (delegated authority)" | "Advisor/Consultant" | "Other">("Founder/Owner");
  const [roleOther, setRoleOther] = React.useState("");
  const [hasAuthority, setHasAuthority] = React.useState<"Yes, fully" | "Yes, with board approval" | "No">("Yes, fully");
  const [fullName, setFullName] = React.useState("");
  const [org, setOrg] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [mandate, setMandate] = React.useState("");
  const [decision, setDecision] = React.useState("");
  const [decisionType, setDecisionType] = React.useState<"Irreversible" | "High-cost to reverse" | "Direction-setting" | "Personnel/authority-related" | "Capital allocation" | "Reputation/governance">("Direction-setting");
  const [stuckReasons, setStuckReasons] = React.useState<Array<"Lack of clarity" | "Conflicting incentives" | "Political risk" | "Moral uncertainty" | "Incomplete information" | "Personal cost">>([]);
  const [constraints, setConstraints] = React.useState("");
  const [tradeOff, setTradeOff] = React.useState("");
  const [unacceptableOutcome, setUnacceptableOutcome] = React.useState("");
  const [costDelay, setCostDelay] = React.useState<Array<"Financial" | "Reputational" | "Cultural" | "Personal authority" | "Opportunity loss">>([]);
  const [whoAffected, setWhoAffected] = React.useState("");
  const [breaksFirst, setBreaksFirst] = React.useState("");
  const [readyForUnpleasantDecision, setReadyForUnpleasantDecision] = React.useState<"Yes" | "No">("Yes");
  const [willingAccountability, setWillingAccountability] = React.useState<"Yes" | "No">("Yes");
  const [whyNow, setWhyNow] = React.useState("");
  const [declaration, setDeclaration] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<StrategyRoomIntakeResult | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [icAccess, setIcAccess] = React.useState<boolean>(false);

  React.useEffect(() => {
    setMounted(true);
    setIcAccess(hasInnerCircleAccess());
  }, []);

  const toggleMulti = <T extends string>(value: T, list: T[], setList: React.Dispatch<React.SetStateAction<T[]>>) => {
    setList((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };

  const validate = (): string | null => {
    if (!fullName.trim()) return "Name required.";
    if (!email.trim() || !EMAIL_RE.test(email)) return "Valid email required.";
    if (!org.trim()) return "Organisation required.";
    if (role === "Other" && !roleOther.trim()) return "Please specify your role.";
    if (hasAuthority === "No") return "This environment requires decision authority.";
    if (!mandate.trim()) return "Mandate description required.";
    if (!decision.trim()) return "Decision statement required.";
    if (stuckReasons.length === 0) return "Select at least one reason why the decision is stuck.";
    if (!constraints.trim()) return "Constraints description required.";
    if (!tradeOff.trim()) return "Trade-off statement required.";
    if (!unacceptableOutcome.trim()) return "Unacceptable outcome statement required.";
    if (costDelay.length === 0) return "Select at least one cost-of-delay item.";
    if (!whoAffected.trim()) return "Please state who is affected.";
    if (!breaksFirst.trim()) return "Please state what breaks first.";
    if (readyForUnpleasantDecision === "No" || willingAccountability === "No") return "Commitment to outcomes and accountability is required.";
    if (!whyNow.trim()) return "Please state why you are seeking this now.";
    if (!declaration) return "Declaration must be accepted.";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    const err = validate();
    if (err) {
      setResult({ ok: false, status: "declined", message: err });
      return;
    }

    setLoading(true);
    try {
      const recaptchaToken = await getRecaptchaTokenSafe("strategy_room_intake");
      if (!recaptchaToken) {
        setResult({ ok: false, status: "declined", message: "Security check failed. Enable JavaScript." });
        return;
      }

      const payload: StrategyRoomIntakePayload = {
        meta: { source: "web", page: "/consulting/strategy-room", submittedAtIso: new Date().toISOString() },
        contact: { fullName: fullName.trim(), email: email.trim(), organisation: org.trim() },
        authority: { role: role === "Other" ? `Other: ${roleOther.trim()}` : role, hasAuthority, mandate: mandate.trim() },
        decision: { statement: decision.trim(), type: decisionType, stuckReasons },
        constraints: { nonRemovableConstraints: constraints.trim() || null, avoidedTradeOff: tradeOff.trim(), unacceptableOutcome: unacceptableOutcome.trim() },
        timeCost: { costOfDelay: costDelay, affected: whoAffected.trim(), breaksFirst: breaksFirst.trim() },
        readiness: { readyForUnpleasantDecision, willingAccountability, whyNow: whyNow.trim() },
        declarationAccepted: declaration,
        recaptchaToken,
      };

      const res = await fetch("/api/strategy-room/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as StrategyRoomIntakeResult;
      setResult(data);
    } catch (_submitError) {
      console.error('[StrategyRoom] Submission failed:', _submitError);
      setResult({ ok: false, status: "declined", message: "Submission failed. Please try again shortly." });
    } finally {
      setLoading(false);
    }
  };

  const feedbackTone = result?.ok && result.status === "accepted"
    ? "border-emerald-500/60 bg-emerald-900/35 text-emerald-100"
    : "border-red-500/60 bg-red-900/35 text-red-100";

  if (!mounted) return <Layout title="Strategy Room"><div className="min-h-screen bg-black" /></Layout>;

  return (
    <Layout title="Strategy Room">
      <Head>
        <title>Strategy Room | Abraham of London</title>
        <meta name="description" content="Board-grade decision environment powered by the Canon, Strategic Frameworks, and the Ultimate Purpose of Man. For leaders who carry weight." />
      </Head>

      <main className="min-h-screen bg-black text-cream">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
          
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
                Board-Grade Decision Environment
              </p>
              
              <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Strategy Room
              </h1>
              
              <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
                A structured environment for leaders facing irreversible decisions. Powered by the Canon, 
                Strategic Frameworks, and the Ultimate Purpose of Man — not coaching.
              </p>
              
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="#intake"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
                >
                  Begin Intake Process
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                
                <Link
                  href="/resources/strategic-frameworks"
                  className="inline-flex items-center justify-center rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/15"
                >
                  View Strategic Frameworks
                  <BookOpen className="ml-2 h-4 w-4" />
                </Link>
              </div>
              
              {icAccess && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-900/20 px-4 py-2 text-sm text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Inner Circle Member — Full Artifact Access
                </div>
              )}
            </div>
          </div>
        </section>

        {/* WHAT POWERS THE STRATEGY ROOM */}
        <section className="bg-zinc-950 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
                The Engine
              </p>
              <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
                What powers the Strategy Room
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
                This is not a consulting call. It's a structured environment built on 17 years of developed doctrine, 
                tested frameworks, and implementation tooling.
              </p>
            </div>

            {/* Canon Volumes */}
            <div className="mb-16">
              <h3 className="mb-8 font-serif text-2xl font-semibold text-white">The Canon (Vol I-X)</h3>
              <div className="grid gap-6 lg:grid-cols-3">
                {strategyCanonVolumes.map((volume) => {
                  const Icon = volume.icon;
                  return (
                    <div
                      key={volume.volume}
                      className="group rounded-3xl border border-white/8 bg-white/[0.02] p-6 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
                            {volume.volume}
                          </p>
                          <h4 className="mt-1 font-serif text-lg font-semibold text-white group-hover:text-gold">
                            {volume.title}
                          </h4>
                        </div>
                        <Icon className="h-6 w-6 text-gold/60" />
                      </div>
                      <p className="mb-4 text-sm leading-relaxed text-gray-400">
                        {volume.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-400">Key concept: </span>
                        {volume.keyConcept}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ultimate Purpose of Man & Legacy Canvas */}
            <div className="mb-16">
              <h3 className="mb-8 font-serif text-2xl font-semibold text-white">Ultimate Purpose & Legacy Architecture</h3>
              <div className="rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-10">
                <div className="grid gap-8 lg:grid-cols-3">
                  {ultimatePurposeMaterials.map((material) => {
                    const Icon = material.icon;
                    return (
                      <div key={material.title} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl border border-gold/25 bg-gold/10 p-2">
                            <Icon className="h-5 w-5 text-gold" />
                          </div>
                          <h4 className="font-serif text-lg font-semibold text-white">{material.title}</h4>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-400">{material.description}</p>
                        <p className="text-xs text-gray-500">
                          <span className="font-semibold text-gray-400">Covers: </span>
                          {material.domains}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Implementation Artifacts */}
            <div>
              <h3 className="mb-8 font-serif text-2xl font-semibold text-white">Implementation Artifacts</h3>
              <div className="grid gap-6 lg:grid-cols-3">
                {strategyRoomArtifacts.map((artifact) => {
                  const Icon = artifact.icon;
                  return (
                    <div
                      key={artifact.title}
                      className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-gold/20 hover:bg-white/[0.04]"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="rounded-xl border border-gold/25 bg-gold/10 p-2">
                          <Icon className="h-5 w-5 text-gold" />
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.3em] ${
                          artifact.status === 'public' 
                            ? 'bg-green-500/10 text-green-400' 
                            : artifact.status === 'inner-circle'
                            ? 'bg-gold/10 text-gold'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {artifact.status}
                        </span>
                      </div>
                      <h4 className="mb-2 font-serif text-lg font-semibold text-white group-hover:text-gold">
                        {artifact.title}
                      </h4>
                      <p className="mb-3 text-sm leading-relaxed text-gray-400">
                        {artifact.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-400">Purpose: </span>
                        {artifact.purpose}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* INTAKE FORM SECTION */}
        <section id="intake" className="bg-black py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
                Strategy Room Intake
              </h2>
              <p className="mt-4 text-gray-400">
                This intake is required before scheduling. It prioritises structural logic over sentiment.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-10 rounded-3xl border border-softGold/20 bg-white/[0.02] p-6 sm:p-10 backdrop-blur-md">
              
              {/* 1. CONTACT */}
              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-softGold/50 italic">Step 01 / Contact</p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <input value={fullName} onChange={(e)=>setFullName(e.target.value)} className="bg-transparent border-b border-white/20 py-2 outline-none focus:border-softGold transition-colors text-sm" placeholder="Full Name" required />
                  <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" className="bg-transparent border-b border-white/20 py-2 outline-none focus:border-softGold transition-colors text-sm" placeholder="Email Address" required />
                </div>
                <input value={org} onChange={(e)=>setOrg(e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2 outline-none focus:border-softGold transition-colors text-sm" placeholder="Organisation / Independent" required />
              </div>

              {/* 2. AUTHORITY */}
              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-softGold/50 italic">Step 02 / Authority</p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <select value={role} onChange={(e)=>setRole(e.target.value as any)} className="bg-black border border-white/10 rounded-lg p-2 text-sm text-cream outline-none">
                    <option>Founder/Owner</option>
                    <option>Board Member</option>
                    <option>Executive (delegated authority)</option>
                    <option>Advisor/Consultant</option>
                    <option>Other</option>
                  </select>
                  {role === "Other" && <input value={roleOther} onChange={(e)=>setRoleOther(e.target.value)} className="bg-transparent border-b border-white/20 py-2 outline-none focus:border-softGold text-sm" placeholder="Specify role" />}
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-softGold/70 uppercase tracking-widest">Decision Authority</p>
                  <div className="flex flex-wrap gap-4">
                    {["Yes, fully", "Yes, with board approval", "No"].map(v => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer text-sm hover:text-softGold transition-colors">
                        <input type="radio" name="auth" checked={hasAuthority === v} onChange={()=>setHasAuthority(v as any)} />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
                <textarea value={mandate} onChange={(e)=>setMandate(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-softGold min-h-[100px]" placeholder="State your mandate: what is success and who defines it?" required />
              </div>

              {/* 3. DECISION */}
              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-softGold/50 italic">Step 03 / The Decision</p>
                <textarea value={decision} onChange={(e)=>setDecision(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-softGold min-h-[120px]" placeholder="State the decision you cannot make right now (be precise)." required />
                
                {/* Decision Type Selector */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-softGold/70 uppercase tracking-widest">Decision Type</p>
                  <select value={decisionType} onChange={(e)=>setDecisionType(e.target.value as any)} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-cream outline-none">
                    <option>Irreversible</option>
                    <option>High-cost to reverse</option>
                    <option>Direction-setting</option>
                    <option>Personnel/authority-related</option>
                    <option>Capital allocation</option>
                    <option>Reputation/governance</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-softGold/70 uppercase tracking-widest">Why is this decision stuck?</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {["Lack of clarity", "Conflicting incentives", "Political risk", "Moral uncertainty", "Incomplete information", "Personal cost"].map(v => (
                      <label key={v} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:border-softGold/20 transition-all text-xs tracking-wide">
                        <input type="checkbox" checked={stuckReasons.includes(v as any)} onChange={()=>toggleMulti(v as any, stuckReasons, setStuckReasons)} />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. CONSTRAINTS & TRADE-OFFS */}
              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-softGold/50 italic">Step 04 / Constraints & Trade-offs</p>
                
                <textarea value={constraints} onChange={(e)=>setConstraints(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-softGold min-h-[100px]" placeholder="What constraints cannot be removed? (legal, fiduciary, moral)" required />
                
                <textarea value={tradeOff} onChange={(e)=>setTradeOff(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-softGold min-h-[100px]" placeholder="The trade-off you are avoiding..." required />
                
                <textarea value={unacceptableOutcome} onChange={(e)=>setUnacceptableOutcome(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-softGold min-h-[100px]" placeholder="What outcome is absolutely unacceptable?" required />
              </div>

              {/* 5. COST OF DELAY */}
              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-softGold/50 italic">Step 05 / Cost of Delay</p>
                
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-softGold/70 uppercase tracking-widest">What deteriorates if you delay?</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {["Financial", "Reputational", "Cultural", "Personal authority", "Opportunity loss"].map(v => (
                      <label key={v} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:border-softGold/20 transition-all text-xs tracking-wide">
                        <input type="checkbox" checked={costDelay.includes(v as any)} onChange={()=>toggleMulti(v as any, costDelay, setCostDelay)} />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>

                <textarea value={whoAffected} onChange={(e)=>setWhoAffected(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-softGold min-h-[80px]" placeholder="Who is affected most directly?" required />
                
                <textarea value={breaksFirst} onChange={(e)=>setBreaksFirst(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-softGold min-h-[80px]" placeholder="What breaks first if you wait?" required />
              </div>

              {/* 6. READINESS */}
              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-softGold/50 italic">Step 06 / Readiness</p>
                
                <div className="bg-softGold/5 border border-softGold/20 rounded-2xl p-6 space-y-4">
                  <p className="text-xs font-bold text-softGold uppercase italic tracking-widest text-center">Commitment</p>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase text-white/60">Ready for unpleasant result?</p>
                      <div className="flex gap-4">
                        {["Yes", "No"].map(v => <label key={v} className="text-xs flex gap-2"><input type="radio" checked={readyForUnpleasantDecision === v} onChange={()=>setReadyForUnpleasantDecision(v as any)} /> {v}</label>)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase text-white/60">Willing to be held accountable?</p>
                      <div className="flex gap-4">
                        {["Yes", "No"].map(v => <label key={v} className="text-xs flex gap-2"><input type="radio" checked={willingAccountability === v} onChange={()=>setWillingAccountability(v as any)} /> {v}</label>)}
                      </div>
                    </div>
                  </div>
                </div>

                <textarea value={whyNow} onChange={(e)=>setWhyNow(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-softGold min-h-[100px]" placeholder="Why are you seeking this environment now?" required />
              </div>

              {/* 7. DECLARATION & SUBMIT */}
              <div className="space-y-6 pt-4">
                <label className="flex gap-3 text-xs text-white/60 cursor-pointer">
                  <input type="checkbox" checked={declaration} onChange={(e)=>setDeclaration(e.target.checked)} />
                  <span>I accept responsibility for the outcome of the Strategy Room. I understand this is not coaching.</span>
                </label>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <button type="submit" disabled={loading} className="w-full sm:w-auto px-10 py-4 bg-softGold text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-white transition-all disabled:opacity-50">
                    {loading ? "Processing..." : "Submit Intake for Review"}
                  </button>

                  <Link href="/consulting" className="text-xs text-softGold/60 hover:text-softGold transition-colors">
                    ← Back to Consulting
                  </Link>
                </div>

                {result && (
                  <div className={`mt-6 p-4 rounded-xl border italic text-sm ${feedbackTone}`}>
                    {result.message}
                  </div>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* ACCESS & NEXT STEPS */}
        <section className="bg-zinc-950 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-10">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-white">Access the Materials</h3>
                  <p className="mt-4 text-sm leading-relaxed text-gray-400">
                    The Strategy Room environment draws from the complete Canon (Vol I-X), Strategic Frameworks, 
                    Ultimate Purpose of Man architecture, and implementation tooling from the Vault.
                  </p>
                  
                  <div className="mt-8 space-y-4">
                    <Link
                      href="/inner-circle"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                    >
                      Unlock Inner Circle Access
                      <Lock className="h-4 w-4" />
                    </Link>
                    
                    <Link
                      href="/resources/vault"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
                    >
                      Explore the Vault
                      <FileStack className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-white">What Happens Next</h3>
                  <div className="mt-6 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-white">Intake Review</p>
                        <p className="mt-1 text-sm text-gray-400">48-hour review of your submission for fit and readiness.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-white">Environment Setup</p>
                        <p className="mt-1 text-sm text-gray-400">Preparation of relevant Canon volumes, frameworks, and tools.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-white">Session Scheduling</p>
                        <p className="mt-1 text-sm text-gray-400">Calendar coordination for the Strategy Room session.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default StrategyRoomPage;