/* components/PolicyFooter.tsx — HARDENED VERSION */
"use client";

import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

interface PolicyFooterProps {
  isDark?: boolean;
}

function resolveEmail(config: any): string {
  const direct = config?.email;
  const nested = config?.author?.email;
  const contact = config?.contact?.email;
  return (direct || nested || contact || "info@abrahamoflondon.org").trim();
}

export default function PolicyFooter({ isDark = true }: PolicyFooterProps): React.ReactElement | null {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Hydration Shield

  const email = resolveEmail(siteConfig);
  const border = isDark ? "border-white/10" : "border-white/10";
  const bg = isDark ? "bg-white/[0.02]" : "bg-gradient-to-br from-white to-slate-50";
  const heading = isDark ? "text-white/90" : "text-white/90";
  const body = isDark ? "text-white/45" : "text-white/52";
  const subtle = isDark ? "text-white/35" : "text-slate-500";
  const link = isDark
    ? "text-white/60 underline decoration-white/15 underline-offset-4 hover:text-white/80"
    : "text-white/70 underline decoration-white/15 underline-offset-4 hover:text-white/90";

  return (
    <section className={`overflow-hidden border ${border} ${bg} backdrop-blur-sm p-7 sm:p-8`}>
      <div className="mx-auto max-w-3xl text-center">
        <p className={`text-[10px] font-mono uppercase tracking-[0.35em] ${subtle}`}>
          Governance · Policies
        </p>
        <h3 className={`mt-3 font-serif text-xl sm:text-2xl ${heading}`}>
          Clear terms. Minimal friction.
        </h3>
        {/* ... JSX remains consistent with your institutional style ... */}
        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm font-medium">
           <Link href="/privacy" className={link}>Privacy</Link>
           <Link href="/terms" className={link}>Terms</Link>
           <Link href="/security" className={link}>Security</Link>
        </div>
        <p className={`mt-5 text-xs ${body}`}>
          Questions? <Link href="/contact" className={link}>Contact</Link> or email <a href={`mailto:${email}`} className={link}>{email}</a>.
        </p>
      </div>
    </section>
  );
}