export interface UnifiedContent {
  slug: string;
  title: string;
  type: "print" | "blog" | "document" | "page";
  content?: string;
  description?: string;
  author?: string;
  date?: string;
  updatedAt?: string;
  category?: string;
  tags?: string[];
  printSettings?: {
    pageSize?: "A4" | "A5" | "LETTER";
    marginsMm?: number;
    includeHeader?: boolean;
    includeFooter?: boolean;
  };
  seoTitle?: string;
  seoDescription?: string;
  source: "mdx" | "contentlayer" | "api";
  published: boolean;
}

export async function getAllContent(): Promise<UnifiedContent[]> {
  const sources = await Promise.allSettled([getMdxContent(), getContentlayerContent(), getApiContent()]);
  const all: UnifiedContent[] = [];
  for (const res of sources) if (res.status === "fulfilled") all.push(...res.value);
  return all;
}

export async function getContentBySlug(slug: string): Promise<UnifiedContent | null> {
  const all = await getAllContent();
  return all.find((d) => d.slug === slug && d.published) || null;
}

export async function getContentByType(type: UnifiedContent["type"]): Promise<UnifiedContent[]> {
  const all = await getAllContent();
  return all.filter((d) => d.type === type && d.published);
}

async function getMdxContent(): Promise<UnifiedContent[]> {
  return [];
}
async function getContentlayerContent(): Promise<UnifiedContent[]> {
  return [];
}
async function getApiContent(): Promise<UnifiedContent[]> {
  return [];
}