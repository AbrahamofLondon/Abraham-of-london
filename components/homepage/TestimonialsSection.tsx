"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";

export type Testimonial = {
  quote: string;
  name: string;
  role?: string;
  href?: string; // optional source link
};

type Props = {
  items?: Testimonial[];
  title?: string;
  subtitle?: string;
  variant?: "light" | "dark";
  id?: string;
  className?: string;
  limit?: number;
};

const DEFAULT_ITEMS: Testimonial[] = [
  {
    quote: "Practical, grounded leadership insights I could apply starting from the same day.",
    name: "Ohis O.",
    role: "SAP Consultant",
  },
  {
    quote: "A sensible voice on fatherhood that is both thoughtful and actionable.",
    name: "Emilia I.",
    role: "Manager",
  },
  {
    quote: "Clear frameworks that helped our team align on goals and execution.",
    name: "Lanre",
    role: "Consultant",
  },
];

export default function TestimonialsSection({
  items,
  title = "What readers say",
  subtitle,
  variant = "light",
  id,
  className,
  limit,
}: Props) {
  const reduceMotion = useReducedMotion();
  const headingId = React.useId();

  // Safe data (limit + defensive copy)
  const data = React.useMemo(() => {
    const arr = (items?.length ? items : DEFAULT_ITEMS).slice();
    return typeof limit === "number" ? arr.slice(0, Math.max(0, limit)) : arr;
  }, [items, limit]);

  const surface =
    variant === "dark"
      ? "bg-white/10 text-cream border border-white/10 backdrop-blur"
      : "bg-white text-deepCharcoal ring-1 ring-black/5";

  const card =
    variant === "dark"
      ? "bg-white/10 border border-white/10 text-cream"
      : "bg-white ring-1 ring-black/10 text-deepCharcoal";

  const subText = variant === "dark" ? "text-cream/80" : "text-deepCharcoal/80";

  // JSON-LD (Review list)
  const ldJson = React.useMemo(() => {
    const reviews = data.map((t) => ({
      "@type": "Review",
      reviewBody: t.quote,
      author: { "@type": "Person", name: t.name, ...(t.role ? { jobTitle: t.role } : {}) },
    }));
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: reviews.map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: r,
      })),
    };
  }, [data]);

  return (
    <section
      id={id}
      className={clsx("py-16 px-4", className)}
      aria-labelledby={headingId}
      aria-label={title}
    >
      <div className="container mx-auto max-w-6xl">
        <div className={clsx("rounded-3xl shadow-2xl p-8 md:p-12", surface)}>
          <motion.h2
            id={headingId}
            className="text-3xl md:text-4xl font-serif font-bold text-center mb-3"
            initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={reduceMotion ? undefined : { duration: 0.5 }}
          >
            {title}
          </motion.h2>

          {subtitle && (
            <p className={clsx("text-center mb-8", subText)}>{subtitle}</p>
          )}

          {data.length === 0 ? (
            <p className={clsx("text-center", subText)}>No testimonials yet.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {data.map((t, i) => (
                <motion.figure
                  key={`${t.name}-${t.role ?? "role"}-${i}`}
                  className={clsx("rounded-2xl shadow-md p-6", card)}
                  initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={reduceMotion ? undefined : { duration: 0.45, delay: i * 0.06 }}
                >
                  <blockquote className="text-base leading-relaxed">
                    <span aria-hidden className="sr-only">“</span>
                    {t.quote}
                    <span aria-hidden className="sr-only">”</span>
                  </blockquote>
                  <figcaption className={clsx("mt-4 text-sm", subText)}>
                    <span className={variant === "dark" ? "text-cream font-semibold" : "text-deepCharcoal font-semibold"}>
                      {t.name}
                    </span>
                    {t.role && (
                      <>
                        <span className="px-2" aria-hidden>·</span>
                        <span>{t.role}</span>
                      </>
                    )}
                    {t.href && (
                      <>
                        <span className="px-2" aria-hidden>·</span>
                        <a
                          href={t.href}
                          className="underline underline-offset-4 hover:no-underline"
                        >
                          Source
                        </a>
                      </>
                    )}
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          )}
        </div>

        {/* JSON-LD for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }} />
      </div>
    </section>
  );
}
