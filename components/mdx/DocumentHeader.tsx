import * as React from "react";
import { Calendar, Clock, User } from "lucide-react";

interface DocumentHeaderProps {
  title?: string;
  subtitle?: string;
  description?: string;  // ADDED
  classification?: string; // ADDED
  date?: string;
  author?: string;
  readTime?: string;
  className?: string;
}

export default function DocumentHeader({
  title,
  subtitle,
  description,  // ADDED
  classification, // ADDED
  date,
  author,
  readTime,
  className = "",
}: DocumentHeaderProps) {
  return (
    <header className={`mb-12 border-b border-white/10 pb-8 ${className}`}>
      {/* Classification badge */}
      {classification && (
        <div className="mb-4 flex items-center gap-3">
          <span className="h-[1px] w-8 bg-amber-800/40" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-600/70">
            {classification}
          </span>
        </div>
      )}
      
      {title && (
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-xl text-white/60 italic mb-6">{subtitle}</p>
      )}
      {description && (
        <p className="text-base text-white/40 max-w-2xl mb-6 leading-relaxed">{description}</p>
      )}
      {(date || author || readTime) && (
        <div className="flex flex-wrap gap-6 text-sm text-white/40 font-mono">
          {date && (
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {date}
            </span>
          )}
          {author && (
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" /> {author}
            </span>
          )}
          {readTime && (
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> {readTime}
            </span>
          )}
        </div>
      )}
    </header>
  );
}