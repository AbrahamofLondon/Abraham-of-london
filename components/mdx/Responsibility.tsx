// components/mdx/Responsibility.tsx
import * as React from "react";
import { Target } from "lucide-react";

interface ResponsibilityProps {
  domain: string;
  objective: string;
  protocol: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function Responsibility({ 
  domain, 
  objective, 
  protocol, 
  icon,
  className = "" 
}: ResponsibilityProps) {
  return (
    <div className={`bg-zinc-900/30 border border-white/5 rounded-2xl p-6 hover:border-amber-500/30 transition-all group ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:text-amber-300 transition-colors">
          {icon || <Target className="h-5 w-5" />}
        </div>
        <h3 className="font-serif text-xl text-white group-hover:text-amber-100 transition-colors">
          {domain}
        </h3>
      </div>
      <p className="text-white/60 text-sm mb-3 leading-relaxed">{objective}</p>
      <p className="text-amber-300/80 text-xs font-mono uppercase tracking-wider">
        {protocol}
      </p>
    </div>
  );
}