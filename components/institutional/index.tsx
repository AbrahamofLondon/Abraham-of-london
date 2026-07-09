import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, FileText, LockKeyhole, CheckCircle2, AlertTriangle, Clock, TrendingUp, BarChart3, Globe } from 'lucide-react';

export const ink = '#091017';
export const ledger = '#11161C';
export const paper = '#F1EEE6';
export const warm = '#FAF8F3';
export const graphite = '#343A40';
export const evidenceGrey = '#747B80';
export const brass = '#B59258';
export const brassLight = '#D7BC84';
export const semanticConfirmed = '#2D5A4A';
export const semanticMonitoring = '#9A7B3C';
export const semanticContradicted = '#6B3A3A';
export const semanticUnresolved = '#4A4A50';

export const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
export const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export function InstitutionalSurfaceShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen" style={{ backgroundColor: ink, color: 'rgba(255,255,255,0.92)' }}>
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-12">{children}</div>
    </main>
  );
}

export function SurfaceCover({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-16">
      <p className="font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>{eyebrow}</p>
      <h1 className="mt-5 font-serif text-5xl leading-[0.98] md:text-6xl" style={{ color: 'rgba(255,255,255,0.94)' }}>{title}</h1>
      {description && <p className="mt-5 max-w-3xl text-base leading-8" style={{ color: 'rgba(255,255,255,0.58)' }}>{description}</p>}
      {children}
    </div>
  );
}

export function StateBadge({ state, dark = false }: { state: string; dark?: boolean }) {
  const colorMap: Record<string, string> = {
    GOVERNANCE_VERIFIED: semanticConfirmed, CONTROLLED_BY_DESIGN: brass, EVIDENCE_PENDING: semanticMonitoring,
    RELEASE_GATED: semanticContradicted, INACTIVE: semanticUnresolved, RETIRED: evidenceGrey, INTERNAL_ONLY: '#8B8FA0',
    PUBLISHABLE: semanticConfirmed, PRELIMINARY: semanticMonitoring, INSUFFICIENT_COVERAGE: semanticUnresolved,
    PREVIEW: semanticMonitoring, PUBLISHED: semanticConfirmed, SUPERSEDED: evidenceGrey, ACTIVE: semanticConfirmed,
    DEVELOPING: semanticMonitoring, UNAVAILABLE: semanticUnresolved, CONFIRMED: semanticConfirmed,
    NOT_CONFIRMED: semanticContradicted, PENDING_REVIEW: semanticMonitoring, DISCONFIRMED: semanticContradicted,
    TOO_EARLY_TO_ASSESS: semanticUnresolved, FALSIFIED: semanticContradicted, CARRIED_FORWARD: brass,
    ORIGINATED: brassLight, REVISED: semanticMonitoring, CLOSED: evidenceGrey, UNRESOLVED: semanticUnresolved,
    STRENGTHENED: semanticConfirmed, WEAKENED: semanticMonitoring,
  };
  const colour = colorMap[state] || evidenceGrey;
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-sans text-[11px] font-medium uppercase tracking-[0.14em] ${dark ? 'border-white/15' : ''}`} style={{ borderColor: colour + '40', color: colour, backgroundColor: colour + '0D' }}>
      {state.replace(/_/g, ' ')}
    </span>
  );
}

export function EvidenceMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/5 py-2">
      <span className="font-sans text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: evidenceGrey }}>{label}</span>
      <span className="font-mono text-[12px] text-right" style={{ color: 'rgba(255,255,255,0.72)' }}>{value}</span>
    </div>
  );
}

export function AuthorityStamp({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 border px-3 py-1.5" style={{ borderColor: brass + '30', backgroundColor: brass + '0A' }}>
      <ShieldCheck style={{ width: 12, height: 12, color: brassLight }} />
      <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: brassLight }}>{children}</span>
    </div>
  );
}

export function SectionLedger({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <p className="mb-6 font-sans text-[12px] font-medium uppercase tracking-[0.20em]" style={{ color: brassLight }}>{title}</p>
      {children}
    </section>
  );
}

export function MetricStatement({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="border p-4" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
      <p className="font-serif text-3xl" style={{ color: 'rgba(255,255,255,0.88)' }}>{value}</p>
      <p className="mt-1 font-sans text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: evidenceGrey }}>{label}</p>
    </div>
  );
}

export function MethodologyReceipt({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="border p-5" style={{ borderColor: brass + '20', backgroundColor: brass + '06' }}>
      <p className="mb-4 font-sans text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: brassLight }}>Methodology receipt</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between gap-4 border-b py-2" style={{ borderColor: brass + '12' }}>
            <span className="font-sans text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
            <span className="font-mono text-[12px] text-right" style={{ color: 'rgba(255,255,255,0.82)' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProvenanceReceipt({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="border p-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: evidenceGrey }}>Provenance</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: evidenceGrey }}>{item.label}</span>
            <span className="font-mono text-[11px] text-right" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AccessBoundary({ children }: { children: React.ReactNode }) {
  return (
    <div className="border p-4" style={{ borderColor: brass + '20', backgroundColor: brass + '06' }}>
      <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: brassLight }}>Licensed reader access</p>
      <p className="text-sm leading-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{children}</p>
    </div>
  );
}

export function EmptyEvidenceState({ title, description }: { title: string; description: string }) {
  return (
    <div className="border border-dashed p-6 text-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
      <p className="font-serif text-xl" style={{ color: 'rgba(255,255,255,0.5)' }}>{title}</p>
      <p className="mt-3 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.3)' }}>{description}</p>
    </div>
  );
}

export function PreviewBanner() {
  return (
    <div className="mb-10 border p-4" style={{ borderColor: semanticMonitoring + '30', backgroundColor: semanticMonitoring + '08' }}>
      <p className="font-sans text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: semanticMonitoring }}>Illustrative system preview</p>
      <p className="mt-2 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
        No authoritative historical score is being asserted. The interface demonstrates the review structure using non-authoritative examples. The live record activates once real reviewed editions are in place.
      </p>
    </div>
  );
}

export function RelationshipNavigator({ upstream, downstream, current }: { upstream?: Array<{ label: string; href: string }>; downstream?: Array<{ label: string; href: string }>; current: string }) {
  return (
    <div className="mt-16 border-t pt-8" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: evidenceGrey }}>Estate relationship</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {upstream?.map((u) => (
          <React.Fragment key={u.href}>
            <Link href={u.href} className="font-mono text-[11px] uppercase tracking-[0.12em] transition hover:opacity-70" style={{ color: evidenceGrey }}>{u.label}</Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>→</span>
          </React.Fragment>
        ))}
        <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: brassLight }}>{current}</span>
        {downstream?.map((d) => (
          <React.Fragment key={d.href}>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>→</span>
            <Link href={d.href} className="font-mono text-[11px] uppercase tracking-[0.12em] transition hover:opacity-70" style={{ color: evidenceGrey }}>{d.label}</Link>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
