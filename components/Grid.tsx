// components/Grid.tsx
import React from "react";

interface GridProps {
  children?: React.ReactNode;
  className?: string;
}

export default function Grid({ 
  children, 
  className = "" 
}: GridProps) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}