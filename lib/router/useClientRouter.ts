// lib/router/useClientRouter.ts — ROUTER-FREE, TURBO-SAFE
import { useEffect, useMemo, useState } from "react";

export function useClientIsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

export function useClientQuery(): Record<string, string> {
  const ready = useClientIsReady();
  return useMemo(() => {
    if (!ready || typeof window === "undefined") return {};
    const out: Record<string, string> = {};
    const sp = new URLSearchParams(window.location.search || "");
    for (const [k, v] of sp.entries()) out[k] = v;
    return out;
  }, [ready]);
}

export function useClientRouter() {
  const ready = useClientIsReady();

  const pathname = useMemo(() => {
    if (!ready || typeof window === "undefined") return "/";
    return window.location.pathname || "/";
  }, [ready]);

  const push = (href: string) => {
    if (typeof window === "undefined") return;
    window.location.href = href;
  };

  const replace = (href: string) => {
    if (typeof window === "undefined") return;
    window.location.replace(href);
  };

  return { isReady: ready, pathname, push, replace };
}