import { getEnterpriseDashboardView } from "@/lib/alignment/enterprise-repository";
import { STRATEGIC_INTERVENTIONS } from "@/lib/alignment/enterprise-recommendations";
import { notFound } from "next/navigation";
import { 
  Shield, AlertTriangle, TrendingUp, Zap, 
  Fingerprint, Globe, Activity, Award, CheckCircle2 
} from "lucide-react";

export default async function ExecutiveReportPage({ params }: { params: { id: string } }) {
  const data = await getEnterpriseDashboardView(params.id);

  if (!data || !data.organisationSnapshot) return notFound();

  const { organisation, organisationSnapshot, leadershipGap } = data;
  const reportHash = `OGR-${params.id.slice(0, 4)}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4F4F1] text-black p-4 sm:p-12 font-serif print:p-0 selection:bg-[#8A6A2F] selection:text-white">
      {/* THE INTELLIGENCE FOLDER CONTAINER */}
      <div className="relative max-w-[900px] mx-auto bg-white shadow-[0_40px_100px_rgba(0,0,0,0.08)] print:shadow-none print:max-w-full overflow-hidden">
        
        {/* TOP BORDER ACCENT */}
        <div className={`h-2 w-full ${organisationSnapshot.percentScore > 75 ? 'bg-[#8A6A2F]' : 'bg-black'}`} />

        <div className="p-12 sm:p-20 relative">
          
          {/* WATERMARK: ENCRYPTED ID */}
          <div className="absolute top-10 right-10 opacity-[0.05] text-[10px] font-sans font-bold tracking-[1em] rotate-90 origin-right whitespace-nowrap">
            ID: {reportHash} // SECURED_DIF_09
          </div>

          {/* HEADER: Institutional Identity */}
          <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-20">
            <div className="space-y-6 max-w-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border-2 border-black flex items-center justify-center rotate-45 group">
                  <Shield className="w-6 h-6 -rotate-45 fill-black transition-transform group-hover:scale-110" />
                </div>
                <div>
                  <p className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-[#8A6A2F]">
                    Sovereign Intelligence
                  </p>
                  <p className="text-[9px] font-sans font-bold text-neutral-400 uppercase tracking-widest leading-none">
                    Strategic Integrity Protocol v3.1
                  </p>
                </div>
              </div>
              <h1 className="text-6xl font-black uppercase tracking-tighter leading-[0.8] font-sans">
                Organizational <br />
                <span className="italic font-serif font-light text-[#8A6A2F]">Resonance</span> <br />
                Brief
              </h1>
            </div>
            
            <div className="text-right font-sans md:min-w-[200px]">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse print:hidden" />
                <div className="px-3 py-1 bg-neutral-900 text-white text-[8px] font-black uppercase tracking-[0.2em]">
                  Classified: Client-Only
                </div>
              </div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Entity Name</p>
              <p className="text-2xl font-black uppercase tracking-tight leading-none mb-4">{organisation.name}</p>
              <div className="text-[10px] text-neutral-500 font-mono">
                {organisation.region || "GLOBAL"} // {new Date().toLocaleDateString('en-GB')}
              </div>
            </div>
          </header>

          {/* CORE METRIC SECTION */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 items-center">
            <div className="md:col-span-7 relative">
              <div className="absolute -top-10 -left-10 text-[120px] font-black text-neutral-50 opacity-[0.4] select-none pointer-events-none">
                01
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#8A6A2F]" />
                  <h3 className="text-[11px] font-sans font-black uppercase tracking-[0.4em] text-[#8A6A2F]">
                    Resilience Coefficient
                  </h3>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-[140px] font-black leading-none tracking-tighter font-sans">
                    {Math.round(organisationSnapshot.percentScore)}
                  </span>
                  <div className="space-y-2">
                    <span className="text-4xl font-light text-neutral-300 italic">%</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-sans font-black px-2 py-0.5 bg-black text-white uppercase tracking-widest">
                        {organisationSnapshot.band}
                      </span>
                      <span className="text-[8px] font-sans font-bold text-neutral-400 uppercase mt-1">Status Grade</span>
                    </div>
                  </div>
                </div>
                <blockquote className="text-lg leading-snug text-neutral-800 italic font-light border-l-[3px] border-[#8A6A2F] pl-8 py-2 max-w-sm">
                  "Alignment is not a state of being, but a rate of flow. Current data indicates a structural {organisationSnapshot.percentScore < 60 ? 'vulnerability' : 'efficiency'}."
                </blockquote>
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col gap-6">
              {/* THE DELTA SIGNAL BOX */}
              <div className="bg-[#111] text-white p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingUp className="w-20 h-20 text-white" />
                </div>
                <h4 className="text-[10px] font-sans font-black uppercase tracking-[0.3em] text-[#8A6A2F] mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Delta Signal
                </h4>
                <div className="flex items-end gap-3 mb-2">
                  <div className="text-6xl font-black font-sans leading-none">
                    {leadershipGap ? Math.round(leadershipGap.overallGapPercent) : "0"}%
                  </div>
                  <div className={`px-2 py-0.5 text-[8px] font-bold uppercase mb-1 ${leadershipGap && leadershipGap.overallGapPercent > 15 ? 'bg-red-600' : 'bg-[#8A6A2F]'}`}>
                    {leadershipGap && leadershipGap.overallGapPercent > 15 ? 'Critical' : 'Stable'}
                  </div>
                </div>
                <p className="text-[9px] font-medium leading-relaxed text-neutral-400 uppercase tracking-widest italic">
                  Institutional Dissonance: The distance between Executive Intent and Frontline Reality.
                </p>
              </div>
            </div>
          </section>

          {/* THE GRID: DOMAIN MATRIX */}
          <section className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="h-4 w-1 bg-black" />
                <h3 className="text-[11px] font-sans font-black uppercase tracking-[0.4em]">
                  02 // Domain Integrity Matrix
                </h3>
              </div>
              <div className="flex items-center gap-4 text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                <span>V-Scale</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <div key={i} className={`w-1.5 h-1.5 ${i < 3 ? 'bg-[#8A6A2F]' : 'bg-neutral-200'}`} />)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 relative">
              {/* Background Grid Accent */}
              <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
                {[...Array(5)].map((_, i) => <div key={i} className="border-r border-neutral-50 h-full" />)}
              </div>

              {organisationSnapshot.domainScores.map((ds) => (
                <div key={ds.domain} className="relative z-10 group">
                  <div className="flex justify-between items-end mb-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-sans font-black uppercase tracking-widest text-[#8A6A2F]">
                        Domain
                      </span>
                      <h5 className="text-sm font-black uppercase tracking-tight text-neutral-900 leading-none">
                        {ds.domain.replace(/_/g, ' ')}
                      </h5>
                    </div>
                    <span className="font-sans text-xl font-black tracking-tighter text-neutral-400">
                      {Math.round(ds.percentScore)}<span className="text-[10px] font-light">%</span>
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-black group-hover:bg-[#8A6A2F] transition-all duration-700 ease-out" 
                      style={{ width: `${ds.percentScore}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* THE STRATEGY: TACTICAL RECOVERY */}
          <section className="mb-20 bg-neutral-50 border border-neutral-100 p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-8 py-2 bg-black text-white text-[8px] font-black uppercase tracking-[0.4em]">
              Intervention Protocol
            </div>
            
            <h3 className="text-[11px] font-sans font-black uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
              <Award className="w-5 h-5 text-[#8A6A2F]" />
              03 // Recovery Protocols
            </h3>

            <div className="space-y-10">
              {organisationSnapshot.weakestDomains.slice(0, 2).map((domainKey) => {
                const intervention = STRATEGIC_INTERVENTIONS[domainKey];
                return (
                  <div key={domainKey} className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="md:w-1/3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-3 h-3 text-[#8A6A2F]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Target Focus</span>
                      </div>
                      <h6 className="text-xs font-black uppercase text-black">{domainKey.replace(/_/g, ' ')}</h6>
                    </div>
                    <div className="md:w-2/3 space-y-3">
                      <h5 className="text-lg font-black uppercase tracking-tight">{intervention?.title || "Operational Stabilization"}</h5>
                      <p className="text-sm leading-relaxed text-neutral-600 font-light">
                        {intervention?.action || "Initiate deep-dive analysis of domain bottlenecks."}
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#8A6A2F]/30 bg-white shadow-sm">
                        <Zap className="w-3 h-3 text-[#8A6A2F]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#8A6A2F]">
                          Impact: {intervention?.impact || "Stabilize Score"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* FOOTER: THE SIGNATURE */}
          <footer className="pt-12 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="p-3 bg-neutral-50 rounded-lg">
                <Fingerprint className="w-8 h-8 text-[#8A6A2F]" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black">
                  Data Fingerprint: <span className="text-neutral-400 font-mono font-medium">{reportHash}</span>
                </p>
                <p className="text-[8px] text-neutral-400 font-medium uppercase tracking-[0.2em]">
                  Encrypted // Sovereignty Certified // Non-Alterable
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-[8px] font-sans font-black text-neutral-300 uppercase tracking-[0.5em] mb-1">Authenticated by</p>
              <div className="text-3xl font-black italic tracking-tighter leading-none text-black">SOVEREIGN</div>
              <p className="text-[7px] font-sans font-black text-[#8A6A2F] uppercase tracking-[1em] mr-[-1em]">Analytics Bureau</p>
            </div>
          </footer>

        </div>
      </div>

      {/* PRINT ENGINE OPTIMIZATION */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .min-h-screen { padding: 0 !important; }
          .max-w-[900px] { max-width: 100% !important; border: 0 !important; margin: 0 !important; }
          .bg-neutral-900, .bg-[#111], .bg-black { background-color: #111111 !important; color: white !important; }
          .bg-neutral-50 { background-color: #f9f9f9 !important; }
          .text-[#8A6A2F] { color: #8A6A2F !important; }
          .shadow-[0_40px_100px_rgba(0,0,0,0.08)] { box-shadow: none !important; }
        }
      `}} />
    </div>
  );
}