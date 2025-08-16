// components/homepage/AboutSection.tsx
"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export type Achievement = {
  title: string;
  description: string;
  year: number;
};

type Props = {
  bio: string;
  achievements?: Achievement[];
  portraitSrc: string;
  portraitAlt?: string;
  className?: string;
  id?: string;
};

const container = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const list = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delay: 0.1, staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function AboutSection({
  bio,
  achievements = [],
  portraitSrc,
  portraitAlt = "Portrait of Abraham of London",
  className = "",
  id = "about",
}: Props) {
  return (
    <section
      id={id}
      aria-labelledby="about-heading"
      className={`container mx-auto max-w-6xl px-4 py-16 text-deepCharcoal ${className}`}
    >
      <div className="grid items-center gap-10 md:grid-cols-2">
        {/* Copy */}
        <motion.div variants={container} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <h2
            id="about-heading"
            className="font-serif text-3xl sm:text-4xl font-bold text-forest tracking-tight"
          >
            About Abraham
          </h2>

          <p className="mt-4 text-lg leading-relaxed text-deepCharcoal/90">{bio}</p>

          {achievements.length > 0 && (
            <motion.ul
              role="list"
              variants={list}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="mt-6 grid gap-4"
            >
              {achievements.map((a, i) => (
                <motion.li key={`${a.title}-${a.year}-${i}`} variants={item} className="flex items-start gap-3">
                  <span aria-hidden className="mt-2 inline-block h-2.5 w-2.5 rounded-full bg-forest" />
                  <div>
                    <p className="font-semibold">
                      {a.title}{" "}
                      <time className="text-sm text-forest/70" dateTime={String(a.year)}>
                        ({a.year})
                      </time>
                    </p>
                    {a.description && (
                      <p className="text-sm text-deepCharcoal/80">{a.description}</p>
                    )}
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </motion.div>

        {/* Portrait */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="relative mx-auto aspect-square w-72 md:w-80 overflow-hidden rounded-full ring-1 ring-black/10 shadow-card"
        >
          <Image
            src={portraitSrc}
            alt={portraitAlt}
            fill
            sizes="(max-width: 768px) 18rem, 20rem"
            className="object-cover"
            priority={false}
          />
        </motion.div>
      </div>
    </section>
  );
}
