// components/mdx/MissingComponent.tsx
import * as React from "react";

interface MissingComponentProps {
  componentName: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any; // Allow any other props
}

export const MissingComponent: React.FC<MissingComponentProps> = ({ 
  componentName, 
  children,
  className = "",
  ...props
}) => {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[MDX] Component "${componentName}" is not defined. Using fallback.`);
  }

  // Common fallbacks for known components
  const componentNameLower = componentName.toLowerCase();
  
  switch (componentNameLower) {
    case 'grid':
      return (
        <div 
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 my-6 ${className}`}
          {...props}
        >
          {children}
        </div>
      );
    
    case 'quote':
    case 'blockquote':
      return (
        <blockquote 
          className={`my-8 border-l-4 border-gold pl-6 py-4 italic text-gray-300 ${className}`}
          {...props}
        >
          {children}
        </blockquote>
      );
    
    case 'callout':
    case 'note':
    case 'alert':
      return (
        <div 
          className={`my-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 ${className}`}
          {...props}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20">
              <span className="text-xs font-bold text-amber-400">!</span>
            </div>
            <div className="flex-1 text-amber-300/90">
              {children}
            </div>
          </div>
        </div>
      );
    
    case 'badge':
      return (
        <span 
          className={`inline-block rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300 ${className}`}
          {...props}
        >
          {children}
        </span>
      );
    
    case 'caption':
    case 'figcaption':
      return (
        <figcaption 
          className={`mt-2 text-center text-sm text-gray-500 ${className}`}
          {...props}
        >
          {children}
        </figcaption>
      );
    
    case 'heroeyebrow':
      return (
        <div 
          className={`mb-4 text-xs font-semibold uppercase tracking-widest text-gold ${className}`}
          {...props}
        >
          {children}
        </div>
      );
    
    case 'pullquote':
    case 'pullline':
      return (
        <div 
          className={`my-8 border-y border-gray-700 py-6 ${className}`}
          {...props}
        >
          <p className="text-center text-xl italic text-gray-300">
            {children}
          </p>
        </div>
      );
    
    case 'verse':
      return (
        <div 
          className={`my-6 font-serif text-lg leading-relaxed text-gray-300 ${className}`}
          {...props}
        >
          {children}
        </div>
      );
    
    case 'rule':
    case 'hr':
    case 'divider':
      return (
        <hr 
          className={`my-8 border-t border-gray-800 ${className}`}
          {...props}
        />
      );
    
    default:
      // Generic fallback for any unknown component
      return (
        <div 
          className={`my-6 rounded-lg border border-red-500/20 bg-red-500/5 p-4 ${className}`}
          {...props}
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20">
              <span className="text-xs font-bold text-red-400">?</span>
            </div>
            <span className="text-sm font-medium text-red-400">
              Component <code className="rounded bg-red-500/10 px-2 py-1 font-mono">{componentName}</code>
            </span>
          </div>
          {children && (
            <div className="mt-3 rounded bg-gray-900/50 p-3 text-gray-300">
              {children}
            </div>
          )}
        </div>
      );
  }
};
