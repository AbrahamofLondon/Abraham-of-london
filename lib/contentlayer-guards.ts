import { getAllDocuments, isDraftContent } from "@/lib/contentlayer-compat";

export async function getPublishedDocuments() {
  const docs = await getAllDocuments();
  return docs.filter((d: any) => d && !isDraftContent(d));
}