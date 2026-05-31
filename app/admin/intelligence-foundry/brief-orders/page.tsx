/**
 * app/admin/intelligence-foundry/brief-orders/page.tsx
 *
 * LEGACY ARCHIVE — Decision Brief Order fulfilment queue.
 *
 * This page is retained for audit/reference only.
 * All new Living Case fulfilment uses:
 *   /admin/intelligence-foundry/living-case-fulfilment
 *
 * Do not use this page for new fulfilment workflows.
 */

import BriefOrdersPageClient from "./PageClient";

export default function BriefOrdersPage() {
  return (
    <div>
      {/* Legacy archive banner */}
      <div className="border-b border-amber-500/20 bg-amber-500/5 px-6 py-3">
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/70 text-center">
          Legacy DecisionBriefOrder Archive — Not used for new Living Case fulfilment.
          Use{' '}
          <a
            href="/admin/intelligence-foundry/living-case-fulfilment"
            className="underline hover:text-amber-300"
          >
            Living Case Fulfilment
          </a>
          {' '}for the canonical fulfilment queue.
        </p>
      </div>
      <BriefOrdersPageClient />
    </div>
  )
}