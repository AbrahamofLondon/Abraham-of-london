// app/boardroom/dossier/[dossierId]/page.tsx
// Client-facing restricted Boardroom Dossier page.
// Access-gated via secure signed delivery token (?token=<raw>).
// Replaces legacy ?email= query-parameter access.

"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";

type DossierSection = {
  id: string;
  label: string;
  content: string;
  tone: "factual" | "confrontational" | "quantified";
};

type DossierData = {
  id: string;
  title: string;
  classification: string;
  qualifiedForBoard: boolean;
  gateMessage: string | null;
  sections: DossierSection[];
  objectionHandling: Array<{ objection: string; response: string }>;
  decisionPath: Array<{ option: string; consequence: string; recommended: boolean }>;
  status: string;
  viewCount: number;
};

const TONE_BORDER: Record<string, string> = {
  factual: "border-white/10",
  confrontational: "border-amber-400/20",
  quantified: "border-emerald-400/20",
};

const TONE_COLOR: Record<string, string> = {
  factual: "text-white/70",
  confrontational: "text-amber-400/80",
  quantified: "text-emerald-400/80",
};

export default function BoardroomDossierPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const dossierId = params?.dossierId as string;
  const token = searchParams?.get("token") ?? "";

  const [dossier, setDossier] = React.useState<DossierData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!dossierId || !token) {
      setError("Access link invalid. Please use the link provided in your briefing document.");
      setLoading(false);
      return;
    }

    fetch(`/api/boardroom/dossier/${dossierId}?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setDossier(data.dossier);
        } else {
          setError(data.error ?? "Access denied");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [dossierId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-sm text-white/30 font-mono">Loading dossier...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6 opacity-20">◈</div>
          <h1 className="text-lg font-semibold text-white/60 mb-2">Boardroom Dossier</h1>
          <p className="text-sm text-white/30 mb-6">{error}</p>
          <p className="text-xs text-white/15">Abraham of London — Restricted Access</p>
        </div>
      </div>
    );
  }

  if (!dossier) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500/60">
              {dossier.classification}
            </span>
            <span className="text-[10px] text-white/15">·</span>
            <span className="text-[10px] font-mono text-white/30">
              {dossier.sections.length} sections
            </span>
          </div>
          <h1 className="text-xl font-serif italic text-white/80 leading-tight">
            {dossier.title}
          </h1>
          {dossier.qualifiedForBoard && (
            <div className="mt-3 inline-block rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400/70">
              Board-qualified
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Gate message */}
        {dossier.gateMessage && (
          <div className="rounded-lg border border-amber-400/15 bg-amber-400/5 p-4">
            <p className="text-sm text-amber-300/70">{dossier.gateMessage}</p>
          </div>
        )}

        {/* Sections */}
        {dossier.sections.map((section) => (
          <div
            key={section.id}
            className={`rounded-lg border ${TONE_BORDER[section.tone] ?? "border-white/10"} bg-white/[0.02] p-5`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-sm font-medium ${TONE_COLOR[section.tone] ?? "text-white/70"}`}>
                {section.label}
              </span>
              <span className="ml-auto text-[8px] font-mono uppercase tracking-wider text-white/15">
                {section.tone}
              </span>
            </div>
            <div className="text-sm text-white/50 leading-relaxed whitespace-pre-line font-light">
              {section.content}
            </div>
          </div>
        ))}

        {/* Objection handling */}
        {dossier.objectionHandling.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-white/20">
              Objection Handling
            </h2>
            {dossier.objectionHandling.map((obj, i) => (
              <div key={i} className="rounded-lg border border-white/8 bg-white/[0.02] p-4 space-y-2">
                <p className="text-sm text-amber-400/70 font-medium">&ldquo;{obj.objection}&rdquo;</p>
                <p className="text-sm text-white/50 pl-4 border-l border-white/10">{obj.response}</p>
              </div>
            ))}
          </div>
        )}

        {/* Decision paths */}
        {dossier.decisionPath.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-white/20">
              Decision Paths
            </h2>
            {dossier.decisionPath.map((path, i) => (
              <div
                key={i}
                className={`rounded-lg border p-4 ${
                  path.recommended
                    ? "border-emerald-400/20 bg-emerald-400/5"
                    : "border-white/8 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-medium ${
                    path.recommended ? "text-emerald-300/80" : "text-white/50"
                  }`}>
                    {path.option}
                  </span>
                  {path.recommended && (
                    <span className="text-[8px] font-mono uppercase tracking-wider text-emerald-400/50">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/40">{path.consequence}</p>
              </div>
            ))}
          </div>
        )}

        {/* Strategy Room escalation */}
        <div className="rounded-lg border border-amber-400/15 bg-amber-400/5 p-5 text-center">
          <p className="text-sm text-amber-300/70 mb-2">
            This dossier qualifies for escalation to Strategy Room.
          </p>
          <p className="text-xs text-amber-400/50">
            Contact your Abraham of London advisor to schedule a Strategy Room session.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-white/8 pt-6 text-center">
          <p className="text-xs text-white/20 font-mono">
            Abraham of London — Boardroom Dossier
          </p>
          <p className="text-[10px] text-white/10 mt-1">
            This document is restricted. Do not distribute.
          </p>
        </div>
      </main>
    </div>
  );
}
