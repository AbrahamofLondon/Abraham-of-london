/**
 * app/admin/intelligence-foundry/living-case-fulfilment/FulfilmentClient.tsx
 *
 * Client component for the Living Case fulfilment queue.
 * Reads from the canonical fulfilment source (AdminFulfilmentEngine / in-memory store).
 * Allows admin to generate, review, amend, approve, and deliver dossiers.
 *
 * In production, this would read from Prisma (LivingCaseEntitlement + FulfilmentQueueItem).
 * For now, it reads from the in-memory store used by the checkout-entitlement module.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'

const GOLD = '#C9A96E'

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
}

interface FulfilmentItem {
  id: string
  caseId: string
  caseReference: string
  tier: string
  decisionClass: string
  status: string
  requiresHumanReview: boolean
  regulatedBoundaryHit: boolean
  paidAt: string
  completedAt: string | null
  notes: string[]
}

interface EntitlementRecord {
  id: string
  caseId: string
  caseReference: string
  tier: string
  grantedAt: string
  grantType: string
  amount: number
  active: boolean
  requiresHumanReview: boolean
  regulatedBoundaryHit: boolean
  fulfilmentStatus: string
}

export default function LivingCaseFulfilmentClient() {
  const [fulfilmentItems, setFulfilmentItems] = useState<FulfilmentItem[]>([])
  const [entitlements, setEntitlements] = useState<EntitlementRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<FulfilmentItem | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [actionResult, setActionResult] = useState<string | null>(null)

  // Load fulfilment data from the in-memory store via API
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // In production, this would call an API endpoint that reads from Prisma.
      // For now, we simulate by reading from the module's in-memory store.
      // The store is populated by the checkout-entitlement module during tests.
      const res = await fetch('/api/admin/intelligence-foundry/living-case-fulfilment')
      if (res.ok) {
        const data = await res.json()
        setFulfilmentItems(data.fulfilmentItems || [])
        setEntitlements(data.entitlements || [])
      }
    } catch (e) {
      console.error('Failed to load fulfilment data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Simulate admin actions
  const handleAction = useCallback(async (itemId: string, action: string) => {
    setActionResult(`Processing: ${action}...`)
    try {
      const res = await fetch(`/api/admin/intelligence-foundry/living-case-fulfilment/${itemId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: reviewNote, actorId: 'admin@abraham.com' }),
      })
      if (res.ok) {
        setActionResult(`${action} completed successfully`)
        await loadData()
        setReviewNote('')
      } else {
        const err = await res.json()
        setActionResult(`Error: ${err.error || 'Unknown error'}`)
      }
    } catch (e) {
      setActionResult(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }, [reviewNote, loadData])

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-white/40 text-sm" style={mono}>Loading fulfilment queue...</p>
      </div>
    )
  }

  // Show detail view if an item is selected
  if (selectedItem) {
    const entitlement = entitlements.find(e => e.caseId === selectedItem.caseId)
    return (
      <div>
        <button
          onClick={() => { setSelectedItem(null); setActionResult(null) }}
          className="mb-6 inline-flex items-center gap-2 border border-white/[0.10] px-4 py-2 text-[10px] uppercase tracking-widest text-white/50 transition-all hover:text-white/70"
          style={mono}
        >
          ← Back to queue
        </button>

        <div className="border border-white/[0.08] bg-white/[0.02] p-6">
          <h2 className="font-serif text-xl font-light italic text-white/80" style={{ fontStyle: 'italic' }}>
            {selectedItem.caseReference}
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <DetailField label="Case ID" value={selectedItem.caseId} />
            <DetailField label="Tier" value={selectedItem.tier} />
            <DetailField label="Decision Class" value={selectedItem.decisionClass} />
            <DetailField label="Status" value={selectedItem.status} />
            <DetailField label="Human Review" value={selectedItem.requiresHumanReview ? 'Required' : 'Not required'} />
            <DetailField label="Regulated Boundary" value={selectedItem.regulatedBoundaryHit ? 'Hit' : 'Not hit'} />
            <DetailField label="Paid At" value={new Date(selectedItem.paidAt).toLocaleString()} />
            <DetailField label="Amount" value={entitlement ? `£${(entitlement.amount / 100).toFixed(2)}` : 'N/A'} />
            <DetailField label="Grant Type" value={entitlement?.grantType || 'N/A'} />
          </div>

          {selectedItem.notes.length > 0 && (
            <div className="mt-4">
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40 mb-2">Notes</p>
              <ul className="space-y-1">
                {selectedItem.notes.map((note, i) => (
                  <li key={i} className="text-[12px] text-white/50">• {note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Admin actions */}
          <div className="mt-8 border-t border-white/[0.06] pt-6">
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/60 mb-4">Admin Actions</p>

            <div className="flex flex-wrap gap-2">
              <ActionButton label="Generate Dossier" onClick={() => handleAction(selectedItem.id, 'generate')} color="amber" />
              <ActionButton label="Approve" onClick={() => handleAction(selectedItem.id, 'approve')} color="emerald" />
              <ActionButton label="Approve with Amendment" onClick={() => handleAction(selectedItem.id, 'amend')} color="blue" />
              <ActionButton label="Return for Reclassification" onClick={() => handleAction(selectedItem.id, 'return')} color="amber" />
              <ActionButton label="Mark Not Deliverable" onClick={() => handleAction(selectedItem.id, 'reject')} color="red" />
              <ActionButton label="Mark Delivered" onClick={() => handleAction(selectedItem.id, 'deliver')} color="emerald" />
            </div>

            <div className="mt-4">
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Review notes (optional)..."
                rows={2}
                className="w-full border border-white/[0.10] bg-white/[0.02] p-3 text-[13px] text-white/70 placeholder-white/20 outline-none resize-none"
                style={mono}
              />
            </div>

            {actionResult && (
              <p className={`mt-3 text-[12px] ${actionResult.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                {actionResult}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Queue view
  return (
    <div>
      {actionResult && (
        <div className="mb-4 border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-[12px] text-emerald-400/80">{actionResult}</p>
        </div>
      )}

      {fulfilmentItems.length === 0 && entitlements.length === 0 ? (
        <div className="border border-white/[0.06] bg-white/[0.01] p-8 text-center">
          <p className="text-white/40 text-sm" style={mono}>No fulfilment items yet. Complete a checkout to create one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-3 pr-4 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">Reference</th>
                <th className="pb-3 pr-4 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">Tier</th>
                <th className="pb-3 pr-4 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">Class</th>
                <th className="pb-3 pr-4 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">Status</th>
                <th className="pb-3 pr-4 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">Review</th>
                <th className="pb-3 pr-4 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">Boundary</th>
                <th className="pb-3 pr-4 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">Paid</th>
                <th className="pb-3 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40"></th>
              </tr>
            </thead>
            <tbody>
              {fulfilmentItems.map(item => (
                <tr key={item.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="py-3 pr-4 text-white/70">{item.caseReference}</td>
                  <td className="py-3 pr-4">
                    <span className="border border-white/[0.10] px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/50" style={mono}>
                      {item.tier.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-white/50">{item.decisionClass}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-3 pr-4">
                    {item.requiresHumanReview ? (
                      <span className="text-amber-400/70 text-[10px]" style={mono}>REQUIRED</span>
                    ) : (
                      <span className="text-white/30 text-[10px]" style={mono}>—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {item.regulatedBoundaryHit ? (
                      <span className="text-amber-400/70 text-[10px]" style={mono}>HIT</span>
                    ) : (
                      <span className="text-white/30 text-[10px]" style={mono}>—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-white/40 text-[11px]">
                    {new Date(item.paidAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="border border-white/[0.10] px-3 py-1 text-[9px] uppercase tracking-widest text-white/50 transition-all hover:text-white/70"
                      style={mono}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
              {/* Also show entitlements without fulfilment items */}
              {entitlements
                .filter(e => !fulfilmentItems.some(f => f.caseId === e.caseId))
                .map(ent => (
                  <tr key={ent.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] opacity-60">
                    <td className="py-3 pr-4 text-white/70">{ent.caseReference}</td>
                    <td className="py-3 pr-4">
                      <span className="border border-white/[0.10] px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/50" style={mono}>
                        {ent.tier.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-white/50">—</td>
                    <td className="py-3 pr-4">
                      <span className="text-white/30 text-[10px]" style={mono}>NO FULFILMENT</span>
                    </td>
                    <td className="py-3 pr-4" colSpan={4}></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-[11px] text-white/25">
        Showing {fulfilmentItems.length} fulfilment item(s) and {entitlements.length} entitlement(s).
        Data source: Living Case entitlement + fulfilment store.
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40 mb-1">{label}</p>
      <p className="text-[13px] text-white/70">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid_pending_review: 'text-amber-400/80',
    in_review: 'text-blue-400/80',
    approved: 'text-emerald-400/80',
    delivered: 'text-emerald-400/80',
    cancelled: 'text-red-400/60',
    pending: 'text-amber-400/60',
    dossier_generated: 'text-emerald-400/70',
    quality_failed: 'text-red-400/70',
    amended: 'text-blue-400/70',
    rejected: 'text-red-400/70',
  }
  return (
    <span className={`${colors[status] || 'text-white/40'} text-[10px]`} style={mono}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  )
}

function ActionButton({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'border-amber-500/30 text-amber-400/80 hover:bg-amber-500/10',
    emerald: 'border-emerald-500/30 text-emerald-400/80 hover:bg-emerald-500/10',
    blue: 'border-blue-500/30 text-blue-400/80 hover:bg-blue-500/10',
    red: 'border-red-500/30 text-red-400/80 hover:bg-red-500/10',
  }
  return (
    <button
      onClick={onClick}
      className={`border px-3 py-1.5 text-[9px] uppercase tracking-widest transition-all ${colorMap[color] || ''}`}
      style={mono}
    >
      {label}
    </button>
  )
}
