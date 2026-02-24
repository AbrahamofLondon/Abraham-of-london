import React from 'react';
import { Calendar, Clock, MapPin, Users, ExternalLink, Shield, Lock, Globe } from 'lucide-react';
import Link from 'next/link';

interface EventDetailsProps {
  title: string;
  description: string;
  date: string;
  time?: string;
  endDate?: string;
  location?: string;
  virtualLink?: string;
  registrationUrl?: string;
  registrationRequired?: boolean;
  capacity?: number;
  accessLevel?: 'public' | 'private' | 'invite-only';
  className?: string;
}

const EventDetails: React.FC<EventDetailsProps> = ({
  title,
  description,
  date,
  time,
  endDate,
  location,
  virtualLink,
  registrationUrl,
  registrationRequired = false,
  capacity,
  accessLevel = 'public',
  className = '',
}) => {
  // Safe Date Parsing for 2026 Standard
  const eventDate = new Date(date);
  const isPast = eventDate < new Date();
  const isVirtual = !!virtualLink;

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={`bg-zinc-950 border border-white/10 overflow-hidden shadow-2xl ${className}`}>
      {/* ACCESS BANNER */}
      <div className="bg-zinc-900/50 border-b border-white/5 px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-amber-500/70" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Intelligence Classification: {accessLevel}
          </span>
        </div>
        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          Ref: EVT-{eventDate.getTime().toString(36).toUpperCase()}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-0">
        {/* LEFT COLUMN: INTEL SUMMARY */}
        <div className="lg:col-span-7 p-8 lg:p-12 border-r border-white/5">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-serif italic text-white mb-6">Executive Summary</h2>
            <div className="prose prose-invert prose-zinc max-w-none mb-12">
              <p className="text-zinc-400 leading-relaxed text-lg">
                {description}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 pt-8 border-t border-white/5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Temporal Data</span>
                </div>
                <p className="text-white font-medium">{formatDate(date)}</p>
                {time && <p className="text-zinc-500 text-sm flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> {time}
                </p>}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Geolocation</span>
                </div>
                <p className="text-white font-medium">{location || 'Coordinates Classified'}</p>
                {isVirtual && (
                  <p className="text-zinc-500 text-sm flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Secure Uplink Available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION PANEL */}
        <div className="lg:col-span-5 bg-zinc-900/30 p-8 lg:p-12 flex flex-col justify-between">
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <Lock className="w-4 h-4 text-amber-500" />
                Access Protocol
              </h3>
              
              {isPast ? (
                <div className="p-6 border border-white/5 bg-zinc-950/50 text-center">
                  <p className="text-zinc-500 font-serif italic mb-2">This transmission has concluded.</p>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Archived 2026</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-zinc-950 border border-white/10">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-zinc-500 uppercase">Availability</span>
                      <span className="text-xs text-white font-mono">
                        {capacity ? `${capacity} Seats` : 'Limited'}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800">
                      <div className="h-full bg-amber-500 w-1/3" /> 
                    </div>
                  </div>

                  {registrationRequired ? (
                    registrationUrl ? (
                      <Link
                        href={registrationUrl}
                        target="_blank"
                        className="group flex items-center justify-between w-full p-4 bg-white text-black hover:bg-amber-500 transition-colors duration-300"
                      >
                        <span className="font-bold uppercase tracking-tighter text-lg">Secure Clearance</span>
                        <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <div className="w-full p-4 border border-zinc-700 text-zinc-500 text-center font-bold uppercase tracking-widest text-sm">
                        Registration Opening Soon
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-400 italic">Open forum. Direct attendance permitted.</p>
                      {virtualLink && (
                        <Link
                          href={virtualLink}
                          className="flex items-center justify-center w-full py-4 border border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300 font-bold uppercase tracking-widest text-xs"
                        >
                          Join Secure Stream
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {accessLevel === 'private' && (
              <div className="p-4 border-l-2 border-amber-500 bg-amber-500/5">
                <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-1">Security Notice</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Strict adherence to Chatham House Rules. No unauthorized recording or transmission of proceedings.
                </p>
              </div>
            )}
          </div>

          {/* SOCIAL/SHARE FOOTER */}
          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Distribute Intel</span>
            <div className="flex gap-4">
              {['Twitter', 'LinkedIn', 'Copy'].map((platform) => (
                <button 
                  key={platform}
                  className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-tighter font-bold transition-colors"
                >
                  [{platform}]
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;