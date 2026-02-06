/* pages/directorate/dossier/[id].tsx */
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import prisma from "@/lib/prisma";
import Layout from "@/components/Layout";
import { withUnifiedAuth } from "@/lib/auth/withUnifiedAuth";
import { 
  ArrowLeft, 
  Terminal, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  FileText 
} from "lucide-react";
import Link from "next/link";

interface DossierProps {
  intake: {
    id: string;
    fullName: string;
    organisation: string;
    score: number;
    status: string;
    createdAt: string;
    payload: any; // The raw JSON from the Strategy Room
  };
}

const DossierDetail: NextPage<DossierProps> = ({ intake }) => {
  const { payload } = intake;

  return (
    <Layout title={`Dossier: ${intake.fullName}`} className="bg-[#050505]">
      <div className="min-h-screen p-6 lg:p-12 font-mono text-[11px] text-zinc-400">
        
        {/* Navigation & Status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b border-zinc-800 pb-8">
          <div className="flex items-center gap-4">
            <Link href="/directorate/oversight" className="p-2 border border-zinc-800 hover:bg-zinc-900 transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-xl font-sans font-bold text-white uppercase tracking-tight">
                Dossier_{intake.id.substring(0, 8)}
              </h1>
              <p className="text-zinc-600 uppercase">Principal: {intake.fullName} // {intake.organisation}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
             <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300">
               GRAVITY_SCORE: <span className={intake.score >= 20 ? "text-amber-500" : "text-white"}>{intake.score}/25</span>
             </div>
             <div className={`px-4 py-2 border ${intake.status === 'ACCEPTED' ? 'border-emerald-900 bg-emerald-900/10 text-emerald-500' : 'border-zinc-800 text-zinc-500'}`}>
               STATUS: {intake.status}
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* Section: Strategic Trade-offs (Visualized) */}
          <div className="lg:col-span-8 space-y-10">
            <section>
              <div className="flex items-center gap-2 mb-4 text-zinc-200 uppercase tracking-widest border-l-2 border-amber-500 pl-4">
                <ShieldCheck size={14} /> 01_Primary_Risk_Logic
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800 p-6 space-y-6">
                {payload.decisions?.map((decision: any, idx: number) => (
                  <div key={idx} className="border-b border-zinc-800 last:border-0 pb-6 last:pb-0">
                    <h3 className="text-zinc-500 mb-2 font-bold uppercase tracking-tighter">Issue_{idx + 1}: {decision.label}</h3>
                    <p className="text-zinc-300 font-sans text-sm leading-relaxed mb-4">{decision.reasoning}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500" 
                          style={{ width: `${(decision.weight / 5) * 100}%` }} 
                        />
                      </div>
                      <span className="text-zinc-500">Weight: {decision.weight}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4 text-zinc-200 uppercase tracking-widest border-l-2 border-zinc-700 pl-4">
                <Terminal size={14} /> 02_Raw_Input_Log
              </div>
              <div className="bg-black border border-zinc-800 p-4 font-mono text-emerald-500/80 leading-relaxed max-h-96 overflow-y-auto">
                <div className="mb-2 text-zinc-700">// BEGIN RAW PAYLOAD DECODE</div>
                <pre className="whitespace-pre-wrap">{JSON.stringify(payload, null, 2)}</pre>
                <div className="mt-2 text-zinc-700">// END DECODE</div>
              </div>
            </section>
          </div>

          {/* Sidebar: Audit & Metadata */}
          <div className="lg:col-span-4 space-y-6">
             <div className="border border-zinc-800 p-6 bg-zinc-900/20">
               <h2 className="text-white uppercase mb-4 flex items-center gap-2">
                 <AlertTriangle size={14} className="text-amber-500" /> Assessment_Notes
               </h2>
               <p className="text-zinc-500 mb-6 italic leading-relaxed">
                 The following parameters were calculated based on the "Foundations Track" logic engine. 
                 Any score above 18 triggers mandatory Directorate review.
               </p>
               <ul className="space-y-4">
                 <li className="flex justify-between border-b border-zinc-800 pb-2">
                   <span>INTEL_QUALITY</span>
                   <span className="text-white">HIGH</span>
                 </li>
                 <li className="flex justify-between border-b border-zinc-800 pb-2">
                   <span>RISK_APPETITE</span>
                   <span className="text-white">{payload.riskProfile || 'CALIBRATED'}</span>
                 </li>
                 <li className="flex justify-between">
                   <span>ENTRY_PORT</span>
                   <span className="text-white">STRATEGY_ROOM_V2</span>
                 </li>
               </ul>
             </div>

             <div className="border border-zinc-800 p-6">
               <h2 className="text-white uppercase mb-4 flex items-center gap-2">
                 <Cpu size={14} className="text-zinc-500" /> Background_Tasks
               </h2>
               <div className="space-y-3">
                 <div className="flex items-center gap-3">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span>ENCRYPTION_LAYER: ACTIVE</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span>PRISMA_SYNC: COMPLETE</span>
                 </div>
                 <div className="flex items-center gap-3 text-zinc-700">
                   <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                   <span>LLM_SUMMARIZATION: PENDING</span>
                 </div>
               </div>
             </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const intake = await prisma.strategyRoomIntake.findUnique({
    where: { id: String(params?.id) },
  });

  if (!intake) return { notFound: true };

  return {
    props: {
      intake: JSON.parse(JSON.stringify(intake)),
    },
  };
};

export default withUnifiedAuth(DossierDetail, { requiredRole: 'admin' });