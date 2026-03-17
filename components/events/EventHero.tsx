/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { Calendar, MapPin, Shield, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface EventHeroProps {
  title: string;
  date: string | null;
  location: string;
  coverImage?: string;
  excerpt?: string | null;
  isPast: boolean;
}

const EventHero: React.FC<EventHeroProps> = ({
  title,
  date,
  location,
  coverImage,
  excerpt,
  isPast,
}) => {
  // Generate a stable serial based on title for SSR consistency
  const serial = React.useMemo(() => 
    `LDN-${title.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`, 
  [title]);

  const formattedDate = date 
    ? new Date(date).toLocaleDateString("en-GB", { 
        day: 'numeric', month: 'long', year: 'numeric' 
      }) 
    : "Pending Verification";

  return (
    <section className="relative w-full overflow-hidden bg-zinc-950 pt-20 pb-20 lg:pt-32 lg:pb-32 border-b border-white/5">
      {/* BACKGROUND ARCHITECTURAL LAYER */}
      <div className="absolute inset-0 z-0">
        {coverImage ? (
          <>
            <img
              src={coverImage}
              alt=""
              className="h-full w-full object-cover opacity-30 mix-blend-luminosity grayscale transition-transform duration-[10s] hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent" />
          </>
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950 opacity-50" />
        )}
        {/* Institutional Scanlines Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="max-w-5xl">
          {/* TOP NAV & STATUS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
              <Link 
                href="/events" 
                className="group flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 hover:text-amber-500 transition-colors mr-4"
              >
                <ChevronLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
                Registry
              </Link>

              {isPast ? (
                <span className="px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">
                  Archived Gathering
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                  </span>
                  Active Briefing
                </span>
              )}
            </div>

            <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/20">
              Serial: <span className="text-white/40">{serial}</span>
            </div>
          </div>

          {/* MAIN CONTENT BLOCK */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif italic text-white leading-[0.9] tracking-tighter mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {title}<span className="text-amber-500 not-italic">.</span>
          </h1>

          {excerpt && (
            <p className="text-xl md:text-2xl text-zinc-500 font-light leading-relaxed max-w-3xl mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              {excerpt}
            </p>
          )}

          {/* OPERATIONAL INTEL GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5 animate-in fade-in duration-1000 delay-300">
            <IntelItem 
              icon={<Calendar className="w-4 h-4 text-amber-500" />} 
              label="Scheduled" 
              value={formattedDate} 
            />
            <IntelItem 
              icon={<MapPin className="w-4 h-4 text-amber-500" />} 
              label="Location" 
              value={location} 
            />
            <IntelItem 
              icon={<Shield className="w-4 h-4 text-amber-500" />} 
              label="Protocol" 
              value="Chatham House Rule" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

/* Internal Helper Component for the Grid */
const IntelItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="bg-zinc-950/50 backdrop-blur-sm p-6 flex items-start gap-4">
    <div className="mt-1">{icon}</div>
    <div>
      <p className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] font-bold mb-1">{label}</p>
      <p className="text-sm text-zinc-200 font-medium tracking-tight">{value}</p>
    </div>
  </div>
);

export default EventHero;