// components/homepage/AboutSection.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen, Award, Calendar, Mail } from "lucide-react";

// --- Types ---

export type Achievement = {
  title: string;
  description: string;
  year: number;
  href?: string;
  icon?: string;
};

type AboutSectionProps = {
  id?: string;
  bio: string;
  achievements?: Achievement[];
  portraitSrc?: string;
  portraitAlt?: string;
  priority?: boolean;
  className?: string;
};

// --- Animation Variants ---

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.15,
      duration: 0.8,
    },
  },
} as const;

const item = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1], // Custom easing for smooth motion
    },
  },
} as const;

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.2, ease: "easeOut" },
  },
} as const;

const iconMap: Record<string, React.ReactNode> = {
  book: <BookOpen className="h-5 w-5" />,
  award: <Award className="h-5 w-5" />,
  calendar: <Calendar className="h-5 w-5" />,
  default: <Award className="h-5 w-5" />,
};

// --- Component ---

export default function AboutSection({
  id = "about",
  bio,
  achievements = [],
  portraitSrc = "/assets/images/profile-portrait.webp",
  portraitAlt = "Portrait of Abraham of London",
  priority = false,
  className,
}: AboutSectionProps) {
  const containerRef = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  const sortedAchievements = React.useMemo(() => {
    return achievements.slice().sort((a, b) => b.year - a.year);
  }, [achievements]);

  return (
    <section
      ref={containerRef}
      id={id}
      className="relative overflow-hidden bg-gradient-to-b from-warmWhite via-cream/95 to-warmWhite dark:from-charcoal dark:via-slate-900 dark:to-charcoal"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          style={{ y: parallaxY }}
          className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-forest/5 blur-3xl dark:bg-forest/10"
        />
        <div className="absolute -left-32 bottom-1/4 h-80 w-80 rounded-full bg-saffron/5 blur-3xl dark:bg-saffron/10" />
        <div className="absolute left-1/4 top-1/2 h-64 w-64 rounded-full bg-charcoal/3 blur-3xl dark:bg-charcoal/10" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 gap-16 lg:grid-cols-2"
        >
          {/* Left Column - Portrait & Personal Info */}
          <motion.div variants={item} className="relative">
            {/* Portrait Container */}
            <div className="relative mx-auto max-w-md lg:mx-0 lg:max-w-none">
              {/* Decorative frame */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-forest/20 via-transparent to-saffron/20 dark:from-forest/30 dark:to-saffron/30" />
              
              <div className="relative overflow-hidden rounded-2xl border border-forest/20 bg-gradient-to-br from-warmWhite to-cream shadow-2xl dark:border-forest/30 dark:from-slate-800 dark:to-slate-900">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <Image
                    src={portraitSrc}
                    alt={portraitAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={priority}
                    className="object-cover object-top transition-all duration-700 hover:scale-[1.02]"
                  />
                  {/* Subtle vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
                
                {/* Overlay info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-cream">
                        Abraham of London
                      </h3>
                      <p className="text-sm text-cream/80">
                        Author & Philosopher
                      </p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="rounded-full bg-forest/20 p-2 backdrop-blur-sm"
                    >
                      <Mail className="h-5 w-5 text-cream" />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Decorative corner accents */}
              <div className="absolute -left-2 -top-2 h-12 w-12 rounded-full border border-saffron/30 bg-gradient-to-br from-saffron/10 to-transparent" />
              <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full border border-forest/30 bg-gradient-to-br from-forest/10 to-transparent" />
            </div>

            {/* Contact CTA */}
            <motion.div
              variants={fadeIn}
              className="mt-8 text-center lg:text-left"
            >
              <Link
                href="/contact"
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-forest to-forest/90 px-8 py-4 text-lg font-medium text-cream shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-forest/20"
              >
                <span className="relative z-10">Connect With Me</span>
                <Mail className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-saffron/20 via-transparent to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column - Bio & Achievements */}
          <motion.div variants={item} className="flex flex-col">
            {/* Section Header */}
            <div className="mb-8">
              <motion.div
                variants={fadeIn}
                className="mb-3 flex items-center gap-3"
              >
                <div className="h-px w-12 bg-gradient-to-r from-saffron to-transparent" />
                <span className="font-sans text-sm font-semibold uppercase tracking-widest text-forest dark:text-forest/80">
                  About Me
                </span>
              </motion.div>
              
              <motion.h1
                variants={item}
                className="font-serif text-4xl font-light leading-tight text-charcoal dark:text-cream md:text-5xl lg:text-6xl"
              >
                Crafting Wisdom Through{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Words</span>
                  <div className="absolute -bottom-2 left-0 h-2 w-full bg-gradient-to-r from-saffron/40 to-saffron/20 dark:from-saffron/30 dark:to-saffron/10" />
                </span>
              </motion.h1>
            </div>

            {/* Biography */}
            <motion.div
              variants={fadeIn}
              className="mb-12 rounded-2xl border border-forest/10 bg-gradient-to-br from-cream/50 to-warmWhite/50 p-6 backdrop-blur-sm dark:border-forest/20 dark:from-slate-800/50 dark:to-slate-900/50"
            >
              <p className="font-serif text-lg leading-relaxed text-charcoal/90 dark:text-cream/90 md:text-xl">
                {bio}
              </p>
            </motion.div>

            {/* Achievements Timeline */}
            {sortedAchievements.length > 0 && (
              <motion.div variants={item} className="mt-6">
                <div className="mb-8">
                  <h2 className="font-serif text-2xl font-light text-charcoal dark:text-cream md:text-3xl">
                    Milestones &{" "}
                    <span className="text-forest dark:text-forest/90">
                      Achievements
                    </span>
                  </h2>
                  <div className="mt-2 h-px w-24 bg-gradient-to-r from-forest to-transparent" />
                </div>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-forest/40 via-forest/20 to-transparent dark:from-forest/60 dark:via-forest/30" />

                  <div className="space-y-8 pl-6">
                    {sortedAchievements.map((achievement, index) => {
                      const Icon = iconMap[achievement.icon || "default"];
                      
                      return (
                        <motion.div
                          key={`${achievement.title}-${achievement.year}-${index}`}
                          variants={item}
                          className="relative group"
                        >
                          {/* Timeline dot */}
                          <div className="absolute -left-[25px] top-0 z-10 flex h-6 w-6 items-center justify-center rounded-full border-4 border-warmWhite bg-forest shadow-lg dark:border-charcoal dark:bg-forest/90">
                            <div className="h-1.5 w-1.5 rounded-full bg-cream" />
                          </div>

                          {/* Year */}
                          <div className="mb-2">
                            <span className="inline-block rounded-full bg-gradient-to-r from-forest/10 to-saffron/10 px-4 py-1.5 text-sm font-semibold text-forest dark:text-forest/90">
                              {achievement.year}
                            </span>
                          </div>

                          {/* Achievement card */}
                          <div
                            className={`rounded-xl border border-forest/10 bg-gradient-to-br from-warmWhite/80 to-cream/80 p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-forest/5 dark:border-forest/20 dark:from-slate-800/80 dark:to-slate-900/80 ${
                              achievement.href
                                ? "cursor-pointer hover:border-forest/30 dark:hover:border-forest/40"
                                : ""
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-forest/10 to-saffron/10 dark:from-forest/20 dark:to-saffron/20">
                                {Icon}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-serif text-lg font-medium text-charcoal dark:text-cream">
                                  {achievement.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-charcoal/70 dark:text-cream/70">
                                  {achievement.description}
                                </p>
                              </div>
                            </div>

                            {/* Link indicator */}
                            {achievement.href && (
                              <div className="mt-4 flex items-center justify-end">
                                <span className="text-xs font-medium text-forest/70 transition-colors group-hover:text-forest dark:text-forest/60 dark:group-hover:text-forest/90">
                                  Learn more →
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stats or Additional Info (Optional) */}
            <motion.div
              variants={fadeIn}
              className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              <div className="rounded-xl border border-forest/10 bg-gradient-to-br from-cream to-warmWhite p-4 text-center dark:border-forest/20 dark:from-slate-800 dark:to-slate-900">
                <div className="font-serif text-2xl font-light text-forest dark:text-forest/90">
                  {achievements.length}+
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-charcoal/60 dark:text-cream/60">
                  Works
                </div>
              </div>
              <div className="rounded-xl border border-forest/10 bg-gradient-to-br from-cream to-warmWhite p-4 text-center dark:border-forest/20 dark:from-slate-800 dark:to-slate-900">
                <div className="font-serif text-2xl font-light text-forest dark:text-forest/90">
                  {new Date().getFullYear() - 2010}+
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-charcoal/60 dark:text-cream/60">
                  Years
                </div>
              </div>
              <div className="rounded-xl border border-forest/10 bg-gradient-to-br from-cream to-warmWhite p-4 text-center dark:border-forest/20 dark:from-slate-800 dark:to-slate-900">
                <div className="font-serif text-2xl font-light text-forest dark:text-forest/90">
                  100+
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-charcoal/60 dark:text-cream/60">
                  Readers
                </div>
              </div>
              <div className="rounded-xl border border-forest/10 bg-gradient-to-br from-cream to-warmWhite p-4 text-center dark:border-forest/20 dark:from-slate-800 dark:to-slate-900">
                <div className="font-serif text-2xl font-light text-forest dark:text-forest/90">
                  ∞
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-charcoal/60 dark:text-cream/60">
                  Wisdom
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}