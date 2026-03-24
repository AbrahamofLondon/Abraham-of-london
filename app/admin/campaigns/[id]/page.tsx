import { db } from "@/lib/db";
import { notFound } from "next/navigation"; 
import { 
  Users, 
  Clock, 
  BarChart3, 
  ArrowLeft,
  Search,
  ShieldCheck,
  Activity,
  ChevronRight,
  Lock
} from "lucide-react";
import Link from "next/link";
import { CampaignActions } from "./campaign-actions";
import { ParticipantTable } from "./participant-table";

export default async function CampaignManagementPage({ params }: { params: { id: string } }) {
  // 1. Precise Data Retrieval from the Registry using standardized ID
  const campaign = await db.alignmentCampaign.findUnique({
    where: { id: params.id },
    include: {
      organisation: true,
      participants: {
        include: { membership: true },
        orderBy: { status: 'asc' }
      },
      _count: {
        select: { participants: true }
      }
    }
  });

  // Standard Next.js 404 trigger if the campaign reference is invalid
  if (!campaign) {
    notFound();
  }

  // 2. Metrics & Sovereign Anonymity Logic
  const completedCount = campaign.participants.filter(p => p.status === 'completed').length;
  const totalInvited = campaign._count.participants;
  const completionRate = totalInvited > 0 ? Math.round((completedCount / totalInvited) * 100) : 0;
  
  // Strict discretionary threshold for institutional safety (n=5)
  const ANONYMITY_THRESHOLD = 5;
  const isSafeToReport = completedCount >= ANONYMITY_THRESHOLD;

  // 3. Temporal Telemetry
  const startDate = new Date(campaign.createdAt);
  const daysActive = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-[#F9F9F7] p-8 font-sans selection:bg-[#8A6A2F] selection:text-white">
      
      {/* BREADCRUMBS & SYSTEM ACTIONS */}
      <div className="max-w-7xl mx-auto mb-10 flex justify-between items-center">
        <nav className="flex items-center gap-4">
          <Link 
            href={`/admin/organisations/${campaign.organisationId}`} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> {campaign.organisation.name}
          </Link>
          <span className="text-neutral-200">/</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-black">Campaign Registry</span>
        </nav>
        
        <div className="flex gap-4">
          <CampaignActions campaignId={campaign.id} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        
        {/* SECTION 1: INSTITUTIONAL HEADER */}
        <div className="col-span-12 bg-white border border-neutral-200 p-10 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-sm">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-0.5 bg-[#8A6A2F] text-white text-[8px] font-black uppercase tracking-[0.2em]">Active Audit</span>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest italic">
                Ref: {campaign.id.split('-')[0].toUpperCase()}
              </p>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">
              {campaign.title}
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest">
                Strategic Alignment Protocol for <span className="text-black font-black">{campaign.organisation.name}</span>
              </p>
              <div className="flex items-center gap-2 px-3 py-1 bg-neutral-50 border border-neutral-100 rounded-full">
                <Lock className={`w-2.5 h-2.5 ${isSafeToReport ? 'text-green-600' : 'text-amber-500'}`} />
                <span className="text-[8px] font-black uppercase tracking-widest">
                  Anonymity: {isSafeToReport ? 'Secure' : 'Buffering'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-16 mt-8 md:mt-0 relative z-10">
            <div className="text-right">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Response Velocity</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-[#8A6A2F] tracking-tighter">{completionRate}%</span>
                <span className="text-xs font-bold text-neutral-300">/ 100</span>
              </div>
            </div>
            <div className="text-right border-l border-neutral-100 pl-16">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Invited Cohort</p>
              <p className="text-5xl font-black tracking-tighter text-black">{totalInvited}</p>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-96 h-full bg-neutral-50/40 -skew-x-12 translate-x-48 pointer-events-none" />
        </div>

        {/* SECTION 2: THE INTEGRITY ROSTER */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/30">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#8A6A2F]" />
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em]">Participant Integrity Roster</h3>
            </div>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-300 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Filter Identity..." 
                className="pl-8 pr-4 py-2 border border-neutral-200 text-[11px] font-bold uppercase tracking-tight focus:outline-none focus:ring-1 focus:ring-black w-64 transition-all bg-white"
              />
            </div>
          </div>

          <ParticipantTable participants={campaign.participants} campaignId={campaign.id} />
        </div>

        {/* SECTION 3: ANALYTIC TELEMETRY */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* TEMPORAL WINDOW CARD */}
          <div className="bg-white border border-neutral-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8A6A2F]" /> Temporal Window
              </h3>
              <span className="text-[9px] font-black bg-neutral-100 px-2 py-1 uppercase tracking-widest">
                Day {daysActive + 1}
              </span>
            </div>
            
            <div className="space-y-5">
              <div className="flex justify-between items-end border-b border-neutral-50 pb-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Activation</span>
                <span className="text-[11px] font-black uppercase">{startDate.toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex justify-between items-end border-b border-neutral-50 pb-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Status</span>
                <span className="text-[11px] font-black uppercase text-red-600 animate-pulse">
                   {isSafeToReport ? 'Live Tracking' : 'Threshold Pending'}
                </span>
              </div>
              <div className="pt-2">
                <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className="bg-black h-full transition-all duration-1000" 
                    style={{ width: `${Math.min((daysActive / 14) * 100, 100)}%` }} 
                  />
                </div>
                <p className="text-[9px] text-neutral-400 mt-2 uppercase font-bold tracking-tighter">Diagnostic Window Progress</p>
              </div>
            </div>
          </div>

          {/* LIVE RESONANCE CARD */}
          <div className="bg-black text-white p-8 relative overflow-hidden group shadow-xl">
             <BarChart3 className="absolute -bottom-4 -right-4 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity" />
             <div className="flex items-center gap-2 mb-8">
               <Activity className="w-4 h-4 text-[#8A6A2F]" />
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8A6A2F]">Live Resonance</h3>
             </div>
             
             <div className="space-y-6 mb-10 relative z-10">
               <div>
                 <div className="flex justify-between items-end mb-2">
                   <p className="text-4xl font-light italic tracking-tighter leading-none">
                     {isSafeToReport ? 'Resistant' : 'Buffering'}
                   </p>
                   {isSafeToReport && (
                     <p className="text-[10px] font-black text-[#8A6A2F] uppercase tracking-widest">Dissonance High</p>
                   )}
                 </div>
                 <div className="w-full h-[3px] bg-white/10 relative">
                   <div 
                     className="absolute left-0 top-0 h-full bg-[#8A6A2F] transition-all duration-1000" 
                     style={{ width: isSafeToReport ? '72%' : '15%' }} 
                   />
                 </div>
               </div>
               
               <div className="bg-white/5 p-4 border-l-2 border-[#8A6A2F]">
                 <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/70 leading-relaxed italic">
                   {isSafeToReport 
                     ? '"Operational Friction is peaking within middle-management. Structural alignment remains fragmented."'
                     : '"Telemetry gathering. Strategic insights will populate once the Anonymity Threshold is met."'
                   }
                 </p>
               </div>
             </div>
             
             <div className="relative z-10">
               <CampaignActions campaignId={campaign.id} variant="sidebar" disabled={!isSafeToReport} />
             </div>
          </div>

          {/* PROTOCOL DOCUMENTATION LINK */}
          <div className="p-4 border border-dashed border-neutral-200 flex items-center justify-between group cursor-pointer hover:border-black transition-colors">
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-black">Protocol Documentation</span>
            <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-black transition-transform group-hover:translate-x-1" />
          </div>

        </div>
      </div>
    </div>
  );
}