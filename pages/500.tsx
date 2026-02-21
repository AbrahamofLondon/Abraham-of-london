import Head from "next/head";
import * as React from "react";

export default function Custom500() {
  return (
    <>
      <Head>
        <title>500 | Abraham of London</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <div className="mb-6 text-xs font-mono uppercase tracking-[0.35em] text-white/50">
            Server Incident
          </div>
          <h1 className="text-3xl md:text-5xl font-light tracking-tight">
            500 — Internal error
          </h1>
          <p className="mt-4 text-white/60">
            The archive is intact. The interface failed. Try again.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
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