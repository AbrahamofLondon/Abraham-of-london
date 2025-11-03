// pages/print/entrepreneur-survival-checklist.tsx (CLEANED)
import Head from "next/head";
import * as React from "react";
import BrandFrame from "@/components/print/BrandFrame";
import { siteConfig } from "@/lib/siteConfig";

export default function EntrepreneurSurvivalChecklistPrint() {
  const title = "Entrepreneur Survival Checklist";
  const desc = "A 20-point checklist for founders in cash-conservation mode. Triage and prioritise the mission.";

  return (
    <>
      <Head>
        <title>{title} — Print Edition</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="sheet relative">
        <header className="title-area relative">
          <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2">
            {/* Branding */}
          </div>
          <h1 className="title">{title}</h1>
          <p className="subtitle">{desc}</p>
        </header>
        
        <div className="content-area">
          {/* Your content here */}
          <p>Checklist content goes here...</p>
        </div>

        <BrandFrame />
      </main>
    </>
  );
}