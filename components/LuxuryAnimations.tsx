import * as React from "react";

export const FadeIn: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => {
  return <div className={className}>{children}</div>;
};

export const Parallax: React.FC<React.PropsWithChildren<{ strength?: number; className?: string }>> = ({
  className,
  children,
}) => {
  return <div className={className}>{children}</div>;
};

export default { FadeIn, Parallax };