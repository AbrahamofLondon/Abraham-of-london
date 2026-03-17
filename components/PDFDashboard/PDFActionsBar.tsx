/* components/PDFDashboard/PDFActionsBar.tsx — REFINED FOR INSTITUTIONAL UI */
import * as React from "react";
import { safeSlice } from "@/lib/utils/safe";

// Minimal, UI-safe view model as requested
export type PDFActionsBarPDF = {
  id: string;
  title?: string | null;
  description?: string | null;
  excerpt?: string | null;
  type?: string | null;
  tier?: string | null;
  isInteractive?: boolean;
  isFillable?: boolean;
  isGenerating?: boolean;
};

export type PDFActionsBarProps = {
  pdf: PDFActionsBarPDF;
  isGenerating: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  onGeneratePDF: () => void | Promise<void>;
  onDeletePDF: () => void | Promise<void>;
  onDuplicatePDF: () => void | Promise<void>;
  onRenamePDF: (newTitle: string) => void | Promise<void>;
  onUpdateMetadata: (metadata: any) => void | Promise<void>;
  onShare: () => void | Promise<void>;
};

function clampTitle(s: string, max = 90) {
  const v = (s || "").trim();
  if (v.length <= max) return v;
  return safeSlice(v, 0, max - 1) + "…";
}

const PDFActionsBar: React.FC<PDFActionsBarProps> = ({
  pdf,
  isGenerating,
  canEdit,
  canDelete,
  canShare,
  onGeneratePDF,
  onDeletePDF,
  onDuplicatePDF,
  onRenamePDF,
  onUpdateMetadata,
  onShare,
}) => {
  const [renaming, setRenaming] = React.useState(false);
  const [title, setTitle] = React.useState(pdf.title || "");

  React.useEffect(() => {
    setTitle(pdf.title || "");
    setRenaming(false); // Reset renaming state when switching documents
  }, [pdf.id, pdf.title]);

  const busy = Boolean(isGenerating || pdf.isGenerating);
  const typeLabel = (pdf.type || "PDF").toString();
  const tierLabel = (pdf.tier || "Standard").toString();

  return (
    <div className="bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-white/5 p-5 md:p-6 transition-all duration-500">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {typeLabel} <span className="mx-1 opacity-30">•</span> {tierLabel}
            </div>

            {pdf.isFillable && (
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-tighter">
                Fillable
              </span>
            )}

            {pdf.isInteractive && (
              <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-tighter">
                Interactive
              </span>
            )}
          </div>

          {!renaming ? (
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight truncate leading-none">
              {pdf.title || "Untitled Brief"}
            </h3>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && title.trim()) {
                    setRenaming(false);
                    void onRenamePDF(clampTitle(title, 120));
                  }
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-sm outline-none focus:border-amber-500/50 transition-colors"
                placeholder="Enter document title..."
                disabled={busy}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-black text-xs font-bold uppercase hover:bg-amber-500 disabled:opacity-50 transition-all"
                  disabled={busy || !title.trim()}
                  onClick={() => {
                    setRenaming(false);
                    void onRenamePDF(clampTitle(title, 120));
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-bold uppercase hover:bg-zinc-700 transition-all"
                  onClick={() => {
                    setRenaming(false);
                    setTitle(pdf.title || "");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-zinc-500 line-clamp-1 italic font-light">
            {pdf.description || pdf.excerpt || "No briefing notes available."}
          </p>
        </div>

        {/* Action Group */}
        <div className="flex flex-wrap gap-2 md:justify-end items-center">
          <button
            type="button"
            className="h-10 px-5 rounded-xl bg-amber-600/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 hover:text-black transition-all disabled:opacity-30 disabled:grayscale"
            disabled={busy}
            onClick={() => void onGeneratePDF()}
          >
            {busy ? "Processing..." : "Generate"}
          </button>

          <div className="h-6 w-[1px] bg-white/5 mx-1 hidden md:block" />

          <button
            type="button"
            className="h-10 px-4 rounded-xl bg-zinc-900/50 text-zinc-400 border border-white/5 text-[10px] font-bold uppercase hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-30"
            disabled={busy}
            onClick={() => void onDuplicatePDF()}
          >
            Copy
          </button>

          {canEdit && !renaming && (
            <button
              type="button"
              className="h-10 px-4 rounded-xl bg-zinc-900/50 text-zinc-400 border border-white/5 text-[10px] font-bold uppercase hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-30"
              disabled={busy}
              onClick={() => setRenaming(true)}
            >
              Rename
            </button>
          )}

          {canShare && (
            <button
              type="button"
              className="h-10 px-4 rounded-xl bg-zinc-900/50 text-zinc-400 border border-white/5 text-[10px] font-bold uppercase hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-30"
              disabled={busy}
              onClick={() => void onShare()}
            >
              Share
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              className="h-10 px-4 rounded-xl bg-rose-950/20 text-rose-500 border border-rose-500/20 text-[10px] font-bold uppercase hover:bg-rose-600 hover:text-white transition-all disabled:opacity-30"
              disabled={busy}
              onClick={() => {
                if(confirm("Confirm deletion of intelligence brief?")) void onDeletePDF();
              }}
            >
              Purge
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

PDFActionsBar.displayName = "PDFActionsBar";
export default React.memo(PDFActionsBar);