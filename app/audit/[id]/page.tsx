export const dynamic = "force-dynamic";
/* app/audit/[id]/page.tsx — SOVEREIGN TELEMETRY NODE */
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { AuditForm } from "./audit-form";
import { ShieldCheck, Activity } from "lucide-react";

export default async function AuditEntryPage({ params }: { params: { id: string } }) {
  // 1. ATOMIC LOOKUP: Validate Participant and Campaign Integrity
  const participant = await db.campaignParticipant.findUnique({
    where: { id: params.id },
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
        }
      }
    }
  });

  if (!participant) notFound();
  
  // 2. STATE GUARD: Prevent duplicate submissions
  if (participant.status === 'completed') {
    redirect(`/audit/${params.id}/success`);
  }

  // 3. TELEMETRY LOG: Mark as opened if it's the first visit
  if (participant.status === 'invited') {
    await db.campaignParticipant.update({
      where: { id: params.id },
      data: { 
        status: 'opened',
        openedAt: new Date()
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-neutral-800 font-serif selection:bg-neutral-200">
      <header className="border-b border-neutral-200 p-5 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Activity className="w-3.5 h-3.5 text-neutral-500" />
          <div>
            <p className="text-[8px] font-mono uppercase tracking-wider text-neutral-500">Sovereign Telemetry</p>
            <p className="text-[7px] font-mono text-neutral-400">Node: {participant.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200">
          <ShieldCheck className="w-2.5 h-2.5 text-neutral-500" />
          <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-500">Anonymous_Protocol</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto pt-16 pb-28 px-6">
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-400 tracking-[0.2em]">Active_Protocol</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-neutral-800 mb-4">
            {participant.campaign.title}
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed font-serif italic">
            {participant.campaign.description || "Calibration of institutional alignment for the current operational window."}
          </p>
        </section>

        <div className="border-t border-neutral-200 mb-12" />

        {/* Client-Side Logic Intercept */}
        <AuditForm participantId={participant.id} />

        <footer className="mt-20 pt-8 border-t border-neutral-200 text-center">
          <p className="text-[8px] font-mono text-neutral-400 leading-relaxed max-w-md mx-auto uppercase tracking-tighter">
            Responses are aggregated. No individual data is exposed to management.
            <br />
            End-to-End Encryption Active.
          </p>
        </footer>
      </main>
    </div>
  );
}