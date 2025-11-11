// lib/fonts/FontProvider.tsx
"use client";

import * as React from "react";
import { inter, playfair, jetbrainsMono, sourceSerif, spaceGrotesk, customFont } from '...';

interface FontProviderProps {
  children: React.ReactNode;
}

export function FontProvider({ children }: FontProviderProps) {
  const [fontsReady, setFontsReady] = React.useState(false);

  React.useEffect(() => {
    if (typeof document !== "undefined" && "fonts" in document) {
      (document as any).fonts.ready
        .then(() => setFontsReady(true))
        .catch(() => setFontsReady(true));
    } else {
      setFontsReady(true);
    }
  }, []);

  const fontVariables = [
    inter.variable,
    playfair.variable,
    jetbrainsMono.variable,
    sourceSerif.variable,
    spaceGrotesk.variable,
    customFont.variable,
    "font-sans",
  ].join(" ");

  const visibilityClass = fontsReady
    ? "opacity-100 transition-opacity duration-300"
    : "opacity-0";

  return (
    <div className={`${fontVariables} ${visibilityClass}`}>{children}</div>
  );
}

export function FontPreloader() {
  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const preloadLinks = [
      { href: "/_next/static/media/inter-var-latin.woff2", type: "font/woff2" },
      {
        href: "/_next/static/media/playfair-display-var-latin.woff2",
        type: "font/woff2",
      },
    ];

    try {
      preloadLinks.forEach(({ href, type }) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.href = href;
        link.as = "font";
        link.type = type;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      });
    } catch {
      // silent fail
    }
  }, []);

  return null;
}
