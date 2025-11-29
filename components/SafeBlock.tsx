"use client";

import React from "react";

interface SafeBlockProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function SafeBlock({
  children,
  fallback = null,
}: SafeBlockProps) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [children]);

  if (hasError) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
