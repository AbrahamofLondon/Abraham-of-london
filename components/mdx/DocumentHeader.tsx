import * as React from "react";
import { Calendar, Clock, User, Shield } from "lucide-react";

interface DocumentHeaderProps {
  title?: string;
  subtitle?: string;
  description?: string;
  classification?: string;
  date?: string;
  author?: string;
  readTime?: string;
  className?: string;
}

export default function DocumentHeader({
  title,
  subtitle,
  description,
  classification,
  date,
  author,
  readTime,
  className = "",
}: DocumentHeaderProps) {
  return (
    <header className={`mb-16 border-b border-white/10 pb-12 ${className}`}>
      {/* Classification badge: Elevated to feel like a security tag */}
      {classification && (
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/5 border border-amber-500/20">
             <Shield size={10} className="text-amber-500" />
             <span className="font-mono text-[9px] font-black uppercase tracking-[0.4em] text-amber-500">
               {classification}
             </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
        </div>
      )}
      
      {title && (
        <h1 className="font-serif text-5xl md:text-6xl italic leading-tight text-white mb-6 tracking-tighter">
          {title}
        </h1>
      )}

      {subtitle && (
        <p className="text-xl md:text-2xl text-white/40 font-light italic mb-8 max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      )}

      {description && (
        <div className="relative pl-8 mb-10">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-amber-500/30" />
          <p className="text-sm md:text-base text-white/60 max-w-2xl leading-relaxed italic">
            {description}
          </p>
        </div>
      )}

      {(date || author || readTime) && (
        <div className="flex flex-wrap gap-8 pt-6 border-t border-white/5 text-[10px] text-white/30 font-mono uppercase tracking-widest">
          {date && (
            <span className="flex items-center gap-2 group hover:text-white transition-colors">
              <Calendar className="h-3 w-3 text-amber-500/50" /> {date}
            </span>
          )}
          {author && (
            <span className="flex items-center gap-2 group hover:text-white transition-colors">
              <User className="h-3 w-3 text-amber-500/50" /> {author}
            </span>
          )}
          {readTime && (
            <span className="flex items-center gap-2 group hover:text-white transition-colors">
              <Clock className="h-3 w-3 text-amber-500/50" /> {readTime}
            </span>
          )}
        </div>
      )}
    </header>
  );
}