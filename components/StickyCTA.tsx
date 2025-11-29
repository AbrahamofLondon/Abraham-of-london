// components/StickyCTA.tsx
"use client";

import * as React from "react";
import Button from "@/components/Button";

export interface StickyCTAProps {
  label: string;
  href?: string;
  onClick?: () => void;
}

export function StickyCTA({
  label,
  href,
  onClick,
}: StickyCTAProps): JSX.Element | null {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = (): void => {
      setVisible(window.scrollY > 300);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {href ? (
        <a href={href} onClick={onClick}>
          <Button size="lg" variant="primary" className="shadow-lg">
            {label}
          </Button>
        </a>
      ) : (
        <Button
          size="lg"
          variant="primary"
          className="shadow-lg"
          onClick={onClick}
        >
          {label}
        </Button>
      )}
    </div>
  );
}

export default StickyCTA;
