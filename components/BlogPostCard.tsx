// components/BlogPostCard.tsx
import Image from "next/image";
import Link from "next/link";

export type BlogPostCardProps = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage?: string;
  author: string;
  readTime?: string;
  category?: string;
  /** Optional highlight styling for featured posts */
  isFeatured?: boolean;
  className?: string;
};

function formatDate(d: string) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

export default function BlogPostCard({
  slug,
  title,
  date,
  excerpt,
  coverImage,
  author,
  readTime,
  category,
  isFeatured = false,
  className = "",
}: BlogPostCardProps) {
  const src =
    typeof coverImage === "string" && coverImage.trim()
      ? coverImage
      : "/assets/images/blog/default-blog-cover.jpg";

  return (
    <article
      className={[
        "group rounded-xl border border-lightGrey bg-white shadow-card hover:shadow-cardHover transition overflow-hidden",
        isFeatured ? "ring-2 ring-forest/20" : "",
        className,
      ].join(" ")}
    >
      <Link
        href={`/blog/${slug}`}
        className="block relative w-full h-56 md:h-64"
      >
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          priority={isFeatured}
        />
        {isFeatured && (
          <span className="absolute top-3 left-3 rounded-full bg-forest text-cream text-xs font-semibold px-3 py-1 shadow">
            Featured
          </span>
        )}
      </Link>

      <div className="p-4">
        {category && (
          <span className="inline-block text-xs rounded bg-warmWhite border border-lightGrey px-2 py-1 text-deepCharcoal/80 mb-2">
            {category}
          </span>
        )}

        <h3 className="text-xl font-serif text-deepCharcoal group-hover:underline mb-2">
          <Link href={`/blog/${slug}`}>{title}</Link>
        </h3>

        <p className="text-sm text-deepCharcoal/80 line-clamp-3">{excerpt}</p>

        <div className="mt-4 flex items-center justify-between text-xs text-deepCharcoal/60">
          <span>{author}</span>
          <span>
            {readTime ? `${readTime} Ãƒâ€šÃ‚Â· ` : ""}
            {formatDate(date)}
          </span>
        </div>
      </div>
    </article>
  );
}




