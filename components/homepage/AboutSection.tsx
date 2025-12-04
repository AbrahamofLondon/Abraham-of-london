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
      ease: [0.22, 1, 0.36, 1],
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
      className="relative overflow-hidden bg-gradient-to-b from-warmWhite to-cream dark:from-slate-950 dark:to-slate-900"
    >
      {/* Subtle background patterns */}
      <div className="absolute inset-0">
        <motion.div
          style={{ y: parallaxY }}
          className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-forest/5 blur-3xl dark:bg-forest/10"
        />
        <div className="absolute -left-32 bottom-1/4 h-80 w-80 rounded-full bg-saffron/5 blur-3xl dark:bg-saffron/10" />
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
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-forest/10 via-transparent to-saffron/10" />
              
              <div className="relative overflow-hidden rounded-2xl border-2 border-forest/20 bg-white shadow-2xl dark:border-forest/30 dark:bg-slate-900">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                </div>
              </div>

              {/* Name plate */}
              <div className="mt-6 rounded-lg bg-gradient-to-r from-forest/5 to-saffron/5 p-4 dark:from-forest/10 dark:to-saffron/10">
                <h3 className="font-serif text-xl font-semibold text-forest dark:text-forest-light">
                  Abraham of London
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Author, Philosopher & Mentor
                </p>
              </div>
            </div>

            {/* Contact CTA */}
            <motion.div
              variants={fadeIn}
              className="mt-8 text-center lg:text-left"
            >
              <Link
                href="/contact"
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-forest to-emerald-700 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-forest/30"
              >
                <span className="relative z-10">Connect With Me</span>
                <Mail className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-saffron/30 via-transparent to-transparent transition-transform duration-700 group-hover:translate-x-full" />
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
                <div className="h-px w-12 bg-gradient-to-r from-saffron to-forest" />
                <span className="font-sans text-sm font-semibold uppercase tracking-widest text-saffron dark:text-saffron/90">
                  About Me
                </span>
              </motion.div>
              
              <motion.h1
                variants={item}
                className="font-serif text-4xl font-bold leading-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl"
              >
                Crafting Wisdom Through{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-forest to-emerald-700 bg-clip-text text-transparent">
                    Words & Works
                  </span>
                  <div className="absolute -bottom-2 left-0 h-1 w-full bg-gradient-to-r from-saffron to-forest" />
                </span>
              </motion.h1>
            </div>

            {/* Biography */}
            <motion.div
              variants={fadeIn}
              className="mb-12"
            >
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 md:text-xl">
                {bio}
              </p>
            </motion.div>

            {/* Achievements Timeline */}
            {sortedAchievements.length > 0 && (
              <motion.div variants={item} className="mt-6">
                <div className="mb-8">
                  <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                    Milestones &{" "}
                    <span className="text-forest dark:text-forest-light">
                      Achievements
                    </span>
                  </h2>
                  <div className="mt-2 h-px w-24 bg-gradient-to-r from-forest to-transparent" />
                </div>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-forest/60 via-forest/40 to-transparent" />

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
                          <div className="absolute -left-[25px] top-0 z-10 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-forest shadow-lg dark:border-slate-900 dark:bg-forest">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          </div>

                          {/* Year */}
                          <div className="mb-2">
                            <span className="inline-block rounded-full bg-forest/10 px-4 py-1.5 text-sm font-semibold text-forest dark:text-forest-light">
                              {achievement.year}
                            </span>
                          </div>

                          {/* Achievement card */}
                          <div
                            className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 ${
                              achievement.href
                                ? "cursor-pointer hover:border-forest/40 dark:hover:border-forest/60"
                                : ""
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-forest/10 to-saffron/10">
                                {Icon}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-serif text-lg font-semibold text-slate-900 dark:text-white">
                                  {achievement.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                  {achievement.description}
                                </p>
                              </div>
                            </div>

                            {/* Link indicator */}
                            {achievement.href && (
                              <div className="mt-4 flex items-center justify-end">
                                <span className="text-sm font-medium text-forest transition-colors group-hover:text-emerald-700 dark:text-forest-light">
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

            {/* Stats or Additional Info */}
            <motion.div
              variants={fadeIn}
              className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="font-serif text-2xl font-bold text-forest dark:text-forest-light">
                  {achievements.length}+
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Works
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="font-serif text-2xl font-bold text-forest dark:text-forest-light">
                  {new Date().getFullYear() - 2010}+
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Years
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="font-serif text-2xl font-bold text-forest dark:text-forest-light">
                  10K+
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Readers
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="font-serif text-2xl font-bold text-forest dark:text-forest-light">
                  100+
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Essays
                </div>
              </div>
            </motion.div>

            {/* Philosophy quote */}
            <motion.div
              variants={fadeIn}
              className="mt-12 rounded-xl bg-gradient-to-r from-forest/5 to-saffron/5 p-6 dark:from-forest/10 dark:to-saffron/10"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl text-forest">"</div>
                <div>
                  <p className="font-serif text-lg italic text-slate-700 dark:text-slate-300">
                    The true measure of wisdom is not in what you know, but in what you do with it.
                  </p>
                  <div className="mt-2 h-px w-16 bg-saffron" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}