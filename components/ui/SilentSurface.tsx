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
          "relative overflow-hidden transition-all duration-500",
          
          // Background and border
          "border border-white/[0.14]",
          "bg-[#0E0E12]",
          
          // Glass effect is intentionally flattened for readability
          glass && "bg-[#111116]",
          
          // Muted variant
          muted 
            ? "bg-[#0A0A0E] border-white/[0.12]" 
            : "bg-[#0E0E12] border-white/[0.14]",
          
          // Hover effects
          hover && [
            "group/surface",
            "hover:border-white/[0.20]",
            "hover:bg-[#121216]",
            "hover:shadow-[0_24px_72px_-36px_rgba(0,0,0,0.94)]",
          ],
          
          // Interactive cursor
          interactive && "cursor-pointer",
          
          className
        )}
        {...props}
      >
        {/* Content */}
        <div className="relative z-10">{children}</div>
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 h-px w-12 bg-gradient-to-r from-transparent to-white/[0.16]" />
        <div className="absolute top-0 right-0 h-px w-12 bg-gradient-to-l from-transparent to-white/[0.16]" />
        <div className="absolute bottom-0 left-0 h-px w-12 bg-gradient-to-r from-transparent to-white/[0.08]" />
        <div className="absolute bottom-0 right-0 h-px w-12 bg-gradient-to-l from-transparent to-white/[0.08]" />
      </div>
    );
  }
);

SilentSurface.displayName = "SilentSurface";

export default SilentSurface;

