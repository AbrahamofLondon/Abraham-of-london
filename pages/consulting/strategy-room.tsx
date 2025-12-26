import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";
import { hasInnerCircleAccess } from "@/lib/inner-circle/access";
import type { StrategyRoomIntakePayload, StrategyRoomIntakeResult } from "@/lib/consulting/strategy-room";

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

const StrategyRoomPage: NextPage = () => {
  const [role, setRole] = React.useState<
    "Founder/Owner" | "Board Member" | "Executive (delegated authority)" | "Advisor/Consultant" | "Other"
  >("Founder/Owner");
  const [roleOther, setRoleOther] = React.useState("");

  const [hasAuthority, setHasAuthority] = React.useState<
    "Yes, fully" | "Yes, with board approval" | "No"
  >("Yes, fully");

  const [fullName, setFullName] = React.useState("");
  const [org, setOrg] = React.useState("");
  const [email, setEmail] = React.useState("");

  const [mandate, setMandate] = React.useState("");

  const [decision, setDecision] = React.useState("");
  const [decisionType, setDecisionType] = React.useState<
    "Irreversible" | "High-cost to reverse" | "Direction-setting" | "Personnel/authority-related" | "Capital allocation" | "Reputation/governance"
  >("Direction-setting");

  const [stuckReasons, setStuckReasons] = React.useState<
    Array<"Lack of clarity" | "Conflicting incentives" | "Political risk" | "Moral uncertainty" | "Incomplete information" | "Personal cost">
  >([]);

  const [constraints, setConstraints] = React.useState("");
  const [tradeOff, setTradeOff] = React.useState("");
  const [unacceptableOutcome, setUnacceptableOutcome] = React.useState("");

  const [costDelay, setCostDelay] = React.useState<
    Array<"Financial" | "Reputational" | "Cultural" | "Personal authority" | "Opportunity loss">
  >([]);
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
    // Client-side read of access cookie (helper is safe in browser too)
    setIcAccess(hasInnerCircleAccess());
  }, []);

  const toggleMulti = <T extends string>(
    value: T,
    list: T[],
    setList: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    setList((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };

  const validate = (): string | null => {
    if (!fullName.trim()) return "Please enter your name.";
    if (!email.trim() || !EMAIL_RE.test(email)) return "Please enter a valid email address.";
    if (!org.trim()) return "Please enter your organisation (or write 'Independent').";
    if (role === "Other" && !roleOther.trim()) return "Please specify your role.";
    if (hasAuthority === "No") return "This room requires decision authority.";
    if (!mandate.trim()) return "Please describe your mandate.";
    if (!decision.trim()) return "Please state the decision (one decision only).";
    if (stuckReasons.length === 0) return "Please select at least one reason why the decision is stuck.";
    if (!tradeOff.trim()) return "Please state the trade-off you are avoiding.";
    if (!unacceptableOutcome.trim()) return "Please state what outcome would be unacceptable.";
    if (costDelay.length === 0) return "Please select at least one cost-of-delay item.";
    if (!whoAffected.trim()) return "Please state who is affected (roles or names).";
    if (!breaksFirst.trim()) return "Please state what breaks first if nothing changes.";
    if (readyForUnpleasantDecision === "No") return "This room requires readiness to accept the decision outcome.";
    if (willingAccountability === "No") return "This room requires accountability to execution.";
    if (!whyNow.trim()) return "Please answer why you are seeking this now.";
    if (!declaration) return "Please accept the declaration to submit.";
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
        setResult({
          ok: false,
          status: "declined",
          message: "Security check failed. Please ensure JavaScript is enabled and try again.",
        });
        return;
      }

      const payload: StrategyRoomIntakePayload = {
        meta: {
          source: "web",
          page: "/consulting/strategy-room",
          submittedAtIso: new Date().toISOString(),
        },
        contact: { fullName: fullName.trim(), email: email.trim(), organisation: org.trim() },
        authority: {
          role: role === "Other" ? `Other: ${roleOther.trim()}` : role,
          hasAuthority,
          mandate: mandate.trim(),
        },
        decision: {
          statement: decision.trim(),
          type: decisionType,
          stuckReasons,
        },
        constraints: {
          nonRemovableConstraints: constraints.trim() || null,
          avoidedTradeOff: tradeOff.trim(),
          unacceptableOutcome: unacceptableOutcome.trim(),
        },
        timeCost: {
          costOfDelay: costDelay,
          affected: whoAffected.trim(),
          breaksFirst: breaksFirst.trim(),
        },
        readiness: {
          readyForUnpleasantDecision,
          willingAccountability,
          whyNow: whyNow.trim(),
        },
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
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Strategy Room intake submission failed:", error);
      setResult({
        ok: false,
        status: "declined",
        message: "Something went wrong while submitting. Please try again shortly.",
      });
    } finally {
      setLoading(false);
    }
  };

  const feedbackTone =
    result?.ok && result.status === "accepted"
      ? "border-emerald-500/60 bg-emerald-900/35 text-emerald-100"
      : "border-red-500/60 bg-red-900/35 text-red-100";

  // Avoid hydration drama: render consistent shell until mounted.
  if (!mounted) {
    return (
      <Layout title="Strategy Room Intake">
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  return (
    <Layout title="Strategy Room Intake">
      <Head>
        <title>Strategy Room Intake | Abraham of London</title>
        <meta
          name="description"
          content="Board-grade decision environments. This intake filters for authority, decision gravity, constraints, and readiness."
        />
        <link rel="canonical" href="https://www.abrahamoflondon.org/consulting/strategy-room" />
      </Head>

      <main className="min-h-screen bg-black text-cream">
        {/* HERO */}
        <section className="border-b border-white/10 bg-[#06060c]">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-softGold/70">
              Consulting · Board-grade decisions
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-cream sm:text-4xl">
              Strategy Room Intake
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-softGold/80 sm:text-base">
              This intake is required before any Strategy Room is scheduled. It is designed to surface decisions, not feelings.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm text-cream/85">
                If you are looking for advice, coaching, or validation, this is not the right place.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/resources/strategic-frameworks"
                  className="inline-flex items-center justify-center rounded-full border border-softGold/40 bg-black/50 px-4 py-2 text-sm font-semibold text-softGold transition hover:border-softGold/60 hover:bg-black/60"
                >
                  Start with Strategic Frameworks
                </Link>

                {!icAccess ? (
                  <Link
                    href="/inner-circle"
                    className="inline-flex items-center justify-center rounded-full bg-softGold px-4 py-2 text-sm font-semibold text-black transition hover:bg-softGold/90"
                  >
                    Inner Circle (higher signal)
                  </Link>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-900/30 px-4 py-2 text-sm font-semibold text-emerald-200">
                    Inner Circle access: active
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FORM */}
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
          <form
            onSubmit={onSubmit}
            className="space-y-8 rounded-3xl border border-softGold/35 bg-black/70 p-6 shadow-lg shadow-black/40 backdrop-blur sm:p-8"
          >
            {/* CONTACT */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-softGold/80">1 · Contact</p>
                <p className="mt-1 text-sm text-softGold/70">
                  Keep it clean. No nicknames. No theatre.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                    Full name
                  </span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                    placeholder="Your name"
                    autoComplete="name"
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                    Email
                  </span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    type="email"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  Organisation
                </span>
                <input
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className="w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                  placeholder="Company / Board / Independent"
                  required
                />
              </label>
            </div>

            {/* AUTHORITY */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-softGold/80">2 · Authority &amp; mandate</p>
                <p className="mt-1 text-sm text-softGold/70">
                  This room requires decision authority.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                    Role
                  </span>
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as typeof role)
                    }
                    className="w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                  >
                    <option>Founder/Owner</option>
                    <option>Board Member</option>
                    <option>Executive (delegated authority)</option>
                    <option>Advisor/Consultant</option>
                    <option>Other</option>
                  </select>
                </label>

                {role === "Other" ? (
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                      Role (specify)
                    </span>
                    <input
                      value={roleOther}
                      onChange={(e) => setRoleOther(e.target.value)}
                      className="w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                      placeholder="Your role"
                      required
                    />
                  </label>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-cream/80">
                      If your authority is indirect, say so. The room can still work, but we do not pretend.
                    </p>
                  </div>
                )}
              </div>

              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  Decision authority
                </legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(["Yes, fully", "Yes, with board approval", "No"] as const).map((v) => (
                    <label
                      key={v}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-softGold/20 bg-black/50 px-3 py-2 text-sm text-cream/85 hover:border-softGold/35"
                    >
                      <input
                        type="radio"
                        name="authority"
                        value={v}
                        checked={hasAuthority === v}
                        onChange={() => setHasAuthority(v)}
                      />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  Mandate you are operating under
                </span>
                <textarea
                  value={mandate}
                  onChange={(e) => setMandate(e.target.value)}
                  className="min-h-[110px] w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                  placeholder="What you are responsible for, and what success must look like."
                  required
                />
              </label>
            </div>

            {/* DECISION GRAVITY */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-softGold/80">3 · Decision gravity</p>
                <p className="mt-1 text-sm text-softGold/70">One decision only.</p>
              </div>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  The decision you cannot make right now
                </span>
                <textarea
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="min-h-[110px] w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                  placeholder="State it as a decision, not a story."
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  Decision type
                </span>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value as typeof decisionType)}
                  className="w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                >
                  <option>Irreversible</option>
                  <option>High-cost to reverse</option>
                  <option>Direction-setting</option>
                  <option>Personnel/authority-related</option>
                  <option>Capital allocation</option>
                  <option>Reputation/governance</option>
                </select>
              </label>

              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  Why the decision is stuck (select all that apply)
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      "Lack of clarity",
                      "Conflicting incentives",
                      "Political risk",
                      "Moral uncertainty",
                      "Incomplete information",
                      "Personal cost",
                    ] as const
                  ).map((v) => (
                    <label
                      key={v}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-cream/85 hover:border-softGold/25"
                    >
                      <input
                        type="checkbox"
                        checked={stuckReasons.includes(v)}
                        onChange={() => toggleMulti(v, stuckReasons, setStuckReasons)}
                      />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* CONSTRAINTS */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-softGold/80">4 · Constraints &amp; trade-offs</p>
                <p className="mt-1 text-sm text-softGold/70">Serious builders speak in constraints.</p>
              </div>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  Constraints that cannot be removed (optional, but high-signal)
                </span>
                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  className="min-h-[90px] w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                  placeholder="Time, capital, legal, cultural, moral limits."
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  The trade-off you are avoiding
                </span>
                <textarea
                  value={tradeOff}
                  onChange={(e) => setTradeOff(e.target.value)}
                  className="min-h-[90px] w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                  placeholder="What you know is required, but you are resisting."
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  What outcome would be unacceptable, even if it works
                </span>
                <textarea
                  value={unacceptableOutcome}
                  onChange={(e) => setUnacceptableOutcome(e.target.value)}
                  className="min-h-[90px] w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                  placeholder="This reveals values, not tactics."
                  required
                />
              </label>
            </div>

            {/* TIME & COST */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-softGold/80">5 · Time &amp; cost of delay</p>
                <p className="mt-1 text-sm text-softGold/70">Urgency must be measurable.</p>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  Cost of delaying this decision by 90 days (select all that apply)
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    ["Financial", "Reputational", "Cultural", "Personal authority", "Opportunity loss"] as const
                  ).map((v) => (
                    <label
                      key={v}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-cream/85 hover:border-softGold/25"
                    >
                      <input
                        type="checkbox"
                        checked={costDelay.includes(v)}
                        onChange={() => toggleMulti(v, costDelay, setCostDelay)}
                      />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  Who else is affected by this delay
                </span>
                <input
                  value={whoAffected}
                  onChange={(e) => setWhoAffected(e.target.value)}
                  className="w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                  placeholder="Names or roles. Not 'the team'."
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  If nothing changes, what breaks first
                </span>
                <textarea
                  value={breaksFirst}
                  onChange={(e) => setBreaksFirst(e.target.value)}
                  className="min-h-[90px] w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                  placeholder="Be specific."
                  required
                />
              </label>
            </div>

            {/* READINESS */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-softGold/80">6 · Readiness &amp; accountability</p>
                <p className="mt-1 text-sm text-softGold/70">This is where most applicants fail.</p>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  Are you prepared to leave with a decision you may not like
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["Yes", "No"] as const).map((v) => (
                    <label
                      key={v}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-cream/85 hover:border-softGold/25"
                    >
                      <input
                        type="radio"
                        name="unpleasant"
                        value={v}
                        checked={readyForUnpleasantDecision === v}
                        onChange={() => setReadyForUnpleasantDecision(v)}
                      />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  Are you willing to be held accountable to execution after the session
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["Yes", "No"] as const).map((v) => (
                    <label
                      key={v}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-cream/85 hover:border-softGold/25"
                    >
                      <input
                        type="radio"
                        name="accountability"
                        value={v}
                        checked={willingAccountability === v}
                        onChange={() => setWillingAccountability(v)}
                      />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80">
                  Why are you seeking this now, and not six months ago
                </span>
                <textarea
                  value={whyNow}
                  onChange={(e) => setWhyNow(e.target.value)}
                  className="min-h-[100px] w-full rounded-xl border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                  placeholder="Timing psychology matters."
                  required
                />
              </label>
            </div>

            {/* DECLARATION */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-softGold/80">Declaration</p>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-cream/85">
                <input
                  type="checkbox"
                  checked={declaration}
                  onChange={(e) => setDeclaration(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I understand that the Strategy Room is not advisory, coaching, or exploratory. It is a decision-making environment. I accept responsibility for outcomes.
                </span>
              </label>
            </div>

            {/* SUBMIT */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-softGold px-6 py-3 text-sm font-semibold text-black shadow-md transition hover:bg-softGold/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting…" : "Submit intake"}
              </button>

              <p className="text-xs text-softGold/65">
                Prefer reading first? Start with{" "}
                <Link href="/resources/strategic-frameworks" className="text-softGold underline hover:text-softGold/90">
                  Strategic Frameworks
                </Link>
                .
              </p>
            </div>

            {/* RESULT */}
            {result ? (
              <div className={`rounded-2xl border p-4 ${feedbackTone}`}>
                <p className="text-sm font-semibold">
                  {result.status === "accepted" ? "Accepted" : "Declined"}
                </p>
                <p className="mt-2 text-sm leading-relaxed">{result.message}</p>

                {result.status === "accepted" && result.nextUrl ? (
                  <p className="mt-3 text-sm">
                    Next:{" "}
                    <Link className="underline" href={result.nextUrl}>
                      {result.nextUrl}
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null}
          </form>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-softGold/80">What happens next</p>
            <ul className="mt-3 space-y-2 text-sm text-cream/80">
              <li>• If accepted, you will receive pre-read materials and scheduling instructions.</li>
              <li>• If declined, you will be directed to Canon and Framework resources instead of wasting a meeting.</li>
              <li>• This room is designed to produce a decision and an execution cadence.</li>
            </ul>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default StrategyRoomPage;