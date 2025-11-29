// lib/server/pages-data.ts
import type { PageMeta } from "@/types/page";

// Mock data - replace with your actual data source
const mockPages: PageMeta[] = [
  {
    slug: "about",
    title: "About Abraham of London",
    description:
      "Learn more about Abraham of London and his work in technology and innovation.",
    content: "# About Abraham of London\n\nWelcome to my digital space.",
  },
  {
    slug: "contact",
    title: "Contact",
    description:
      "Get in touch with Abraham of London for collaborations and inquiries.",
    content: "# Contact\n\nReach out to discuss opportunities.",
  },
];

export function getPageSlugs(): string[] {
  return mockPages.map((page) => page.slug);
}

export function getPageBySlug(
  slug: string,
  fields: string[] = []
): PageMeta | null {
  const page = mockPages.find((p) => p.slug === slug);
  if (!page) return null;

  // Filter fields if specified
  if (fields.length > 0) {
    const filteredPage: any = {};
    fields.forEach((field) => {
      if (field in page) {
        filteredPage[field] = (page as any)[field];
      }
    });
    return filteredPage;
  }

  return page;
}
