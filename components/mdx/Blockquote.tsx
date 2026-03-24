import React from "react";

interface BlockquoteProps {
  children: React.ReactNode;
  author?: string;
  source?: string;
  className?: string;
}

export function Blockquote({ children, author, source, className = "" }: BlockquoteProps) {
  return (
    <figure className={`my-10 ${className}`}>
      <div className="relative">
        <div className="absolute -left-4 top-0 h-full w-0.5 bg-[#8A6A2F]/40" />
        <blockquote className="pl-6 text-base leading-relaxed text-neutral-700">
          <span className="font-serif text-[#8A6A2F]">“</span>
          {children}
          <span className="font-serif text-[#8A6A2F]">”</span>
        </blockquote>
      </div>
      {(author || source) && (
        <figcaption className="mt-4 pl-6 text-sm text-neutral-500">
          {author && (
            <span className="font-medium tracking-wide text-neutral-600">
              — {author}
            </span>
          )}
          {author && source && <span className="mx-1 text-[#8A6A2F]/40">|</span>}
          {source && (
            <cite className="not-italic text-neutral-500">
              <span className="text-xs uppercase tracking-wider">{source}</span>
            </cite>
          )}
        </figcaption>
      )}
    </figure>
  );
}