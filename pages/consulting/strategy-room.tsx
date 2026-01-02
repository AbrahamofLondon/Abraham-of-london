/* pages/consulting/strategy-room.tsx */
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";
import { hasInnerCircleAccess } from "@/lib/inner-circle/access";
import type { StrategyRoomIntakePayload, StrategyRoomIntakeResult } from "@/lib/consulting/strategy-room";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

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

  if (!mounted) return <Layout title="Strategy Room Intake"><div className="min-h-screen bg-black" /></Layout>;

  return (
    <Layout title="Strategy Room Intake">
      <Head>
        <title>Strategy Room Intake | Abraham of London</title>
        <meta name="description" content="Board-grade decision environments. Filters for authority, decision gravity, and readiness." />
      </Head>

      <main className="min-h-screen bg-black text-cream pb-20">
        <section className="border-b border-white/10 bg-[#06060c] py-12 sm:py-16 px-4">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-softGold/70">Consulting · Institutional Strategy</p>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-cream sm:text-4xl italic">Strategy Room Intake</h1>
            <p className="mt-3 text-sm text-softGold/80 max-w-2xl">This intake is required before scheduling. It prioritises structural logic over sentiment.</p>
            
            {/* Inner Circle Access Badge */}
            {icAccess && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-900/20 px-3 py-1 text-xs text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Inner Circle Member
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-10">
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
        </section>
      </main>
    </Layout>
  );
};

export default StrategyRoomPage;