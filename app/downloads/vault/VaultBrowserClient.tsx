/* app/downloads/vault/VaultBrowserClient.tsx */
"use client";

import * as React from "react";
import {
  FileText,
  Download,
  Search,
  LayoutGrid,
  List,
  Lock,
  BookOpen,
} from "lucide-react";
import { InterfaceCard, MetadataTag } from "@/components/ui/BrandAssets";

export type VaultBrowserItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  type: string;
  href: string;
  access: string;
  isDownloadable: boolean;
};

type VaultBrowserClientProps = {
  items: VaultBrowserItem[];
};

function itemMatches(item: VaultBrowserItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    item.id,
    item.category,
    item.title,
    item.description,
    item.type,
    item.access,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export default function VaultBrowserClient({ items }: VaultBrowserClientProps) {
  const [query, setQuery] = React.useState("");
  const visibleItems = React.useMemo(
    () => items.filter((item) => itemMatches(item, query)),
    [items, query],
  );

  return (
    <main className="min-h-screen bg-[#060609] pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-white/5 pb-12">
          <div className="max-w-2xl">
            <MetadataTag>Authorized Repository</MetadataTag>
            <h1 className="mt-6 font-serif text-5xl md:text-7xl font-medium text-white tracking-tight">
              The <span className="italic text-white/30">Vault.</span>
            </h1>
            <p className="mt-6 text-lg font-light text-white/40 leading-relaxed">
              Restricted artifacts, templates, and frameworks developed for Abraham of London mandates. Available for direct use where access permits.
            </p>
          </div>

          <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-amber-500 transition-colors" />
            <input
              type="text"
              placeholder="Filter by ID or Category..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <InterfaceCard key={item.id} className="p-8 group/item">
              <div className="flex justify-between items-start mb-12">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 group-hover/item:bg-amber-500/20 transition-all">
                  {item.isDownloadable ? (
                    <Download className="h-5 w-5" />
                  ) : (
                    <BookOpen className="h-5 w-5" />
                  )}
                </div>
                <div className="text-right">
                  <div className="max-w-[12rem] truncate text-[9px] font-mono text-white/20 uppercase tracking-tighter">
                    {item.id.replace(/^\/vault\//, "")}
                  </div>
                  <div className="mt-1 text-[10px] font-black text-amber-500/60 uppercase">
                    {item.category}
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-4 group-hover/item:text-amber-100 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm font-light text-white/40 leading-relaxed mb-8 h-12 line-clamp-2">
                {item.description}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <span className="flex items-center gap-2 text-[10px] font-mono text-white/20">
                  <FileText className="h-3 w-3" />
                  {item.type.toUpperCase()}
                </span>

                <a
                  href={item.href}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-white transition-colors"
                >
                  {item.isDownloadable ? (
                    <Download className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  {item.isDownloadable ? "Download" : "Open"}
                </a>
              </div>

              <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity">
                <div className="absolute top-4 right-4 w-4 h-px bg-amber-500/40" />
                <div className="absolute top-4 right-4 h-4 w-px bg-amber-500/40" />
              </div>
            </InterfaceCard>
          ))}
        </div>

        <div className="mt-20 py-10 border-t border-white/5 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-4 mb-4">
            <LayoutGrid className="h-4 w-4 text-white/10" />
            <span className="text-[10px] font-mono text-white/10 uppercase tracking-[0.5em]">
              End of Directory
            </span>
            <List className="h-4 w-4 text-white/10" />
          </div>
          <p className="text-xs text-white/20">
            Mandate-specific documents are restricted. If you require a custom framework, please initiate protocol.
          </p>
        </div>

      </div>
    </main>
  );
}
