// components/homepage/AboutSection.tsx - FIXED
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen, Award, Calendar, Mail, Users, FileText, Clock } from "lucide-react";
import { safeSlice } from "@/lib/utils/safe";


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
  _className?: string; // Changed from className to _className to fix unused warning
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

// Stats icons
const statsIcons = [
  <BookOpen key="works" className="h-6 w-6" />,
  <Clock key="years" className="h-6 w-6" />,
  <Users key="readers" className="h-6 w-6" />,
  <FileText key="essays" className="h-6 w-6" />,
];

// --- Component ---

export default function AboutSection({
  id = "about",
  bio,
  achievements = [],
  portraitSrc = "/assets/images/profile-portrait.webp",
  portraitAlt = "Portrait of Abraham of London",
  priority = false,
  _className, // Changed from className to _className
}: AboutSectionProps) {
  const containerRef = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  const sortedAchievements = React.useMemo(() => {
    return safeSlice(achievements, ).sort((a, b) => b.year - a.year);
  }, [achievements]);

  // Stats data
  const stats = [
    { value: `${achievements.length}+`, label: "Published Works", color: "from-blue-600 to-cyan-500" },
    { value: `${new Date().getFullYear() - 2010}+`, label: "Years Writing", color: "from-emerald-600 to-teal-500" },
    { value: "10K+", label: "Readers Reached", color: "from-violet-600 to-purple-500" },
    { value: "100+", label: "Essays Written", color: "from-amber-600 to-orange-500" },
  ];

  return (
    <section
      ref={containerRef}
      id={id}
      className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900"
    >
      {/* Subtle background patterns */}
      <div className="absolute inset-0">
        <motion.div
          style={{ y: parallaxY }}
          className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-blue-100 blur-3xl dark:bg-blue-900/20"
        />
        <div className="absolute -left-32 bottom-1/4 h-80 w-80 rounded-full bg-amber-100 blur-3xl dark:bg-amber-900/20" />
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
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-emerald-500/10 to-transparent dark:from-blue-500/20 dark:via-emerald-500/20" />
              
              <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
                </div>
              </div>

              {/* Name plate */}
              <div className="mt-6 rounded-xl bg-gradient-to-r from-gray-50 to-white p-4 shadow-sm dark:from-gray-900 dark:to-gray-800">
                <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-white">
                  Abraham of London
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
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
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-black px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-gray-900/30 dark:from-blue-900 dark:to-blue-950"
              >
                <span className="relative z-10">Connect With Me</span>
                <Mail className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/20 via-transparent to-transparent transition-transform duration-700 group-hover:translate-x-full" />
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
                <div className="h-px w-12 bg-gradient-to-r from-blue-500 to-emerald-500" />
                <span className="font-sans text-sm font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                  About Me
                </span>
              </motion.div>
              
              <motion.h1
                variants={item}
                className="font-serif text-4xl font-bold leading-tight text-gray-900 dark:text-white md:text-5xl lg:text-6xl"
              >
                Crafting Wisdom Through{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    Words & Works
                  </span>
                  <div className="absolute -bottom-2 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-emerald-500" />
                </span>
              </motion.h1>
            </div>

            {/* Biography */}
            <motion.div
              variants={fadeIn}
              className="mb-12"
            >
              <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 md:text-xl">
                {bio}
              </p>
            </motion.div>

            {/* Achievements Timeline */}
            {sortedAchievements.length > 0 && (
              <motion.div variants={item} className="mt-6">
                <div className="mb-8">
                  <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                    Milestones &{" "}
                    <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                      Achievements
                    </span>
                  </h2>
                  <div className="mt-2 h-px w-24 bg-gradient-to-r from-blue-500 to-transparent" />
                </div>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-blue-500/60 via-emerald-500/40 to-transparent" />

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
                          <div className="absolute -left-[25px] top-0 z-10 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-gradient-to-r from-blue-500 to-emerald-500 shadow-lg dark:border-gray-900">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          </div>

                          {/* Year */}
                          <div className="mb-2">
                            <span className="inline-block rounded-full bg-gradient-to-r from-blue-500/10 to-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                              {achievement.year}
                            </span>
                          </div>

                          {/* Achievement card */}
                          <div
                            className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 ${
                              achievement.href
                                ? "cursor-pointer hover:border-blue-400 dark:hover:border-blue-600"
                                : ""
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-emerald-500/10">
                                {Icon}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-serif text-lg font-semibold text-gray-900 dark:text-white">
                                  {achievement.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                  {achievement.description}
                                </p>
                              </div>
                            </div>

                            {/* Link indicator */}
                            {achievement.href && (
                              <div className="mt-4 flex items-center justify-end">
                                <span className="text-sm font-medium text-blue-600 transition-colors group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
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

            {/* Stats or Additional Info - FIXED FOR LEGIBILITY */}
            <motion.div
              variants={fadeIn}
              className="mt-12"
            >
              <h3 className="mb-6 font-serif text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                By the Numbers
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-800 dark:from-gray-900 dark:to-gray-950"
                  >
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
                    
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-sm dark:from-gray-800 dark:to-gray-900">
                        {statsIcons[index]}
                      </div>
                      <div className="font-serif text-3xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                      <div className="mt-1 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Philosophy quote */}
            <motion.div
              variants={fadeIn}
              className="mt-12 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:to-gray-950"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl text-blue-500">&quot;</div>
                <div>
                  <p className="font-serif text-lg italic text-gray-800 dark:text-gray-300">
                    The true measure of wisdom is not in what you know, but in what you do with that knowledge to shape a better world.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-px w-8 bg-gradient-to-r from-blue-500 to-emerald-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Abraham of London</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

