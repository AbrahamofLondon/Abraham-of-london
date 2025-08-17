import Image from "next/image";
import Link from "next/link";
import type { MDXComponents as MDXComponentsType } from "mdx/types";
import * as React from "react";

const isInternal = (href = "") => href.startsWith("/") || href.startsWith("#");

function toNumber(v?: number | string) {
  if (v == null) return undefined;
  if (typeof v === "number") return v;
  const n = parseInt(String(v).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : undefined;
}

const A: MDXComponentsType["a"] = ({ href = "", children, className, title }) => {
  const base =
    "text-forest underline underline-offset-2 hover:text-softGold transition-colors " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest " +
    "dark:text-softGold dark:hover:text-cream dark:focus-visible:ring-softGold";
  const cls = className ? `${base} ${className}` : base;

  if (isInternal(href)) {
    return (
      <Link href={href} prefetch={false} className={cls} title={title}>
        {children}
      </Link>
    );
  }

  const isHttp = /^https?:\/\//i.test(href);
  const externalProps = isHttp
    ? {
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label":
          typeof children === "string"
            ? `${children} (opens in new tab)`
            : "Opens in new tab",
      }
    : {};

  return (
    <a href={href} className={cls} title={title} {...externalProps}>
      {children}
    </a>
  );
};

type ImgProps = React.ComponentProps<"img"> & {
  width?: number | string;
  height?: number | string;
};

const Img: MDXComponentsType["img"] = ({
  src,
  alt = "",
  className,
  title,
  width,
  height,
  ...rest
}: ImgProps) => {
  const safeSrc = src || "/assets/images/default-book.jpg";
  const w = toNumber(width);
  const h = toNumber(height);
  const hasDim = !!(w && h);

  const [loaded, setLoaded] = React.useState(false);

  const skeleton =
    "bg-gradient-to-r from-lightGrey/20 via-lightGrey/40 to-lightGrey/20 " +
    "animate-[shimmer_1.8s_linear_infinite]";

  return (
    <figure className="my-6">
      {hasDim ? (
        <Image
          src={safeSrc}
          alt={alt || (title ? String(title) : "Embedded image")}
          width={w}
          height={h}
          sizes="(max-width: 768px) 100vw, 800px"
          className={className || "rounded-lg shadow-card object-cover"}
          loading="lazy"
          decoding="async"
          onLoadingComplete={() => setLoaded(true)}
          {...(rest as any)}
        />
      ) : (
        <span
          className={`block relative w-full h-96 rounded-lg overflow-hidden shadow-card ${className || ""}`}
        >
          <Image
            src={safeSrc}
            alt={alt || (title ? String(title) : "Embedded image")}
            fill
            sizes="100vw"
            priority={false}
            className="object-cover"
            onLoadingComplete={() => setLoaded(true)}
          />
          {!loaded && (
            <>
              <style jsx>{`
                @keyframes shimmer {
                  0% {
                    background-position: -200% 0;
                  }
                  100% {
                    background-position: 200% 0;
                  }
                }
              `}</style>
              <span className={`absolute inset-0 ${skeleton}`} aria-hidden="true" />
            </>
          )}
        </span>
      )}
      {title && (
        <figcaption className="mt-2 text-sm text-deepCharcoal/70 dark:text-cream/80">
          {title}
        </figcaption>
      )}
    </figure>
  );
};

export const MDXComponents: MDXComponentsType = {
  a: A,
  img: Img,
};

export default MDXComponents;






