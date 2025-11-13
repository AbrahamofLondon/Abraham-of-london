export type Post = {
  slug: string;
  title?: string;
  date?: string;
  excerpt?: string | null;
  tags?: string[] | null;
  coverImage?: string | null;
};

export function safePosts(input: unknown): Post[] {
  if (!Array.isArray(input)) return [];
  return input.filter((x) => x && typeof x === "object" && "slug" in x) as Post[];
}

export function findPost(posts: Post[], slug: string): Post | undefined {
  const key = String(slug || "").toLowerCase();
  return posts.find((p) => String(p.slug || "").toLowerCase() === key);
}