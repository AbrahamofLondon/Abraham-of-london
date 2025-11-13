// app/fonts/index.ts
"use client";

import { useEffect, useState } from "react";
import type { FontFamilyKey } from "@/lib/fonts";
export * from "@/lib/fonts";

// Very simple loader hook – always "loaded" after first render
export function useFontLoader(
  _families: FontFamilyKey[] = [],
  _eager: boolean = false
) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return { loaded };
}