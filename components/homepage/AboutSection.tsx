"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, type Variants, type Transition } from "framer-motion";
import { siteConfig } from "@/lib/siteConfig";

export type Achievement = {
  title: string;
  description?: string;
  year: number;
  href?: string;
};

type Props = {
  bio: string;
  achievements?: Achievement[];
  portraitSrc?: string;
  portraitAlt?: string;
  priority?: boolean;
  className?: string;
  id?: string;
};

const EASE: Transition["ease"] = [0.16, 1, 0.3, 1];

const container: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const list: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delay: 0.1, staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

export default function AboutSection({
  bio,
  achievements = [],
  portraitSrc = siteConfig.authorImage,
  portraitAlt = "Portrait of Abraham of London",
  priority = false,
  className = "",
  id = "about",
}: Props) {
  const [src, setSrc] = React.useState(portraitSrc);

  React.useEffect(() => setSrc(portraitSrc), [portraitSrc]);

  return (
    <section
      id={id}
      aria-labelledby="about-heading"
      className={`container mx-auto max-w-6xl px-4 py-16 text-deepCharcoal ${className}`}
    >
      <div className="grid items-center gap-10 md:grid-cols-2">
        {/* Copy */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <h2
            id="about-heading"
            className="font-serif text-3xl sm:text-4xl font-bold text-forest tracking-tight"
          >
            About Abraham
          </h2>

          <p className="mt-4 text-lg leading-relaxed text-deepCharcoal/90">
            {bio}
          </p>

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
                <motion.li
                  key={`${a.title}-${a.year}-${i}`}
                  variants={item}
                  className="flex items-start gap-3"
                >
                  <span
                    aria-hidden
                    className="mt-2 inline-block h-2.5 w-2.5 rounded-full bg-forest"
                  />
                  <div>
                    <p className="font-semibold">
                      {a.href ? (
                        <Link
                          href={a.href}
                          prefetch={false}
                          className="underline decoration-softGold/40 underline-offset-4 hover:decoration-softGold"
                        >
                          {a.title}
                        </Link>
                      ) : (
                        a.title
                      )}{" "}
                      <time
                        className="text-sm text-forest/70"
                        dateTime={String(a.year)}
                      >
                        ({a.year})
                      </time>
                    </p>
                    {a.description && (
                      <p className="text-sm text-deepCharcoal/80">
                        {a.description}
                      </p>
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
          className="relative mx-auto aspect-square w-72 md:w-80 overflow-hidden rounded-full ring-1 ring-black/10 shadow-card bg-white"
        >
          <Image
            src={src}
            alt={portraitAlt}
            fill
            sizes="(max-width: 768px) 18rem, 20rem"
            className="object-cover"
            priority={priority}
            onError={() => setSrc("/assets/images/abraham-logo.jpg")}
          />
        </motion.div>
      </div>
    </section>
  );
}
