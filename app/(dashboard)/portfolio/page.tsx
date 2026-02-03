/* app/(dashboard)/portfolio/page.tsx — INSTITUTIONAL MASTER VIEW */
import * as React from "react";
import PortfolioSummary from "@/components/dashboard/PortfolioSummary";
import GrowthChart from "@/components/dashboard/GrowthChart";

export const metadata = {
  title: "Intelligence Portfolio | Abraham of London",
  description: "Institutional audit and velocity of strategic assets.",
};

export default function PortfolioDashboardPage() {
  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100">
      {/* 1. Header Section */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0f0f0f] px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.4em] text-emerald-800 dark:text-emerald-500 font-bold">
                Archive Command
              </span>
              <h1 className="text-4xl font-light tracking-tighter italic">
                Strategic Intelligence Portfolio
              </h1>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                System Status: <span className="text-emerald-600">Authenticated</span>
              </p>
              <p className="text-[9px] font-mono text-neutral-500 mt-1">
                Last Audit: {new Date().toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Content Grid */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left/Center Columns: Analytics & Growth */}
          <div className="lg:col-span-2 space-y-12">
            <section className="bg-white dark:bg-[#0f0f0f] border border-neutral-200 dark:border-neutral-800">
              <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-semibold">
                  Asset Distribution
                </h3>
              </div>
              {/* Reusing the Stats Square logic here or embedding the summary */}
              <PortfolioSummary />
            </section>

            <section>
              <GrowthChart />
            </section>
          </div>

          {/* Right Column: Information Feed & Controls */}
          <div className="space-y-8">
            <div className="bg-emerald-950 p-8 text-cream shadow-xl">
              <h3 className="text-xs uppercase tracking-[0.2em] mb-4 opacity-80">Access Terminal</h3>
              <p className="text-sm font-light leading-relaxed opacity-90">
                You are currently viewing the restricted portfolio index. All 252 
                recorded assets have been indexed for cross-reference.
              </p>
              <button className="mt-6 w-full border border-cream/30 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-cream hover:text-emerald-950 transition-all">
                Export Audit Log (PDF)
              </button>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Governance Policy</h3>
              <ul className="space-y-3 text-[11px] text-neutral-500 font-light leading-snug">
                <li>• Assets: Minimum 1,000 words per Intel Brief.</li>
                <li>• Tiering: Enforced via V5 Portfolio Engine.</li>
                <li>• Archiving: Automated 24-hour sync cycles.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}