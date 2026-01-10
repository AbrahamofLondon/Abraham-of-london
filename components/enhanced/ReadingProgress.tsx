"use client";

import * as React from "react";

export const ReadingProgress: React.FC = () => {
  const [progress, setProgress] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      
      if (docHeight > 0) {
        const scrollPercent = Math.min((scrollTop / docHeight) * 100, 100);
        setProgress(scrollPercent);
        setIsVisible(scrollTop > 100);
      }
    };
    
    // Debounce for performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    updateProgress(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50 pointer-events-none">
      <div 
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-150 ease-out"
        style={{ 
          width: `${progress}%`,
          opacity: progress > 0 && progress < 100 ? 1 : 0,
          transition: 'width 150ms ease-out, opacity 300ms ease-out'
        }}
      />
      <div className="absolute top-1 right-4 text-xs text-gray-500 font-mono bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
        {Math.round(progress)}%
      </div>
    </div>
  );
};

// Safe fallback for SSR
export const SafeReadingProgress: React.FC = () => {
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) return null;
  
  return <ReadingProgress />;
};
