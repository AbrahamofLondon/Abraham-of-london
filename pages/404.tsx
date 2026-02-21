// pages/404.tsx — PRODUCTION SAFE (no Document imports, no providers)
import * as React from "react";
import Head from "next/head";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 | Abraham of London</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <div className="mb-6 text-xs font-mono uppercase tracking-[0.35em] text-white/50">
            Not Found
          </div>
          <h1 className="text-3xl md:text-5xl font-light tracking-tight">404 — Page missing</h1>
          <p className="mt-4 text-white/60">
            The archive exists. This address does not.
          </p>
          <div className="mt-10">
            <a
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition inline-block"
            >
              Return Home
            </a>
          </div>
        </div>
      </main>
    </>
  );
}