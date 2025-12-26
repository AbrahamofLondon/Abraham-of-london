// components/mdx/Quote.tsx - FIXED
import * as React from "react";

export interface QuoteProps {
  children: React.ReactNode;
  author?: string;
  source?: string;
  citation?: string;
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Quote: React.FC<QuoteProps> = ({ 
  children, 
  author, 
  source, 
  citation,
  align = "left",
  size = "md",
  className = "" 
}) => {
  const sizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <figure className={`my-8 ${className}`}>
      <blockquote className={`relative ${alignClasses[align]}`}>
        <div className="absolute -left-2 top-0 text-4xl text-gold/30 font-serif leading-none">&quot;</div>
        <div className="pl-8 pr-4">
          <p className={`${sizeClasses[size]} italic text-gray-200 leading-relaxed`}>
            {children}
          </p>
        </div>
        <div className="absolute -right-2 bottom-0 text-4xl text-gold/30 font-serif leading-none">&quot;</div>
      </blockquote>
      
      {(author || source || citation) && (
        <figcaption className={`mt-4 text-sm text-gray-400 ${alignClasses[align]}`}>
          {author && (
            <span className="font-medium text-gray-300">
              {author}
            </span>
          )}
          
          {(author && source) && (
            <span className="mx-2">-</span>
          )}
          
          {source && (
            <span className="italic">
              {source}
              {citation && (
                <span className="ml-2 text-xs text-gray-500">
                  [{citation}]
                </span>
              )}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
};

export default Quote;