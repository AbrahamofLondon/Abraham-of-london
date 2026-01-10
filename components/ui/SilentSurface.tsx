// components/ui/SilentSurface.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SilentSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  interactive?: boolean;
  glass?: boolean;
  muted?: boolean;
}

const SilentSurface = React.forwardRef<HTMLDivElement, SilentSurfaceProps>(
  (
    { 
      children, 
      className, 
      hover = false, 
      interactive = false,
      glass = false,
      muted = false,
      ...props 
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "relative overflow-hidden transition-all duration-700",
          
          // Background and border
          "border border-white/[0.04]",
          "bg-gradient-to-b from-white/[0.02] to-white/[0.01]",
          
          // Glass effect
          glass && "backdrop-blur-[2px]",
          
          // Muted variant
          muted 
            ? "bg-white/[0.008] border-white/[0.02]" 
            : "bg-white/[0.02] border-white/[0.04]",
          
          // Hover effects
          hover && [
            "group/surface",
            "hover:border-white/[0.08]",
            "hover:bg-white/[0.03]",
            "hover:shadow-[0_0_30px_rgba(212,175,55,0.05)]",
            "hover:shadow-[#D4AF37]/[0.05]",
            "before:absolute before:inset-0",
            "before:bg-gradient-to-r before:from-transparent before:via-white/[0.01] before:to-transparent",
            "before:translate-x-[-100%] before:transition-transform before:duration-1000",
            "group-hover/surface:before:translate-x-[100%]",
          ],
          
          // Interactive cursor
          interactive && "cursor-pointer",
          
          className
        )}
        {...props}
      >
        {/* Subtle inner glow on hover */}
        {hover && (
          <>
            <div 
              className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/surface:opacity-100"
              style={{
                background: `radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.03) 0%, transparent 50%)`,
              }}
            />
            <div 
              className="absolute inset-0 opacity-0 transition-opacity duration-1000 group-hover/surface:opacity-100"
              style={{
                background: `linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.01) 50%, transparent 100%)`,
              }}
            />
          </>
        )}
        
        {/* Content */}
        <div className="relative z-10">{children}</div>
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 h-px w-12 bg-gradient-to-r from-transparent to-white/[0.08]" />
        <div className="absolute top-0 right-0 h-px w-12 bg-gradient-to-l from-transparent to-white/[0.08]" />
        <div className="absolute bottom-0 left-0 h-px w-12 bg-gradient-to-r from-transparent to-white/[0.04]" />
        <div className="absolute bottom-0 right-0 h-px w-12 bg-gradient-to-l from-transparent to-white/[0.04]" />
      </div>
    );
  }
);

SilentSurface.displayName = "SilentSurface";

export default SilentSurface;

