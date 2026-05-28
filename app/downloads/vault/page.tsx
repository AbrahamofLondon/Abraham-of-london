/* app/downloads/vault/page.tsx — server wrapper */
import { Suspense } from "react";
import {
  VAULT_FILE_MANIFEST,
  VAULT_INDEX_MANIFEST,
} from "@/lib/runtime/vault-manifest";
import VaultBrowserClient from "./VaultBrowserClient";

export const dynamic = "force-dynamic";

export default function VaultPage() {
  const items = [
    ...VAULT_INDEX_MANIFEST.map((entry) => ({
      id: entry.slug,
      category: entry.category,
      title: entry.title,
      description: "Editorial-series vault entry.",
      type: entry.type,
      href: entry.slug,
      access: "editorial",
      isDownloadable: false,
    })),
    ...VAULT_FILE_MANIFEST.filter((entry) => entry.isDownloadable).map((entry) => ({
      id: entry.key,
      category: "private",
      title: entry.title,
      description: "Private vault file served through the protected vault delivery route.",
      type: entry.fileType,
      href: `/api/private/vault/${entry.key}`,
      access: entry.requiredTier,
      isDownloadable: true,
    })),
  ];

  return (
    <Suspense fallback={null}>
      <VaultBrowserClient items={items} />
    </Suspense>
  );
}
