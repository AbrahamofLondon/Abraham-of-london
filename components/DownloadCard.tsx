// components/DownloadCard.tsx
import React from "react";

interface DownloadCardProps {
  children?: React.ReactNode;
  className?: string;
}

export default function DownloadCard({
  children,
  className = "",
}: DownloadCardProps) {
  return <div className={`${className}`}>{children}</div>;
}
