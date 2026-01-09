"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 300);
    };
    
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-40 p-3 bg-gradient-to-br from-white to-gray-50 border border-gray-200/80 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
      aria-label="Back to top"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-sm opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
        <div className="relative flex items-center justify-center w-10 h-10 bg-white rounded-full">
          <ArrowUp className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
        </div>
      </div>
      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        Back to top
      </div>
    </button>
  );
};