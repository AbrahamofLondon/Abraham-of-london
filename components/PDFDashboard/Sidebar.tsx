import React, { useCallback, useMemo } from "react";
import type { PDFItem, DashboardStats, ViewMode } from "@/types/pdf-dashboard";
import { FileText, RefreshCw, CheckCircle, Clock, AlertCircle, Trash2, Copy, Pencil } from "lucide-react";

type SidebarProps = {
  pdfs: PDFItem[];
  selectedPDFId: string | null;
  selectedPDFs: Set<string>;
  stats: DashboardStats;
  isGenerating: boolean;
  viewMode: ViewMode;
  onSelectPDF: (id: string) => void;
  onGeneratePDF: (id: string, options?: unknown) => Promise<unknown> | void;
  onToggleSelection: (id: string) => void;
  onClearSelection: () => void;
  onDeletePDF: (id: string) => Promise<void> | void;
  onDuplicatePDF: (id: string) => Promise<unknown> | void;
  onRenamePDF: (id: string, newTitle: string) => Promise<void> | void;
  onUpdateMetadata: (id: string, metadata: Partial<PDFItem>) => Promise<void> | void;
  canEdit: boolean;
  canDelete: boolean;
};

function statusFor(pdf: PDFItem): "generating" | "generated" | "error" | "pending" {
  if (pdf.isGenerating) return "generating";
  if (pdf.exists) return "generated";
  if (pdf.error) return "error";
  return "pending";
}

function statusText(s: ReturnType<typeof statusFor>) {
  switch (s) {
    case "generating":
      return "Generating…";
    case "generated":
      return "Ready";
    case "error":
      return "Error";
    default:
      return "Missing";
  }
}

function statusBadgeClass(s: ReturnType<typeof statusFor>) {
  switch (s) {
    case "generated":
      return "bg-green-500/15 text-green-300 border border-green-500/20";
    case "generating":
      return "bg-amber-500/15 text-amber-300 border border-amber-500/20";
    case "error":
      return "bg-red-500/15 text-red-300 border border-red-500/20";
    default:
      return "bg-blue-500/15 text-blue-300 border border-blue-500/20";
  }
}

function StatusIcon({ s }: { s: ReturnType<typeof statusFor> }) {
  if (s === "generating") return <RefreshCw className="h-4 w-4 text-amber-400 animate-spin" />;
  if (s === "generated") return <CheckCircle className="h-4 w-4 text-green-400" />;
  if (s === "error") return <AlertCircle className="h-4 w-4 text-red-400" />;
  return <Clock className="h-4 w-4 text-gray-400" />;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pdfs,
  selectedPDFId,
  selectedPDFs,
  stats,
  isGenerating,
  viewMode,
  onSelectPDF,
  onGeneratePDF,
  onToggleSelection,
  onClearSelection,
  onDeletePDF,
  onDuplicatePDF,
  onRenamePDF,
  onUpdateMetadata,
  canEdit,
  canDelete,
}) => {
  const selectedCount = selectedPDFs.size;
  const selectedIds = useMemo(() => Array.from(selectedPDFs), [selectedPDFs]);

  const handleRename = useCallback(
    async (pdf: PDFItem) => {
      if (!canEdit) return;
      const nextTitle = window.prompt("Rename PDF", pdf.title);
      if (!nextTitle || !nextTitle.trim() || nextTitle.trim() === pdf.title) return;
      await onRenamePDF(pdf.id, nextTitle.trim());
    },
    [canEdit, onRenamePDF]
  );

  const handleDelete = useCallback(
    async (pdf: PDFItem) => {
      if (!canDelete) return;
      const ok = window.confirm(`Delete "${pdf.title}"? This cannot be undone.`);
      if (!ok) return;
      await onDeletePDF(pdf.id);
    },
    [canDelete, onDeletePDF]
  );

  const handleDuplicate = useCallback(
    async (pdf: PDFItem) => {
      if (!canEdit) return;
      await onDuplicatePDF(pdf.id);
    },
    [canEdit, onDuplicatePDF]
  );

  const handleToggleSelect = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onToggleSelection(id);
    },
    [onToggleSelection]
  );

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">PDF Statistics</h3>
          <span className="text-xs text-gray-400">View: {viewMode}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/30 rounded-xl p-3">
            <p className="text-sm text-gray-400">Total</p>
            <p className="text-2xl font-bold mt-1">{stats.totalPDFs}</p>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-3">
            <p className="text-sm text-gray-400">Generated</p>
            <p className="text-2xl font-bold mt-1 text-green-300">{stats.generated}</p>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-3">
            <p className="text-sm text-gray-400">Missing</p>
            <p className="text-2xl font-bold mt-1 text-amber-300">{stats.missingPDFs}</p>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-3">
            <p className="text-sm text-gray-400">Errors</p>
            <p className="text-2xl font-bold mt-1 text-red-300">{stats.errors}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="text-sm text-gray-300">
            Selected: <span className="font-semibold">{selectedCount}</span>
          </div>
          <button
            type="button"
            onClick={onClearSelection}
            disabled={selectedCount === 0}
            className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">PDF List</h3>
          <div className="text-sm text-gray-400">{pdfs.length} items</div>
        </div>

        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-2">
          {pdfs.map((pdf) => {
            const s = statusFor(pdf);
            const selected = selectedPDFId === pdf.id;
            const multiSelected = selectedPDFs.has(pdf.id);

            return (
              <button
                key={pdf.id}
                type="button"
                onClick={() => onSelectPDF(pdf.id)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${
                  selected
                    ? "bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-800/60"
                    : "bg-gray-800/20 hover:bg-gray-800/40 border-gray-800/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-blue-300 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{pdf.title}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusBadgeClass(s)}`}>
                          {statusText(s)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {pdf.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusIcon s={s} />

                    <button
                      type="button"
                      onClick={(e) => handleToggleSelect(e, pdf.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        multiSelected
                          ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/20"
                          : "bg-gray-900/40 text-gray-200 border-gray-700/60 hover:bg-gray-900/60"
                      }`}
                    >
                      {multiSelected ? "Selected" : "Select"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {!pdf.exists && s !== "generating" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void onGeneratePDF(pdf.id);
                      }}
                      className="px-3 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                      disabled={isGenerating}
                    >
                      Generate
                    </button>
                  )}

                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleRename(pdf);
                        }}
                        className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors inline-flex items-center gap-2"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Rename
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDuplicate(pdf);
                        }}
                        className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors inline-flex items-center gap-2"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Duplicate
                      </button>
                    </>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(pdf);
                      }}
                      className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors inline-flex items-center gap-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {pdfs.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No PDFs found matching your criteria.</p>
          </div>
        )}

        {selectedIds.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            Selected IDs: {selectedIds.slice(0, 3).join(", ")}
            {selectedIds.length > 3 ? ` … (+${selectedIds.length - 3})` : ""}
          </div>
        )}
      </div>
    </div>
  );
};

const SidebarComponent = React.memo(Sidebar);
export default SidebarComponent;