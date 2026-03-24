/* ============================================================================
   FILE: pages/diagnostic.tsx
   CSS & ENVIRONMENT DIAGNOSTIC TOOL
============================================================================ */

import React, { useEffect, useState } from "react";
import Head from "next/head";

export default function Diagnostic() {
  const [cssVars, setCssVars] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    // Check computed styles on mount
    const rootStyles = getComputedStyle(document.documentElement);
    const varsToCheck = [
      "--color-background",
      "--color-primary",
      "--font-family-sans",
    ];

    const results = varsToCheck.map((v) => ({
      label: v,
      value: rootStyles.getPropertyValue(v).trim() || "NOT FOUND",
    }));

    setCssVars(results);
    
    console.log("CSS Diagnostic Results:", results);
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] text-[#f4f1ea] p-8 font-sans">
      <Head>
        <title>CSS Diagnostic Tool</title>
        <style>{`
          .test-box-internal { 
            background: #d6b26a; 
            color: #15171c; 
            padding: 1.5rem; 
            margin: 1.5rem 0;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          }
        `}</style>
      </Head>

      <main className="max-w-3xl mx-auto">
        <header className="mb-10 border-b border-white/10 pb-6">
          <h1 className="text-4xl font-serif text-white">🎨 CSS Diagnostic</h1>
          <p className="text-white/40 mt-2 font-mono text-sm uppercase tracking-widest">
            Environment Verification Tool
          </p>
        </header>

        {/* Test 1: Internal Style Tag */}
        <section className="mb-8">
          <div className="test-box-internal">
            <h2 className="text-xl font-bold mb-1">Test 1: Internal Styles</h2>
            <p className="opacity-90">
              If this box is <strong>Gold (#d6b26a)</strong>, internal scoped styles are functioning.
            </p>
          </div>
        </section>

        {/* Test 2: Tailwind Classes */}
        <section className="mb-8">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2">Test 2: Tailwind CSS</h2>
            <p className="text-slate-300 mb-4">
              If this box is <strong>Slate Blue</strong> and the button below is <strong>Amber</strong>, Tailwind is compiled and active.
            </p>
            <button className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded shadow-lg hover:bg-amber-400 transition-colors">
              Tailwind Active
            </button>
          </div>
        </section>

        {/* Test 3: CSS Variables */}
        <section className="bg-[#1a1b1e] p-6 rounded-lg border border-white/5">
          <h3 className="text-amber-400 font-mono text-xs uppercase tracking-[0.2em] mb-4">
            Global CSS Variables Check
          </h3>
          <div className="space-y-3">
            {cssVars.length > 0 ? (
              cssVars.map((v) => (
                <div key={v.label} className="flex justify-between items-center border-b border-white/5 pb-2">
                  <code className="text-white/60 text-sm">{v.label}:</code>
                  <span className={`font-mono text-sm ${v.value === 'NOT FOUND' ? 'text-red-400' : 'text-amber-200'}`}>
                    {v.value}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-white/20 text-sm italic">Scanning environment...</p>
            )}
          </div>
        </section>

        <footer className="mt-12 pt-6 border-t border-white/5 text-center">
          <p className="text-white/20 text-xs font-mono uppercase tracking-widest">
            End of Diagnostic
          </p>
        </footer>
      </main>
    </div>
  );
}