// components/GlossaryTerm.tsx
import * as React from "react";

export interface GlossaryTermProps {
  children: React.ReactNode;
  term: string;
  definition?: string;
  code?: string;
}

const GlossaryTerm: React.FC<GlossaryTermProps> = ({ 
  children, 
  term, 
  definition,
  code 
}) => {
  return (
    <span 
      className="glossary-term inline-flex items-baseline group relative cursor-help border-b border-dotted border-softGold/50"
      data-term={term}
      data-code={code}
    >
      <span className="text-cream font-medium">{children}</span>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-charcoal border border-softGold/30 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-[200px] max-w-[300px] text-sm">
        <div className="font-mono text-xs text-softGold mb-1">{code}</div>
        <div className="font-semibold text-cream mb-1">{term}</div>
        {definition && (
          <div className="text-gray-300 leading-tight">{definition}</div>
        )}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-softGold/30"></div>
      </div>
    </span>
  );
};

export default GlossaryTerm;