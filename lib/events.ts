import Image from "next/image";
import Link from "next/link";
import type { PostMeta } from "@/types/post";

export type BlogPostCardProps = PostMeta;

export default function BlogPostCard({
  slug,
  title,
  excerpt,
  date,
  coverImage,
  readTime,
  category,
  author,
  tags,
}: BlogPostCardProps) {
  return (
    <Link href={`/blog/${slug}`} className="block">
      <article className="rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg">
        {coverImage && (
          <div className="mb-4 h-48 w-full rounded overflow-hidden">
            <Image
              src={coverImage}
              alt={title}
              width={400}
              height={200}
              className="object-cover"
              priority={false}
            />
          </div>
        )}
        <h2 className="text-xl font-bold text-deepCharcoal">{title}</h2>
        {category && (
          <span className="mt-2 inline-block rounded bg-softGold/20 px-2 py-1 text-sm text-deepCharcoal">
            {category}
          </span>
        )}
        <p className="mt-3 text-deepCharcoal/70">{excerpt}</p>
        <div className="mt-4 flex items-center justify-between text-sm text-deepCharcoal/60">
          {date && <span>{new Date(date).toLocaleDateString()}</span>}
          {readTime && <span>{readTime}</span>}
        </div>
        {author && <p className="mt-2 text-sm text-deepCharcoal">By {author}</p>}
        {tags && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-lightGrey/30 px-3 py-1 text-xs text-deepCharcoal"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}