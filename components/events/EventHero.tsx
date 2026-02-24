/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { Calendar, MapPin, Shield } from "lucide-react";

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
  return (
    <div className="relative w-full overflow-hidden bg-zinc-950 pt-16 pb-20 lg:pt-24 lg:pb-32">
      {/* BACKGROUND ARCHITECTURAL LAYER */}
      <div className="absolute inset-0 z-0">
        {coverImage ? (
          <>
            <img
              src={coverImage}
              alt=""
              className="h-full w-full object-cover opacity-40 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
          </>
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950" />
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="max-w-4xl">
          {/* STATUS TAG */}
          <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-left-4 duration-700">
            {isPast ? (
              <span className="px-3 py-1 rounded-full bg-zinc-800 border border-white/10 text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">
                Archived Gathering
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Active Transmission
              </span>
            )}
            <div className="h-px w-12 bg-white/10" />
            <span className="text-white/40 text-[9px] font-mono uppercase tracking-widest">
              Intel Serial: {Math.random().toString(36).toUpperCase().substring(2, 8)}
            </span>
          </div>

          {/* MAIN TITLE */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif italic text-white leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            {title}
          </h1>

          {/* EXCERPT */}
          {excerpt && (
            <p className="text-xl md:text-2xl text-zinc-400 font-light leading-relaxed max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              {excerpt}
            </p>
          )}

          {/* QUICK INTEL */}
          <div className="flex flex-wrap gap-8 pt-8 border-t border-white/5 animate-in fade-in duration-1000 delay-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Scheduled</p>
                <p className="text-sm text-white font-medium">{date || "Pending Verification"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <MapPin className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Location</p>
                <p className="text-sm text-white font-medium">{location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Shield className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Protocol</p>
                <p className="text-sm text-white font-medium">Chatham House Rule</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventHero;