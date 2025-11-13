// components/LuxuryAnimations.tsx
import * as React from "react";

export interface FadeInProps {
  children?: React.ReactNode;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({ className, children }) => {
  return <div className={className}>{children}</div>;
};

export interface ParallaxProps {
  children?: React.ReactNode;
  strength?: number;
  className?: string;
}

export const Parallax: React.FC<ParallaxProps> = ({
  className,
  children,
}) => {
  return <div className={className}>{children}</div>;
};

const LuxuryAnimations = { FadeIn, Parallax };

export default LuxuryAnimations;