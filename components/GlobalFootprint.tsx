// components/GlobalFootprint.tsx — THE REFINED AXIS
import * as React from "react";
import { Globe, MapPin } from "lucide-react";

export default function GlobalFootprint() {
  const offices = [
    { city: "London", coordinates: "51.5074° N, 0.1278° W", role: "Doctrine & Governance" },
    { city: "Lagos", coordinates: "6.5244° N, 3.3792° E", role: "Scale & Deployment" },
    { city: "Global", coordinates: "∞", role: "Universal Application" },
  ];

  return (
    <div className="py-12 border-t border-white/5 bg-black">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {offices.map((loc) => (
            <div key={loc.city} className="group relative">
              {/* Harrods Gold Accent Line */}
              <div className="h-px w-8 bg-[#D4AF37]/40 mb-6 group-hover:w-16 transition-all duration-700" />
              
              <div className="flex items-baseline gap-3">
                <h4 className="font-serif text-2xl text-white/90 tracking-tight">
                  {loc.city}
                </h4>
                <span className="text-[8px] font-mono text-[#D4AF37]/50 uppercase tracking-widest">
                  {loc.coordinates}
                </span>
              </div>
              
              <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
                {loc.role}
              </p>

              {/* Watermark-style city icon (Subtle) */}
              <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <MapPin className="w-24 h-24 text-white" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.5em]">
            A unified intelligence network for the modern architect.
          </p>
        </div>
      </div>
    </div>
  );
}