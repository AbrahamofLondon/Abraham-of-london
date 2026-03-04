// components/ui/Box.tsx
import * as React from "react";

interface BoxProps {
  children?: React.ReactNode;
  className?: string;
}

export default function Box({ children, className = "" }: BoxProps) {
  return <div className={className}>{children}</div>;
}