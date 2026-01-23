// components/PDFDashboard/PDFActionsBar.tsx
import * as React from "react";

/**
 * IMPORTANT:
 * Do NOT import PDFItem from "@/scripts/pdf-registry" here.
 * The dashboard hook may return a different PDFItem type shape.
 * This component only needs a minimal, UI-safe view model.
 */
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
  return v.slice(0, max - 1) + "…";
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
  }, [pdf.id, pdf.title]);

  const busy = Boolean(isGenerating || pdf.isGenerating);

  const typeLabel = (pdf.type || "PDF").toString();
  const tierLabel = (pdf.tier || "free").toString();

  return (
    <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-xs uppercase tracking-wider text-gray-400">
              {typeLabel} • {tierLabel}
            </div>

            {pdf.isFillable ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
                Fillable
              </span>
            ) : null}

            {pdf.isInteractive ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-sky-500/30 text-sky-300 bg-sky-500/10">
                Interactive
              </span>
            ) : null}
          </div>

          {!renaming ? (
            <h3 className="mt-1 text-lg md:text-xl font-semibold text-white truncate">
              {pdf.title || pdf.id}
            </h3>
          ) : (
            <div className="mt-2 flex gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-950/60 border border-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="New title"
                disabled={busy}
              />
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white"
                disabled={busy || !title.trim()}
                onClick={() => {
                  const next = clampTitle(title, 120);
                  setRenaming(false);
                  void onRenamePDF(next);
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white"
                disabled={busy}
                onClick={() => {
                  setRenaming(false);
                  setTitle(pdf.title || "");
                }}
              >
                Cancel
              </button>
            </div>
          )}

          <div className="mt-2 text-sm text-gray-400 line-clamp-2">
            {pdf.description || pdf.excerpt || "—"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white"
            disabled={busy}
            onClick={() => void onGeneratePDF()}
            title="Generate / Regenerate"
          >
            {busy ? "Generating…" : "Generate"}
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white"
            disabled={busy}
            onClick={() => void onDuplicatePDF()}
            title="Duplicate"
          >
            Duplicate
          </button>

          {canEdit ? (
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white"
              disabled={busy}
              onClick={() => setRenaming(true)}
              title="Rename"
            >
              Rename
            </button>
          ) : null}

          {canEdit ? (
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white"
              disabled={busy}
              onClick={() => void onUpdateMetadata({ updatedAt: new Date().toISOString() })}
              title="Touch metadata"
            >
              Update
            </button>
          ) : null}

          {canShare ? (
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white"
              disabled={busy}
              onClick={() => void onShare()}
              title="Share"
            >
              Share
            </button>
          ) : null}

          {canDelete ? (
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white"
              disabled={busy}
              onClick={() => void onDeletePDF()}
              title="Delete"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

PDFActionsBar.displayName = "PDFActionsBar";
export default React.memo(PDFActionsBar);