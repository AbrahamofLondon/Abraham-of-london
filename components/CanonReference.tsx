// components/CanonReference.tsx
import * as React from "react";
import Link from "next/link";

export interface CanonReferenceProps {
  children: React.ReactNode;
  code: string;
  volume: string;
  chapter?: string;
  page?: string;
}

const CanonReference: React.FC<CanonReferenceProps> = ({ 
  children, 
  code, 
  volume, 
  chapter,
  page 
}) => {
  const referenceText = `Vol. ${volume}${chapter ? `, Ch. ${chapter}` : ''}${page ? `, p. ${page}` : ''}`;
  
  return (
    <span className="canon-reference inline-flex items-baseline group relative">
      <span className="text-cream">{children}</span>
      <sup className="ml-1">
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-softGold/20 text-softGold rounded-full group-hover:bg-softGold group-hover:text-charcoal transition-colors cursor-help">
          {code}
        </span>
      </sup>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-charcoal border border-softGold/30 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-[200px]">
        <div className="font-mono text-xs text-softGold mb-1">Reference {code}</div>
        <div className="text-cream text-sm font-medium">{referenceText}</div>
        <div className="text-gray-300 text-sm mt-1">See full context in {volume}</div>
        <div className="absolute top-full left-4 transform border-4 border-transparent border-t-softGold/30"></div>
      </div>
    </span>
  );
};

export default CanonReference;