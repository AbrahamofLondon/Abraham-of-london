// components/Divider.tsx
import * as React from "react";

interface DividerProps {
  className?: string;
  [key: string]: unknown; // Allow any additional props
}

const Divider: React.FC<DividerProps> = ({ className = "", ...props }) => (
  <div className={`relative my-16 h-px w-full ${className}`} {...props}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-softGold/50 to-transparent" />
  </div>
);

export default Divider;
