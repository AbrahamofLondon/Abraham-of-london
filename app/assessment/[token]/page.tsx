'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ShieldCheck, ArrowRight, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface AssessmentContext {
  kind?: "enterprise" | "team_assessment";
  participantId: string;
  campaignId: string;
  organisationName: string;
  campaignTitle?: string;
  status: string;
  isExecutive: boolean;
  teamName: string;
  anonymityMode?: "anonymous" | "attributed";
  domains?: string[];
}

const TEAM_DOMAIN_LABELS: Record<string, string> = {
  direction_priority: "I can name the team's top priority right now without checking.",
  execution_integrity: "This team has delivered at least one visible outcome this cycle that proves movement.",
  trust_communication: "I can say something uncomfortable here without being punished for it later.",
  authority_escalation: "When work gets blocked, it is clear who can make the decision.",
  priority_alignment: "If you asked five people here what matters most, their answers would mostly match.",
  consequence_awareness: "People here know what will happen if the current issue is not resolved.",
  leadership_consistency: "Leadership decisions and day-to-day priorities usually point in the same direction.",
  disagreement_quality: "The last serious disagreement produced a better decision, not a political wound.",
};

export default function EnterpriseAssessmentPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [context, setContext] = React.useState<AssessmentContext | null>(null);
  
  // OGR State: Using a record to match your Logic Engine requirements
  const [answers, setAnswers] = React.useState<Record<string, boolean>>({});
  const [teamAnswers, setTeamAnswers] = React.useState<Record<string, number>>({});

  // 1. Initial Identity Validation
  React.useEffect(() => {
    async function validateToken() {
      try {
        const teamRes = await fetch(`/api/team-assessment/respond/${params.token}`);
        const teamResult = await teamRes.json();
        if (teamRes.ok && teamResult?.ok && teamResult.kind === "team_assessment") {
          setContext({
            kind: "team_assessment",
            participantId: teamResult.invite.id,
            campaignId: teamResult.campaign.id,
            organisationName: teamResult.campaign.title,
            campaignTitle: teamResult.campaign.title,
            status: teamResult.invite.status,
            isExecutive: false,
            teamName: teamResult.invite.roleLabel || "Team respondent",
            anonymityMode: teamResult.anonymityMode,
            domains: Array.isArray(teamResult.campaign.domains) ? teamResult.campaign.domains : [],
          });
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/alignment/enterprise/assessments?token=${params.token}`);
        const result = await res.json();

        if (!res.ok) throw new Error(teamResult?.error || result.error || "Access Denied");
        
        if (result.data.status === 'completed') {
          router.push('/assessment/complete');
          return;
        }

        setContext(result.data);
      } catch (err: any) {
        toast.error(err.message);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    }
    validateToken();
  }, [params.token, router]);

  // 2. OGR Synchronization (Submission)
  const handleSubmit = async () => {
    if (context?.kind === "team_assessment") {
      const required = context.domains?.length ? context.domains : Object.keys(TEAM_DOMAIN_LABELS);
      if (required.some((domain) => typeof teamAnswers[domain] !== "number")) {
        toast.error("Please answer every team assessment domain.");
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch(`/api/team-assessment/respond/${params.token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: teamAnswers }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Submission failed.");
        toast.success("Team response submitted");
        router.push(`/assessment/success?mode=team&confidence=${result.aggregate?.confidence ?? 0}`);
      } catch (err: any) {
        toast.error(err.message);
        setSubmitting(false);
      }
      return;
    }

    if (Object.keys(answers).length < 5) { // Minimum answer count for an integrity read
      toast.error("Insufficient Data: Please complete all alignment nodes.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/alignment/enterprise/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token, answers }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success("Context Committed to Registry");
      router.push(`/assessment/success?score=${result.score}&band=${result.band}`);
    } catch (err: any) {
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  const toggleAnswer = (key: string) => {
    setAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setTeamAnswer = (key: string, value: number) => {
    setTeamAnswers(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-[#8A6A2F] animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#8A6A2F]/30 font-sans">
      {/* INSTITUTIONAL NAV */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#8A6A2F]" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-zinc-500">
            {context?.organisationName} · <span className="text-white">{context?.kind === "team_assessment" ? "Team Assessment" : "Institutional Assessment"}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-[#8A6A2F]/10 border border-[#8A6A2F]/20">
          <Lock size={10} className="text-[#8A6A2F]" />
          <span className="text-[9px] uppercase tracking-widest text-[#8A6A2F] font-mono">Confidential</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto pt-40 pb-24 px-6">
        {/* HEADER SECTION */}
        <header className="mb-20 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.4em] font-mono text-[#8A6A2F]">
            {context?.kind === "team_assessment" ? "Respondent assessment" : "Institutional assessment"}
          </p>
          <h1 className="text-4xl md:text-5xl font-serif font-light tracking-tighter leading-tight">
            {context?.kind === "team_assessment" ? "Team" : "Institutional"}{" "}
            <span className="italic text-[#8A6A2F]">assessment.</span>
          </h1>
          <p className="text-zinc-500 text-sm max-w-lg leading-relaxed font-light">
            {context?.kind === "team_assessment"
              ? "Rate your own experience of the team condition. Answer from your genuine observation, not what you think leadership wants to hear."
              : "Your responses contribute to the institutional reading for"}
            {" "}<span className="text-zinc-300">{context?.teamName}</span>.
            {" "}Responses are aggregated anonymously. Individual answers are not attributed.
          </p>
        </header>

        {/* ASSESSMENT NODES */}
        {context?.kind === "team_assessment" ? (
          <section className="space-y-10 mb-20">
            {(context.domains?.length ? context.domains : Object.keys(TEAM_DOMAIN_LABELS)).map((domain, idx) => (
              <div key={domain} className="border-l border-white/5 pl-8 py-2">
                <span className="text-[9px] font-mono text-[#8A6A2F] uppercase tracking-widest">Domain {idx + 1}</span>
                <p className="mt-2 text-xl text-zinc-300">{TEAM_DOMAIN_LABELS[domain] || domain.replace(/_/g, " ")}</p>
                <div className="mt-5 grid grid-cols-5 gap-2">
                  {[20, 40, 60, 80, 100].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTeamAnswer(domain, value)}
                      className={`border px-3 py-3 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                        teamAnswers[domain] === value
                          ? "border-[#8A6A2F] bg-[#8A6A2F]/20 text-[#C9A96E]"
                          : "border-white/10 text-zinc-500 hover:border-[#8A6A2F]/40"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="space-y-12 mb-20">
            {[
            { id: "q1", label: "I know what the organisation's top priority is without having to ask." },
            { id: "q2", label: "What leadership says matters and what actually gets resourced are usually the same thing." },
            { id: "q3", label: "When a decision gets stuck, I know who can unstick it." },
            { id: "q4", label: "I would raise an uncomfortable concern if I believed it mattered." },
            { id: "q5", label: "The last major change here improved the work, not just the structure around the work." }
            ].map((q, idx) => (
              <div key={q.id} className="group relative border-l border-white/5 pl-8 py-2 hover:border-[#8A6A2F]/50 transition-colors">
                <span className="absolute left-[-1px] top-0 h-4 w-[1px] bg-[#8A6A2F]" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-[#8A6A2F] uppercase tracking-widest">Statement {idx + 1}</span>
                    <p className="text-xl text-zinc-400 group-hover:text-white transition-colors">{q.label}</p>
                  </div>
                  <button
                    onClick={() => toggleAnswer(q.id)}
                    className={`relative w-16 h-8 border transition-all duration-500 flex items-center px-1 ${
                      answers[q.id] ? "bg-[#8A6A2F]/20 border-[#8A6A2F]/50" : "bg-transparent border-white/10"
                    }`}
                  >
                    <div className={`w-6 h-6 transition-all duration-500 ${
                      answers[q.id] ? "translate-x-8 bg-[#8A6A2F]" : "translate-x-0 bg-zinc-800"
                    }`} />
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* SUBMISSION FOOTER */}
        <footer className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4 text-zinc-600 font-mono text-[9px] uppercase tracking-[0.2em]">
            <Lock size={12} />
            <span>Responses are confidential and anonymously aggregated</span>
          </div>
          
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="group w-full md:w-auto flex items-center justify-center gap-4 px-10 py-4 bg-[#8A6A2F] text-black font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-white transition-all duration-500 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Submit response
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
        </footer>
      </div>

      {/* BACKGROUND DECOR */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('/grain.png')] z-0" />
    </main>
  );
}
