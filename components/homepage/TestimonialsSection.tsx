"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";

export type Testimonial = {
  quote: string;
  name: string;
  role?: string;
  company?: string;
  href?: string;         // optional source link
  avatar?: string;       // /public path
  logo?: string;         // company logo /public path
  rating?: 1 | 2 | 3 | 4 | 5;
  metric?: string;       // e.g. "Team alignment in 1 session"
  verified?: boolean;    // shows a check badge
  date?: string;         // ISO
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
    quote:
      "Abraham cut through the noise. We left with a one-page plan and started executing that week.",
    name: "Ohis O.",
    role: "SAP Consultant",
    metric: "Plan to execution in 7 days",
    verified: true,
  },
  {
    quote:
      "Finally—a fatherhood voice with a spine. Clear practices my kids noticed, not just theories.",
    name: "Emilia I.",
    role: "Manager",
    metric: "Family rhythms that stick",
    verified: true,
  },
  {
    quote:
      "We stopped debating and started deciding. The team aligned on priorities and owners in one session.",
    name: "Lanre",
    role: "Consultant",
    metric: "Clarity ÃƒÂ¢Ã¢â‚¬' ownership",
    verified: true,
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

  const subText = variant === "dark" ? "text-[color:var(--color-on-primary)/0.8]" : "text-[color:var(--color-on-secondary)/0.8]";

  // JSON-LD (Review list)
  const ldJson = React.useMemo(() => {
    const reviews = data.map((t) => {
      const review: any = {
        "@type": "Review",
        reviewBody: t.quote,
        author: { "@type": "Person", name: t.name, ...(t.role ? { jobTitle: t.role } : {}) },
      };
      if (t.rating) {
        review.reviewRating = {
          "@type": "Rating",
          ratingValue: t.rating,
          bestRating: 5,
          worstRating: 1,
        };
      }
      if (t.company) {
        review.publisher = { "@type": "Organization", name: t.company };
      }
      if (t.date) review.datePublished = t.date;
      if (t.href) review.url = t.href;
      return review;
    });
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

  const Star = ({ filled }: { filled: boolean }) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={filled ? "text-softGold" : subText}
    >
      <path
        fill="currentColor"
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.25l-7.19-.61L12 2 9.19 8.64 2 9.25l5.46 4.72L5.82 21z"
      />
    </svg>
  );

  const Check = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="text-softGold">
      <path fill="currentColor" d="M9 16.2l-3.5-3.6-1.4 1.4L9 19 20 8l-1.4-1.4z" />
    </svg>
  );

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

          {subtitle && <p className={clsx("text-center mb-8", subText)}>{subtitle}</p>}

          {data.length === 0 ? (
            <p className={clsx("text-center", subText)}>No testimonials yet.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {data.map((t, i) => (
                <motion.figure
                  key={`${t.name}-${t.role ?? "role"}-${i}`}
                  className={clsx(
                    "rounded-2xl shadow-md p-6 relative overflow-hidden",
                    card
                  )}
                  initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={reduceMotion ? undefined : { duration: 0.45, delay: i * 0.06 }}
                >
                  {/* Header: avatar / logo / rating / verified */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {t.avatar && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.avatar}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                          loading="lazy"
                        />
                      )}
                      <div>
                        <div className="text-sm font-semibold">
                          {t.name}{" "}
                          {t.verified && (
                            <span className="ml-1 inline-flex items-center gap-1 text-xs text-softGold">
                              <Check /> Verified
                            </span>
                          )}
                        </div>
                        <div className={clsx("text-xs", subText)}>
                          {[t.role, t.company].filter(Boolean).join(" Ãƒâ€šÃ‚Â· ")}
                        </div>
                      </div>
                    </div>
                    {typeof t.rating === "number" && (
                      <div className="flex items-center gap-0.5" aria-label={`${t.rating} out of 5`}>
                        {[1,2,3,4,5].map(n => <Star key={n} filled={n <= (t.rating as number)} />)}
                      </div>
                    )}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-base leading-relaxed">
                    <span aria-hidden className="sr-only">"</span>
                    <span className="block line-clamp-6">{t.quote}</span>
                    <span aria-hidden className="sr-only">"</span>
                  </blockquote>

                  {/* Footer: metric chip + source */}
                  <figcaption className={clsx("mt-4 text-xs flex items-center gap-3", subText)}>
                    {t.metric && (
                      <span className="rounded-full bg-softGold/15 text-deepCharcoal px-2 py-0.5">
                        {t.metric}
                      </span>
                    )}
                    {t.href && (
                      <a
                        href={t.href}
                        className="underline underline-offset-4 hover:no-underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Source
                      </a>
                    )}
                    {t.date && <time dateTime={t.date}>{new Date(t.date).toLocaleDateString()}</time>}
                  </figcaption>

                  {t.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.logo}
                      alt=""
                      className="pointer-events-none absolute -right-4 -bottom-2 h-14 w-auto opacity-10"
                      loading="lazy"
                    />
                  )}
                </motion.figure>
              ))}
            </div>
          )}
        </div>

        {/* JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
        />
      </div>
    </section>
  );
}
