import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ShieldCheck, Lock, ChevronLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { DissonanceMatrix } from "@/components/admin/reporting/dissonance-matrix";
import { InterventionProposal } from "@/components/admin/reporting/intervention-proposal";

export default async function ExecutiveReportPage({ params }: { params: { id: string } }) {
  // 1. Fetch Campaign and Participants with established status
  const campaign = await db.alignmentCampaign.findUnique({
    where: { id: params.id },
    include: { 
      organisation: true,
      participants: {
        where: { status: 'completed' },
        include: { responses: true } // Assuming responses exist for calculation
      }
    }
  });

  if (!campaign) notFound();

  // 2. SOVEREIGN ANONYMITY GUARD
  const ANONYMITY_THRESHOLD = 5;
  const participantCount = campaign.participants.length;

  if (participantCount < ANONYMITY_THRESHOLD) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] p-8">
        <div className="max-w-md w-full bg-white p-12 shadow-sm border border-neutral-100 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-6" />
          <h2 className="text-xl font-medium text-neutral-900 mb-2">Threshold Warning</h2>
          <p className="text-sm text-neutral-500 leading-relaxed mb-8">
            The Executive Snapshot is locked. Institutional anonymity requires a minimum of {ANONYMITY_THRESHOLD} completed responses.
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
            <span>Current: {participantCount}</span>
            <span className="h-px w-4 bg-neutral-200" />
            <span>Required: {ANONYMITY_THRESHOLD}</span>
          </div>
          <Link 
            href={`/admin/campaigns/${params.id}`}
            className="mt-10 inline-block px-6 py-3 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
          >
            Return to Registry
          </Link>
        </div>
      </div>
    );
  }

  // 3. RESONANCE CALCULATION
  // In a real scenario, these would be derived from the 'responses' relation
  const resonanceMetrics = [
    { label: "Strategic Intent", intent: 95, reality: 72 },
    { label: "Operational Clarity", intent: 88, reality: 45 },
    { label: "Leadership Trust", intent: 92, reality: 58 },
    { label: "Cultural Cohesion", intent: 85, reality: 79 },
  ];

  const overallDissonance = resonanceMetrics.reduce((acc, m) => acc + (m.intent - m.reality), 0) / resonanceMetrics.length;

  return (
    <div className="min-h-screen bg-[#F8F8F6] p-8 font-serif print:bg-white print:p-0 selection:bg-[#8A6A2F] selection:text-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Report Controls */}
        <div className="mb-12 flex justify-between items-center print:hidden">
           <Link 
            href={`/admin/campaigns/${params.id}`}
            className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" /> Back to Registry
          </Link>
          <button 
            onClick={() => window.print()}
            className="text-[10px] font-mono uppercase tracking-widest px-4 py-2 border border-neutral-200 hover:border-neutral-900 transition-all"
          >
            Download Protocol (PDF)
          </button>
        </div>

        {/* Report Document */}
        <div className="bg-white shadow-lg print:shadow-none relative overflow-hidden">
          {/* Edge line for institutional feel */}
          <div className="absolute top-0 left-0 w-1 h-full bg-neutral-100" />
          
          <div className="px-12 py-16 print:px-8 print:py-12">
            
            {/* Header */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <span className="h-px w-8 bg-[#8A6A2F]" />
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#8A6A2F]">Institutional Alignment Registry</span>
              </div>
              
              <h1 className="text-6xl font-light tracking-tight text-neutral-900 mb-6 leading-[1.1]">
                Resonance
                <br />
                <span className="font-medium italic">Snapshot</span>
              </h1>
              
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-neutral-100">
                <div>
                  <p className="text-[8px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Entity</p>
                  <p className="text-xs font-medium text-neutral-700 uppercase tracking-tight">{campaign.organisation.name}</p>
                </div>
                <div>
                  <p className="text-[8px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Protocol Period</p>
                  <p className="text-xs font-medium text-neutral-700">Q1 2026 // Active</p>
                </div>
                <div>
                  <p className="text-[8px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Classification</p>
                  <div className="flex items-center gap-2">
                    <Lock className="w-2.5 h-2.5 text-[#8A6A2F]" />
                    <p className="text-xs font-medium text-neutral-500">Client Confidential</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-20">
              <div className="max-w-2xl">
                <p className="text-xl leading-relaxed text-neutral-600 font-light tracking-wide">
                  The organisation exhibits a <span className="text-neutral-900 font-medium italic underline decoration-[#8A6A2F] decoration-2 underline-offset-4">structural friction delta</span> of <span className="text-neutral-900 font-semibold">{Math.round(overallDissonance)}%</span>. Strategic intent is currently diluted through operational layers, causing significant resonance leakage.
                </p>
              </div>
            </div>

            {/* Dissonance Matrix Component */}
            <div className="mb-20">
              <DissonanceMatrix metrics={resonanceMetrics} />
            </div>

            {/* Intervention Proposal (Print Hidden) */}
            <section className="mb-24 print:hidden">
              <InterventionProposal metrics={resonanceMetrics} />
            </section>

            {/* Closing Footer */}
            <footer className="pt-12 border-t border-neutral-100">
              <div className="flex justify-between items-end">
                <div className="max-w-md">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-2">Strategic Recommendation</p>
                  <p className="text-xs leading-relaxed text-neutral-500 italic">
                    Immediate structural realignment advised. Priority intervention required in the <span className="text-neutral-900 font-bold">Operational Clarity</span> domain to prevent mission drift.
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-32 h-px bg-neutral-200 mb-3 ml-auto" />
                  <p className="text-[9px] font-mono uppercase tracking-wider text-neutral-400">Registry Verified</p>
                  <p className="text-xs font-medium text-neutral-800 mt-1 uppercase tracking-tighter">Sovereign Protocol v1.4</p>
                </div>
              </div>
            </footer>

            {/* Subtle watermark */}
            <div className="absolute bottom-12 right-12 opacity-5 pointer-events-none select-none print:opacity-10">
              <ShieldCheck className="w-24 h-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}