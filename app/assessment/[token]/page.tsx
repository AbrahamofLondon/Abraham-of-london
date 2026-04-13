'use client';

import * as React from 'react';
import { useRouter } from '@/lib/navigation-shim';
import { Zap, ShieldCheck, ArrowRight, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface AssessmentContext {
  participantId: string;
  campaignId: string;
  organisationName: string;
  status: string;
  isExecutive: boolean;
  teamName: string;
}

export default function EnterpriseAssessmentPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [context, setContext] = React.useState<AssessmentContext | null>(null);
  
  // OGR State: Using a record to match your Logic Engine requirements
  const [answers, setAnswers] = React.useState<Record<string, boolean>>({});

  // 1. Initial Identity Validation
  React.useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/alignment/enterprise/assessments?token=${params.token}`);
        const result = await res.json();

        if (!res.ok) throw new Error(result.error || "Access Denied");
        
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
    if (Object.keys(answers).length < 5) { // Minimum threshold for integrity
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
            {context?.organisationName} // <span className="text-white">Alignment Protocol</span>
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-[#8A6A2F]/10 border border-[#8A6A2F]/20">
          <div className="w-1.5 h-1.5 rounded-full bg-[#8A6A2F] animate-pulse" />
          <span className="text-[9px] uppercase tracking-widest text-[#8A6A2F] font-mono">Secure Node</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto pt-40 pb-24 px-6">
        {/* HEADER SECTION */}
        <header className="mb-20 space-y-4">
          <h1 className="text-5xl md:text-6xl font-serif font-light tracking-tighter leading-tight">
            The <span className="italic text-[#8A6A2F]">Sovereign</span> Assessment.
          </h1>
          <p className="text-zinc-500 text-sm max-w-lg leading-relaxed font-light">
            Finalize your institutional alignment. Your responses update the 
            <span className="text-zinc-300"> {context?.teamName} </span> 
            resonance within the registry.
          </p>
        </header>

        {/* ASSESSMENT NODES */}
        <section className="space-y-12 mb-20">
          {[
            { id: "q1", label: "Operational transparency is maintained across all levels." },
            { id: "q2", label: "Strategic objectives are synchronized with team execution." },
            { id: "q3", label: "Resource allocation is prioritized by institutional impact." },
            { id: "q4", label: "Decision-making follows the established Sovereign Protocol." },
            { id: "q5", label: "Data integrity is verified before strategic commitments." }
          ].map((q, idx) => (
            <div key={q.id} className="group relative border-l border-white/5 pl-8 py-2 hover:border-[#8A6A2F]/50 transition-colors">
              <span className="absolute left-[-1px] top-0 h-4 w-[1px] bg-[#8A6A2F]" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-[#8A6A2F] uppercase tracking-widest">Node {idx + 1}</span>
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

        {/* SUBMISSION FOOTER */}
        <footer className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4 text-zinc-600 font-mono text-[9px] uppercase tracking-[0.2em]">
            <Lock size={12} />
            <span>End-to-End Encrypted Registry Entry</span>
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
                Commit to Registry
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
