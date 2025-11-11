import * as React from "react";

export interface BrandFrameProps {
  title: string;
  subtitle?: string;
  pageSize?: "A4" | "letter";
  marginsMm?: number;
  author?: string;
  date?: string;
  children: React.ReactNode;
  className?: string;
}

export default function BrandFrame({
  title,
  subtitle,
  pageSize = "A4",
  marginsMm = 15,
  author,
  date,
  children,
  className,
}: BrandFrameProps) {
  // Your existing BrandFrame implementation
  return (
    <div className={`brand-frame ${className}`}>
      <h1>{title}</h1>
      {subtitle && <h2>{subtitle}</h2>}
      {children}
    </div>
  );
}
