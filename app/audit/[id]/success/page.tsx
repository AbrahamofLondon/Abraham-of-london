export const dynamic = "force-dynamic";
/* app/audit/[id]/success/page.tsx — TELEMETRY_STABILIZED_VIEW */
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ShieldCheck, CircleCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AuditSuccessPage({ params }: { params: { id: string } }) {
  const participant = await db.campaignParticipant.findUnique({
    where: { id: params.id },
    select: { 
      id: true, 
      status: true,
      completedAt: true,
      campaign: { select: { title: true } }
    }
  });

  if (!participant || participant.status !== 'completed') {
    notFound();
  }

  const completionStamp = participant.completedAt?.toISOString() || new Date().toISOString();

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-neutral-800 font-serif flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6 text-center">
        
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="bg-white border border-neutral-200 p-5 rounded-full">
            <ShieldCheck className="w-8 h-8 text-neutral-500 stroke-[1.5]" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="h-px w-6 bg-neutral-200" />
            <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-500">
              Transmission Stabilized
            </span>
            <span className="h-px w-6 bg-neutral-200" />
          </div>
          <h1 className="text-xl font-light tracking-tight text-neutral-800">
            Telemetry Recorded
          </h1>
          <p className="text-[11px] text-neutral-500 leading-relaxed px-4">
            Your response for "{participant.campaign.title}" has been encrypted and decoupled.
          </p>
        </div>

        {/* Receipt */}
        <div className="bg-white border border-neutral-200 p-5 text-left space-y-3">
          <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-2">
            <span className="text-[6px] font-mono uppercase tracking-wider text-neutral-400">Node Receipt</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-[8px] font-mono">
            <div>
              <p className="text-neutral-400 mb-0.5">Session ID</p>
              <p className="text-neutral-600">{participant.id.slice(0, 12)}...</p>
            </div>
            <div>
              <p className="text-neutral-400 mb-0.5">Finalized</p>
              <p className="text-neutral-600">{completionStamp.split('T')[0]}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <CircleCheck className="w-2 h-2 text-neutral-500" />
            <span className="text-[6px] font-mono text-neutral-500">Integrity Verified</span>
          </div>
        </div>

        {/* Exit */}
        <div className="pt-4 space-y-3">
          <Link 
            href="/"
            className="inline-flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <ArrowLeft className="w-2.5 h-2.5" />
            Exit Session
          </Link>
          
          <div className="pt-6 border-t border-neutral-200">
            <p className="text-[6px] font-mono text-neutral-400 uppercase tracking-wider">
              Session terminated. Local cache cleared.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}