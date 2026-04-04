"use client";

import * as React from "react";
import Link from "next/link";
import {
  ALIGNMENT_DOMAIN_LABELS,
  ALIGNMENT_DOMAIN_ORDER,
  PURPOSE_ALIGNMENT_QUESTIONS,
  type AlignmentDomain,
  type AlignmentQuestion,
} from "@/lib/alignment/checklist";
import {
  ArrowRight,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Crown,
  Eye,
  Globe,
  Heart,
  LayoutGrid,
  LineChart,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

type LikertValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type AnswerValue = {
  resonance: LikertValue;
  certainty: LikertValue;
};

type DomainComputed = {
  domain: AlignmentDomain;
  resonanceAvg: number;
  certaintyAvg: number;
  rawScore: number;
  weightedScore: number;
  strength: "strong" | "developing" | "weak" | "critical";
  answeredCount: number;
};

type PreviewRoute = "FOUNDATION" | "TEAM" | "ENTERPRISE" | "STRATEGY_ROOM";

const STORAGE_KEY = "aol-purpose-alignment-v3";
const AUTO_SAVE_DELAY_MS = 800;

const RESONANCE_LABELS = [
  "Completely misaligned",
  "Severely misaligned",
  "Mostly misaligned",
  "Meaningfully misaligned",
  "Slightly misaligned",
  "Mixed / uncertain",
  "Slightly aligned",
  "Solidly aligned",
  "Strongly aligned",
  "Highly aligned",
  "Fully aligned",
] as const;

const CERTAINTY_LABELS = [
  "No certainty",
  "Very low certainty",
  "Low certainty",
  "Limited certainty",
  "Some certainty",
  "Moderate certainty",
  "Reasonable certainty",
  "Strong certainty",
  "High certainty",
  "Very high certainty",
  "Absolute certainty",
] as const;

const DOMAIN_ICONS: Partial<Record<AlignmentDomain, React.ElementType>> = {
  IDENTITY: ShieldCheck,
  DECISION: Crown,
  ENVIRONMENT: Globe,
  BEHAVIOUR: Users,
  EMOTIONAL_ORDER: Heart,
  LEGACY: Compass,
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function toLikert(value: number): LikertValue {
  return clamp(Math.round(value), 0, 10) as LikertValue;
}

function getBand(percent: number): "aligned" | "drifting" | "misaligned" | "disordered" {
  if (percent >= 80) return "aligned";
  if (percent >= 60) return "drifting";
  if (percent >= 40) return "misaligned";
  return "disordered";
}

function getBandMeta(band: ReturnType<typeof getBand>) {
  switch (band) {
    case "aligned":
      return {
        label: "Aligned",
        chip: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
        bar: "bg-emerald-400",
        summary: "Direction and reality are materially coherent.",
      };
    case "drifting":
      return {
        label: "Drifting",
        chip: "border-amber-400/25 bg-amber-500/10 text-amber-300",
        bar: "bg-amber-300",
        summary: "The centre is holding, but drift is beginning to tax execution.",
      };
    case "misaligned":
      return {
        label: "Misaligned",
        chip: "border-orange-400/25 bg-orange-500/10 text-orange-300",
        bar: "bg-orange-300",
        summary: "Declared direction and lived reality are starting to separate.",
      };
    default:
      return {
        label: "Disordered",
        chip: "border-red-400/25 bg-red-500/10 text-red-300",
        bar: "bg-red-400",
        summary: "The present structure is not carrying weight cleanly enough.",
      };
  }
}

function getStrength(weightedScore: number): DomainComputed["strength"] {
  if (weightedScore >= 80) return "strong";
  if (weightedScore >= 60) return "developing";
  if (weightedScore >= 40) return "weak";
  return "critical";
}

function getStrengthTone(strength: DomainComputed["strength"]) {
  switch (strength) {
    case "strong":
      return "text-emerald-300";
    case "developing":
      return "text-amber-300";
    case "weak":
      return "text-orange-300";
    default:
      return "text-red-300";
  }
}

function safeDomainIcon(domain: AlignmentDomain): React.ElementType {
  return DOMAIN_ICONS[domain] ?? LayoutGrid;
}

function computeDomainScore(
  domain: AlignmentDomain,
  questions: AlignmentQuestion[],
  answers: Record<string, AnswerValue>,
): DomainComputed {
  const resonanceValues: number[] = [];
  const certaintyValues: number[] = [];
  let answeredCount = 0;

  for (const question of questions) {
    const answer = answers[question.id];
    const resonance = answer?.resonance ?? 5;
    const certainty = answer?.certainty ?? 5;

    resonanceValues.push(resonance);
    certaintyValues.push(certainty);

    if (!(resonance === 5 && certainty === 5)) {
      answeredCount += 1;
    }
  }

  const resonanceAvg = average(resonanceValues);
  const certaintyAvg = average(certaintyValues);
  const rawScore = clamp(Math.round(resonanceAvg * 10), 0, 100);
  const weightedScore = clamp(Math.round(rawScore * (0.55 + certaintyAvg / 20)), 0, 100);

  return {
    domain,
    resonanceAvg: round1(resonanceAvg),
    certaintyAvg: round1(certaintyAvg),
    rawScore,
    weightedScore,
    strength: getStrength(weightedScore),
    answeredCount,
  };
}

function getPreviewRoute(args: {
  score: number;
  clarity: number;
  weakestDomains: AlignmentDomain[];
  completionPercent: number;
}): {
  route: PreviewRoute;
  title: string;
  description: string;
  href: string;
  cta: string;
} {
  const { score, clarity, weakestDomains, completionPercent } = args;
  const weakSet = new Set(weakestDomains);

  if (completionPercent < 35) {
    return {
      route: "FOUNDATION",
      title: "Not enough signal yet",
      description: "The system needs more truthful differentiation before it should tell you what comes next.",
      href: "#assessment",
      cta: "Complete the assessment",
    };
  }

  if (score >= 82 && clarity >= 78) {
    return {
      route: "STRATEGY_ROOM",
      title: "This looks like escalation territory",
      description:
        "The signal suggests a serious operator problem, not casual self-improvement. The next useful room is governed advisory.",
      href: "/strategy-room",
      cta: "Enter Strategy Room",
    };
  }

  if (weakSet.has("BEHAVIOUR" as AlignmentDomain) || weakSet.has("ENVIRONMENT" as AlignmentDomain)) {
    return {
      route: "TEAM",
      title: "The next signal is probably operating-team level",
      description:
        "The issue may not be private conviction alone. It may already be affecting execution, coordination, and alignment around you.",
      href: "/diagnostics/team-alignment",
      cta: "Open Team Alignment",
    };
  }

  if (weakSet.has("DECISION" as AlignmentDomain) || weakSet.has("LEGACY" as AlignmentDomain)) {
    return {
      route: "ENTERPRISE",
      title: "This is drifting into institutional territory",
      description:
        "The pressure looks bigger than motivation. It smells like governance, authority, and strategic consequence.",
      href: "/diagnostics/enterprise",
      cta: "Open Enterprise Diagnostic",
    };
  }

  return {
    route: "FOUNDATION",
    title: "Start by tightening the core structure",
    description:
      "The present reading suggests foundational correction before heavier escalation. That is not defeat. That is honesty.",
    href: "/diagnostics",
    cta: "Browse Diagnostics",
  };
}

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

function SectionShell({
  eyebrow,
  title,
  description,
  aside,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <div className="flex flex-col gap-4 border-b border-white/[0.07] px-6 py-5 sm:px-8 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {eyebrow ? (
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#C9A96A]">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">{title}</h2>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">{description}</p> : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      <div className="px-6 py-6 sm:px-8">{children}</div>
    </section>
  );
}

function ScoreCard({
  icon: Icon,
  label,
  value,
  sublabel,
  barClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sublabel?: string;
  barClassName: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
            <Icon className="h-4 w-4 text-white/80" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</div>
            {sublabel ? <div className="mt-1 text-xs text-white/50">{sublabel}</div> : null}
          </div>
        </div>
        <div className="text-2xl font-light text-white">{value}%</div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={cn("h-full rounded-full transition-all duration-500", barClassName)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function DomainQuestionCard({
  id,
  statement,
  domain,
  resonance,
  certainty,
  onResonanceChange,
  onCertaintyChange,
}: {
  id: string;
  statement: string;
  domain: AlignmentDomain;
  resonance: LikertValue;
  certainty: LikertValue;
  onResonanceChange: (id: string, value: LikertValue) => void;
  onCertaintyChange: (id: string, value: LikertValue) => void;
}) {
  const Icon = safeDomainIcon(domain);
  const signalGap = Math.abs(resonance - certainty);
  const signalTone = resonance >= 8 ? "strong" : resonance <= 3 ? "weak" : "mixed";

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-5 transition-all hover:border-white/[0.14] hover:bg-white/[0.03]">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 rounded-2xl border border-[#C9A96A]/20 bg-[#C9A96A]/10 p-2">
          <Icon className="h-4 w-4 text-[#C9A96A]" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-7 text-white/90">{statement}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Pill
              className={
                signalTone === "strong"
                  ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                  : signalTone === "weak"
                    ? "border-red-400/25 bg-red-500/10 text-red-300"
                    : "border-amber-400/25 bg-amber-500/10 text-amber-300"
              }
            >
              {signalTone === "strong"
                ? "Strong alignment signal"
                : signalTone === "weak"
                  ? "Weak alignment signal"
                  : "Mixed signal"}
            </Pill>

            {signalGap >= 4 ? (
              <Pill className="border-orange-400/25 bg-orange-500/10 text-orange-300">
                Certainty gap detected
              </Pill>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-[0.16em] text-white/45">Resonance</span>
            <span className={cn("text-xs font-medium", resonance >= 8 ? "text-emerald-300" : resonance <= 3 ? "text-red-300" : "text-[#C9A96A]")}>
              {RESONANCE_LABELS[resonance]}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={resonance}
            onChange={(e) => onResonanceChange(id, toLikert(Number(e.target.value)))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#C9A96A]"
          />
          <div className="mt-2 flex justify-between text-[11px] text-white/30">
            <span>0</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-[0.16em] text-white/45">Certainty</span>
            <span className="text-xs font-medium text-white/70">{CERTAINTY_LABELS[certainty]}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={certainty}
            onChange={(e) => onCertaintyChange(id, toLikert(Number(e.target.value)))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-400"
          />
          <div className="mt-2 flex justify-between text-[11px] text-white/30">
            <span>0</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DomainSummaryCard({
  score,
  questions,
  expanded,
  onToggle,
  children,
}: {
  score: DomainComputed;
  questions: AlignmentQuestion[];
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Icon = safeDomainIcon(score.domain);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-black/30">
      <button onClick={onToggle} className="w-full px-5 py-5 text-left transition hover:bg-white/[0.03] sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="rounded-2xl border border-[#C9A96A]/20 bg-[#C9A96A]/10 p-2.5">
              <Icon className="h-5 w-5 text-[#C9A96A]" />
            </div>

            <div className="min-w-0">
              <div className="text-lg font-medium text-white">
                {ALIGNMENT_DOMAIN_LABELS[score.domain] ?? String(score.domain)}
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className={cn("text-xs font-medium", getStrengthTone(score.strength))}>
                  {score.strength.toUpperCase()}
                </span>
                <span className="text-xs text-white/45">Resonance {score.resonanceAvg}/10</span>
                <span className="text-xs text-white/45">Certainty {score.certaintyAvg}/10</span>
                <span className="text-xs text-white/45">{score.answeredCount}/{questions.length} answered</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-light text-white">{score.weightedScore}%</div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">weighted</div>
            </div>
            {expanded ? <ChevronUp className="h-5 w-5 text-white/45" /> : <ChevronDown className="h-5 w-5 text-white/45" />}
          </div>
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-white/[0.06] px-5 pb-5 pt-5 sm:px-6">
          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <ScoreCard icon={LayoutGrid} label="Raw score" value={score.rawScore} barClassName="bg-[#C9A96A]" />
            <ScoreCard icon={ShieldCheck} label="Confidence" value={Math.round(score.certaintyAvg * 10)} barClassName="bg-emerald-400" />
            <ScoreCard icon={BarChart3} label="Weighted output" value={score.weightedScore} barClassName="bg-sky-400" />
          </div>

          <div className="grid gap-5">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

export default function PurposeAlignmentAssessment() {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ALIGNMENT_DOMAIN_ORDER.forEach((domain, index) => {
      initial[String(domain)] = index < 2;
    });
    return initial;
  });

  const defaultAnswers = useMemo(() => {
    const initial: Record<string, AnswerValue> = {};
    PURPOSE_ALIGNMENT_QUESTIONS.forEach((question) => {
      initial[question.id] = { resonance: 5, certainty: 5 };
    });
    return initial;
  }, []);

  useEffect(() => {
    setAnswers(defaultAnswers);
  }, [defaultAnswers]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        answers?: Record<string, AnswerValue>;
        notes?: string;
        expandedDomains?: Record<string, boolean>;
      };

      if (parsed.answers && Object.keys(parsed.answers).length > 0) {
        setAnswers((prev) => ({ ...prev, ...parsed.answers }));
      }
      if (typeof parsed.notes === "string") setNotes(parsed.notes);
      if (parsed.expandedDomains) {
        setExpandedDomains((prev) => ({ ...prev, ...parsed.expandedDomains }));
      }
    } catch {
      //
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, notes, expandedDomains }));
        setSavingDraft(true);
        window.setTimeout(() => setSavingDraft(false), 500);
      } catch {
        //
      }
    }, AUTO_SAVE_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [answers, notes, expandedDomains]);

  const groupedQuestions = useMemo(() => {
    const grouped: Record<string, AlignmentQuestion[]> = {};
    ALIGNMENT_DOMAIN_ORDER.forEach((domain) => {
      grouped[String(domain)] = PURPOSE_ALIGNMENT_QUESTIONS.filter((q) => q.domain === domain);
    });
    return grouped;
  }, []);

  const domainScores = useMemo(() => {
    const scores: Record<string, DomainComputed> = {};
    ALIGNMENT_DOMAIN_ORDER.forEach((domain) => {
      scores[String(domain)] = computeDomainScore(domain, groupedQuestions[String(domain)] ?? [], answers);
    });
    return scores;
  }, [groupedQuestions, answers]);

  const totalQuestions = PURPOSE_ALIGNMENT_QUESTIONS.length;

  const answeredCount = useMemo(() => {
    return PURPOSE_ALIGNMENT_QUESTIONS.filter((question) => {
      const answer = answers[question.id];
      if (!answer) return false;
      return !(answer.resonance === 5 && answer.certainty === 5);
    }).length;
  }, [answers]);

  const completionPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const allWeighted = ALIGNMENT_DOMAIN_ORDER.map((domain) => domainScores[String(domain)]?.weightedScore ?? 50);
  const score = Math.round(average(allWeighted));
  const clarity = Math.round(
    average(ALIGNMENT_DOMAIN_ORDER.map((domain) => (domainScores[String(domain)]?.certaintyAvg ?? 5) * 10)),
  );

  const weakestDomains = [...ALIGNMENT_DOMAIN_ORDER]
    .sort((a, b) => (domainScores[String(a)]?.weightedScore ?? 50) - (domainScores[String(b)]?.weightedScore ?? 50))
    .slice(0, 2);

  const strongestDomains = [...ALIGNMENT_DOMAIN_ORDER]
    .sort((a, b) => (domainScores[String(b)]?.weightedScore ?? 50) - (domainScores[String(a)]?.weightedScore ?? 50))
    .slice(0, 2);

  const band = getBand(score);
  const bandMeta = getBandMeta(band);

  const preview = getPreviewRoute({
    score,
    clarity,
    weakestDomains,
    completionPercent,
  });

  const strongestDomainLabels = strongestDomains.map((domain) => ALIGNMENT_DOMAIN_LABELS[domain] ?? String(domain));
  const weakestDomainLabels = weakestDomains.map((domain) => ALIGNMENT_DOMAIN_LABELS[domain] ?? String(domain));

  const handleResonanceChange = useCallback((id: string, value: LikertValue) => {
    setAnswers((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { resonance: 5, certainty: 5 }), resonance: value } }));
    setError(null);
  }, []);

  const handleCertaintyChange = useCallback((id: string, value: LikertValue) => {
    setAnswers((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { resonance: 5, certainty: 5 }), certainty: value } }));
    setError(null);
  }, []);

  const toggleDomain = useCallback((domain: AlignmentDomain) => {
    const key = String(domain);
    setExpandedDomains((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const expandAll = useCallback(() => {
    const next: Record<string, boolean> = {};
    ALIGNMENT_DOMAIN_ORDER.forEach((domain) => (next[String(domain)] = true));
    setExpandedDomains(next);
  }, []);

  const collapseAll = useCallback(() => {
    const next: Record<string, boolean> = {};
    ALIGNMENT_DOMAIN_ORDER.forEach((domain) => (next[String(domain)] = false));
    setExpandedDomains(next);
  }, []);

  const clearDraft = useCallback(() => {
    if (!window.confirm("Clear all answers, notes, and the saved local draft?")) return;
    setAnswers(defaultAnswers);
    setNotes("");
    setError(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, [defaultAnswers]);

  const handleSubmit = useCallback(async () => {
    if (answeredCount < totalQuestions) {
      setError(`Complete all ${totalQuestions} questions. ${totalQuestions - answeredCount} remain.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.location.href = preview.href;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue.");
    } finally {
      setSubmitting(false);
    }
  }, [answeredCount, totalQuestions, preview.href]);

  return (
    <main id="assessment" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="relative overflow-hidden rounded-[36px] border border-white/[0.08] bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,169,106,0.16),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(201,169,106,0.08),transparent_24%)]" />
        <div className="relative z-10 px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
          <div className="flex flex-wrap items-center gap-3">
            <Pill className="border-[#C9A96A]/20 bg-[#C9A96A]/10 text-[#E6C27A]">Initial Assessment</Pill>
            <Pill className="border-white/10 bg-white/5 text-white/60">Private session</Pill>
            <Pill className="border-white/10 bg-white/5 text-white/60">Live route preview</Pill>
          </div>

          <div className="mt-7 grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#C9A96A]">
                Alignment Intelligence
              </div>
              <h1 className="mt-5 max-w-4xl font-serif text-4xl font-light leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
                The first serious reading of whether your stated direction and your lived structure are even telling the same story.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-white/65 sm:text-lg">
                This is not therapy theatre and not motivational fluff. It is a clean first-pass diagnostic across identity,
                decisions, environment, behaviour, emotional order, and legacy pressure.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
                  <Lock className="h-3.5 w-3.5 text-white/55" />
                  No account required
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
                  Governed preview
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
                  <Sparkles className="h-3.5 w-3.5 text-[#C9A96A]" />
                  Tantaliser, not the whole cathedral
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <ScoreCard
                icon={LineChart}
                label="Completion"
                value={completionPercent}
                sublabel={`${answeredCount} of ${totalQuestions} active responses`}
                barClassName="bg-[#C9A96A]"
              />
              <ScoreCard
                icon={Target}
                label="Live score"
                value={score}
                sublabel={bandMeta.summary}
                barClassName={bandMeta.bar}
              />
              <ScoreCard
                icon={Eye}
                label="Clarity"
                value={clarity}
                sublabel={savingDraft ? "Saving local draft..." : "Draft active"}
                barClassName="bg-sky-400"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionShell
          eyebrow="Immediate reading"
          title="What the current signal suggests"
          description="Enough to sharpen appetite. Not enough to replace the deeper instruments."
          aside={
            <div className="flex flex-wrap gap-2">
              <Pill className={bandMeta.chip}>{bandMeta.label}</Pill>
              <Pill className="border-[#C9A96A]/20 bg-[#C9A96A]/10 text-[#E6C27A]">{preview.route.replaceAll("_", " ")}</Pill>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <ScoreCard icon={TrendingUp} label="Structural alignment" value={score} barClassName={bandMeta.bar} />
            <ScoreCard icon={Crown} label="Clarity" value={clarity} barClassName="bg-[#C9A96A]" />
            <ScoreCard icon={ShieldCheck} label="Completion quality" value={completionPercent} barClassName="bg-emerald-400" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-white/45">Strongest domains</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {strongestDomainLabels.map((label) => (
                  <Pill key={label} className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                    {label}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-white/45">Weakest domains</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {weakestDomainLabels.map((label) => (
                  <Pill key={label} className="border-amber-400/20 bg-amber-500/10 text-amber-300">
                    {label}
                  </Pill>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/[0.08] bg-black/30 p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">Likely next move</div>
            <div className="mt-3 text-xl font-semibold text-white">{preview.title}</div>
            <p className="mt-3 text-sm leading-6 text-white/65">{preview.description}</p>
            <div className="mt-5">
              <Link
                href={preview.href}
                className="inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/25 bg-[#C9A96A]/10 px-4 py-2 text-sm font-medium text-[#E6C27A] transition hover:bg-[#C9A96A]/18"
              >
                {preview.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Why this exists"
          title="This is the foyer, not the whole building"
          description="The point is to reveal enough truth that serious people want the deeper instruments."
        >
          <div className="space-y-4">
            {[
              "It gives a first disciplined reading without forcing the user into heavy enterprise detail immediately.",
              "It exposes whether the problem is private, team-level, institutional, or already advisory-grade.",
              "It creates appetite for the next room by proving there is actually a structure behind the language.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-black/30 p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                <span className="text-sm leading-6 text-white/68">{item}</span>
              </div>
            ))}

            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-amber-300">Commercial logic</div>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Weak signal should not be sold Strategy Room. Strong signal should not be left wandering in content. This first layer exists to sort the traffic honestly.
              </p>
            </div>
          </div>
        </SectionShell>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <SectionShell
            eyebrow="Assessment domains"
            title="Review each operating domain"
            description="Rate both lived resonance and certainty."
            aside={
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={expandAll}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10"
                >
                  Expand all
                </button>
                <button
                  onClick={collapseAll}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10"
                >
                  Collapse all
                </button>
              </div>
            }
          >
            <div className="space-y-6">
              {ALIGNMENT_DOMAIN_ORDER.map((domain) => {
                const key = String(domain);
                const scoreItem = domainScores[key];
                const questions = groupedQuestions[key] ?? [];
                const expanded = !!expandedDomains[key];

                return (
                  <DomainSummaryCard
                    key={key}
                    score={scoreItem}
                    questions={questions}
                    expanded={expanded}
                    onToggle={() => toggleDomain(domain)}
                  >
                    {questions.map((question) => {
                      const answer = answers[question.id] ?? { resonance: 5 as LikertValue, certainty: 5 as LikertValue };

                      return (
                        <DomainQuestionCard
                          key={question.id}
                          id={question.id}
                          statement={question.statement}
                          domain={question.domain}
                          resonance={answer.resonance}
                          certainty={answer.certainty}
                          onResonanceChange={handleResonanceChange}
                          onCertaintyChange={handleCertaintyChange}
                        />
                      );
                    })}
                  </DomainSummaryCard>
                );
              })}
            </div>
          </SectionShell>

          <SectionShell
            eyebrow="Notes"
            title="Additional context"
            description="Use this space for context that should sit alongside the scored answers."
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              className="w-full rounded-3xl border border-white/[0.08] bg-black/35 px-5 py-4 text-sm leading-7 text-white placeholder:text-white/28 focus:border-[#C9A96A]/40 focus:outline-none"
              placeholder="Add any recurring pattern, pressure point, structural frustration, or context worth holding in view."
            />
          </SectionShell>
        </div>

        <div className="space-y-8 xl:sticky xl:top-6 xl:self-start">
          <SectionShell
            eyebrow="Action"
            title="Move to the next room"
            description="Complete the review and let the system route you to the right depth."
          >
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill className={bandMeta.chip}>{bandMeta.label}</Pill>
                  <Pill className="border-white/10 bg-white/5 text-white/60">{answeredCount}/{totalQuestions} answered</Pill>
                </div>

                <p className="mt-4 text-sm leading-6 text-white/60">
                  {answeredCount === totalQuestions
                    ? "The initial reading is complete. Proceed to the right next instrument."
                    : `Finish the remaining ${totalQuestions - answeredCount} responses to unlock the proper next route.`}
                </p>

                {error ? (
                  <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || answeredCount !== totalQuestions}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-medium transition",
                  answeredCount === totalQuestions
                    ? "bg-[#C9A96A] text-black hover:bg-[#E6C27A]"
                    : "cursor-not-allowed bg-white/10 text-white/35",
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opening next route
                  </>
                ) : (
                  <>
                    {preview.cta}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                onClick={clearDraft}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <AlertTriangle className="h-4 w-4" />
                Clear saved draft
              </button>

              <div className="text-xs text-white/45">
                {savingDraft ? "Saving local draft..." : "Draft saved locally."}
              </div>
            </div>
          </SectionShell>

          <SectionShell
            eyebrow="Escalation ladder"
            title="Where this can lead"
            description="The system should feel intentional, not random."
          >
            <div className="space-y-3">
              {[
                { label: "Initial Assessment", active: true },
                { label: "Team Alignment", active: preview.route === "TEAM" || preview.route === "ENTERPRISE" || preview.route === "STRATEGY_ROOM" },
                { label: "Enterprise Diagnostic", active: preview.route === "ENTERPRISE" || preview.route === "STRATEGY_ROOM" },
                { label: "Strategy Room", active: preview.route === "STRATEGY_ROOM" },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/30 p-3">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border text-xs", step.active ? "border-[#C9A96A]/30 bg-[#C9A96A]/10 text-[#E6C27A]" : "border-white/10 text-white/35")}>
                    {idx + 1}
                  </div>
                  <div className={cn("text-sm", step.active ? "text-white" : "text-white/42")}>{step.label}</div>
                </div>
              ))}
            </div>
          </SectionShell>
        </div>
      </div>
    </main>
  );
}