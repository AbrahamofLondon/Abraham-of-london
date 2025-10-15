// components/homepage/AboutSection.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export type Achievement = {
  title: string;
  description: string;
  year: number;
  href?: string;
};

type AboutSectionProps = {
  id?: string;
  bio: string;
  achievements: Achievement[];
  portraitSrc?: string;
  portraitAlt?: string;
  priority?: boolean;
  className?: string;
};

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { when: "beforeChildren", staggerChildren: 0.08 } },
} as const;

const item = {
  hidden: { y: 14, opacity: 0 },
  visible: { y: 0, opacity: 1 },
} as const;

export default function AboutSection({
  id = "about",
  bio,
  achievements,
  portraitSrc = "/assets/images/portrait.jpg",
  portraitAlt = "Portrait",
  priority = false,
  className = "",
}: AboutSectionProps) {
  return (
    <section id={id} className={`container mx-auto max-w-6xl px-4 py-10 md:py-14 ${className}`}>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 gap-8 md:grid-cols-[280px,1fr] items-start"
      >
        {/* Portrait / Sidebar */}
        <motion.aside variants={item} className="mx-auto md:mx-0 w-[220px] md:w-[260px]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-black/10 bg-warmWhite shadow-card">
            <Image
              src={portraitSrc}
              alt={portraitAlt}
              fill
              sizes="(max-width: 768px) 220px, 260px"
              priority={priority}
              className="object-cover"
            />
          </div>

          {/* Quick action */}
          <div className="mt-4 flex gap-3">
            <Link
              href="/contact"
              prefetch={false}
              className="aol-btn w-full justify-center"
              aria-label="Contact"
            >
              Contact
            </Link>
          </div>
        </motion.aside>

        {/* Main content */}
        <motion.div variants={item} className="prose md:prose-lg max-w-none text-[color:var(--color-on-secondary)/0.9] dark:prose-invert">
          <h1 className="font-serif text-3xl md:text-5xl font-bold !mb-3 !mt-0 text-forest">About</h1>
          <p className="!mt-0">{bio}</p>

          {/* Achievements */}
          {achievements?.length > 0 && (
            <div className="not-prose mt-8">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-forest">Highlights</h2>
              <ul className="mt-4 space-y-3">
                {achievements
                  .slice()
                  .sort((a, b) => b.year - a.year)
                  .map((a) => {
                    const body = (
                      <div className="flex items-start gap-3 rounded-xl border border-lightGrey bg-warmWhite p-4 shadow-card hover:shadow-cardHover transition">
                        <div className="mt-0.5 shrink-0 rounded-full bg-[color:var(--color-primary)/0.1] px-2 py-1 text-xs font-semibold text-forest">
                          {a.year}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-deepCharcoal">{a.title}</div>
                          <p className="text-sm text-[color:var(--color-on-secondary)/0.8]">{a.description}</p>
                        </div>
                      </div>
                    );

                    return (
                      <li key={`${a.title}-${a.year}`}>
                        {a.href ? (
                          <Link
                            href={a.href}
                            prefetch={false}
                            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-opacity-40 rounded-xl"
                            aria-label={`${a.title} — ${a.description}`}
                          >
                            {body}
                          </Link>
                        ) : (
                          body
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
