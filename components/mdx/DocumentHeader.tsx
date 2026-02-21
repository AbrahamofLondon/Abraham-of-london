// components/mdx/DocumentHeader.tsx
import * as React from "react";
import { Calendar, Clock, User } from "lucide-react";

interface DocumentHeaderProps {
  title?: string;
  subtitle?: string;
  date?: string;
  author?: string;
  readTime?: string;
  className?: string;
}

export default function DocumentHeader({
  title,
  subtitle,
  date,
  author,
  readTime,
  className = "",
}: DocumentHeaderProps) {
  return (
    <header className={`mb-12 border-b border-white/10 pb-8 ${className}`}>
      {title && (
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-xl text-white/60 italic mb-6">{subtitle}</p>
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