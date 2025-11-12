// lib/fonts/client.tsx
"use client";

import * as React from "react";
import type { ReactElement } from "react";
import { inter, playfair, jetbrainsMono, sourceSerif, spaceGrotesk, customFont } from "./index";

/** Lightweight loader flag; avoids nuking SSR by keeping it client-only */
export function useFontLoader(
  _fonts: Array<"sans" | "serif" | "mono" | "display" | "serif-alt" | "custom">,
  _preload = false
): { loaded: boolean; error: string | null } {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        if (document && "fonts" in document) {
          await (document as any).fonts.ready;
        }
        setLoaded(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Font readiness check failed");
        setLoaded(true);
      }
    })();
  }, []);

  return { loaded, error };
}

/** Optional: hide FOUT/FOIT with a fade-in once fonts are ready */
export function withFonts<P extends object>(Component: React.ComponentType<P>) {
  return function FontProvider(props: P): ReactElement {
    const { loaded, error } = useFontLoader(["sans", "serif", "mono", "display"]);
    const fontVariables = [
      inter.variable,
      playfair.variable,
      jetbrainsMono.variable,
      sourceSerif.variable,
      spaceGrotesk.variable,
      customFont.variable,
    ].join(" ");

    return (
      <div className={`${fontVariables} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
        {error && (
          <div className="sr-only" aria-live="polite">
            Font loading issues; using fallbacks.
          </div>
        )}
        <Component {...props} />
      </div>
    );
  };
}

/** If you want explicit preloading, do it via <Head> link tags in layout, not here.
 * next/font already inlines @font-face with preload hints for Google fonts.
 */
export function FontPreloader() {
  return null;
}