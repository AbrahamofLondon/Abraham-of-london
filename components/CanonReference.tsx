/* components/CanonReference.tsx */
import * as React from "react";

type CanonReferenceProps = {
  code?: string;      // e.g., "EG-01"
  volume?: string;    // e.g., "I"
  chapter?: string;   // e.g., "2"
  title?: string;     
  children?: React.ReactNode; 
};

export default function CanonReference({
  code,
  volume,
  chapter,
  title,
  children,
}: CanonReferenceProps): React.ReactElement {
  return (
    <div className="mt-6 rounded-xl border border-gold/20 bg-gold/5 p-4 transition-all hover:bg-gold/10">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        {code && (
          <span className="bg-gold px-2 py-0.5 text-[10px] font-black uppercase text-black">
            {code}
          </span>
        )}
        {(volume || chapter) && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-gold/60">
            {volume && `Vol. ${volume}`} {chapter && `· Ch. ${chapter}`}
          </span>
        )}
      </div>
      
      {title && (
        <h4 className="font-serif text-lg font-semibold text-white">
          {title}
        </h4>
      )}
      
      {children && (
        <div className="mt-2 text-sm leading-relaxed text-gray-400">
          {children}
        </div>
      )}
    </div>
  );
}