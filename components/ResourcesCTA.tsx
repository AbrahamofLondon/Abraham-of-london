// components/ResourcesCTA.tsx
import React from "react";

interface ResourcesCTAProps {
  children?: React.ReactNode;
  className?: string;
}

export default function ResourcesCTA({ 
  children, 
  className = "" 
}: ResourcesCTAProps) {
  return (
    <div className={`resourcescta ${className}`}>
      {children}
    </div>
  );
}
