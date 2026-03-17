/* app/(dashboard)/pricing/page.tsx — INSTITUTIONAL PRICE CONTROL */
import * as React from "react";
import EventPriceManager from "@/components/admin/EventPriceManager";
import { CreditCard, ShieldAlert, History } from "lucide-react";

export const metadata = {
  title: "Price Registry | Abraham of London",
  description: "Modification of clearance tier costs and event registration fees.",
};

export default function AdminPricingPage() {
  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100">
      
      {/* 1. Institutional Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0f0f0f] px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.4em] text-amber-600 dark:text-amber-500 font-bold">
                Financial Command
              </span>
              <h1 className="text-4xl font-light tracking-tighter italic">
                Clearance Tier Pricing Matrix
              </h1>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Registry Status: <span className="text-amber-600">Write-Enabled</span>
              </p>
              <p className="text-[9px] font-mono text-neutral-500 mt-1">
                Last Updated: {new Date().toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Content Grid */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Pricing Interface */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white dark:bg-[#0f0f0f] border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-white/5">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-semibold flex items-center gap-2">
                  <CreditCard className="w-3 h-3" /> Live Event Registry
                </h3>
              </div>
              
              {/* The Core Logic Component */}
              <div className="p-2">
                <EventPriceManager />
              </div>
            </section>
          </div>

          {/* Side Context & Governance */}
          <div className="space-y-8">
            
            {/* Warning / Policy Box */}
            <div className="bg-neutral-900 dark:bg-neutral-950 p-8 text-neutral-100 border-l-4 border-amber-500 shadow-xl">
              <h3 className="text-[10px] uppercase tracking-[0.2em] mb-4 text-amber-500 font-bold flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" /> Integrity Protocol
              </h3>
              <p className="text-sm font-light leading-relaxed opacity-90">
                Modifications to the pricing matrix are processed in real-time. 
                These values override all static `EVENT_PRICE_MATRIX` fallbacks 
                within the Stripe API middleware.
              </p>
            </div>

            {/* Audit/Log References */}
            <div className="border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
                <History className="w-3 h-3" /> Governance Rules
              </h3>
              <ul className="space-y-3 text-[11px] text-neutral-500 font-light leading-snug">
                <li>• All prices are stored in GBP (Pence).</li>
                <li>• Changes trigger an automated Audit Log entry.</li>
                <li>• Verified Tiers must maintain a minimum 25% premium over Public rates.</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}