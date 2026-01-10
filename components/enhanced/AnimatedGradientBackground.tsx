// components/enhanced/AnimatedGradientBackground.tsx
"use client";

import * as React from "react";

export const AnimatedGradientBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <div className="absolute -left-20 -top-20 h-[500px] w-[500px] animate-float rounded-full bg-gradient-to-br from-amber-500/20 via-transparent to-blue-500/20 blur-3xl" />
      <div 
        className="absolute -right-20 top-1/2 h-[400px] w-[400px] animate-float rounded-full bg-gradient-to-br from-blue-500/15 via-transparent to-purple-500/15 blur-3xl" 
        style={{ animationDelay: '2s' }} 
      />
      <div 
        className="absolute bottom-20 left-1/2 h-[300px] w-[300px] animate-float rounded-full bg-gradient-to-br from-amber-600/10 via-transparent to-emerald-500/10 blur-3xl" 
        style={{ animationDelay: '4s' }} 
      />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
    </div>
  );
};

export default AnimatedGradientBackground;
