"use client";

import * as React from "react";
import { SafeReadingProgress } from "./ReadingProgress";
import { BackToTop } from "./BackToTop";

interface EnhancedLayoutProps {
  children: React.ReactNode;
  enableProgress?: boolean;
  enableBackToTop?: boolean;
}

export const EnhancedLayout: React.FC<EnhancedLayoutProps> = ({
  children,
  enableProgress = true,
  enableBackToTop = true,
}) => {
  return (
    <>
      {enableProgress && <SafeReadingProgress />}
      {children}
      {enableBackToTop && <BackToTop />}
    </>
  );
};

// Safe SSR version
export const SafeEnhancedLayout: React.FC<EnhancedLayoutProps> = (props) => {
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <>{props.children}</>;
  }
  
  return <EnhancedLayout {...props} />;
};