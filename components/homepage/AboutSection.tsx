// components/homepage/AboutSection.tsx
"use client";

import React from 'react'; // FIX: Explicit React import for useMemo and general Client Component clarity
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import clsx from "clsx";

// --- Types ---

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

// --- Animation Variants ---

const container = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { when: "beforeChildren", staggerChildren: 0.1 }
    },
} as const;

const item = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
} as const;

// --- Component ---

export default function AboutSection({
    id = "about",
    bio,
    // Safely default achievements to an empty array for robust rendering
    achievements = [],
    portraitSrc = "/assets/images/portrait.jpg",
    portraitAlt = "Portrait of the author, Abraham of London",
    priority = false,
    className,
}: AboutSectionProps) {

    // Sort achievements once and cache them
    const sortedAchievements = React.useMemo(() => {
        return achievements
            .slice()
            .sort((a, b) => b.year - a.year);
    }, [achievements]);

    return (
        <section
            id={id}
            className={clsx("container mx-auto max-w-6xl px-4 py-10 md:py-16", className)}
            role="region"
            aria-labelledby="about-heading"
        >
            <motion.div
                variants={container}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="grid grid-cols-1 gap-12 md:grid-cols-[280px,1fr] items-start"
            >
                {/* Portrait / Sidebar */}
                <motion.aside
                    variants={item}
                    className="mx-auto md:mx-0 w-[240px] md:w-full md:max-w-[280px]"
                    aria-label="Author profile and contact links"
                >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-black/10 bg-warmWhite shadow-2xl">
                        <Image
                            src={portraitSrc}
                            alt={portraitAlt}
                            fill
                            sizes="(max-width: 768px) 240px, 280px"
                            priority={priority}
                            className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                        />
                    </div>

                    {/* Quick action */}
                    <div className="mt-5">
                        <Link
                            href="/contact"
                            prefetch={false}
                            className="aol-btn w-full justify-center text-lg"
                            aria-label="Contact the author to get in touch"
                        >
                            Get In Touch
                        </Link>
                    </div>
                </motion.aside>

                {/* Main content */}
                <motion.div
                    variants={item}
                    className="prose md:prose-lg max-w-none text-[color:var(--color-on-secondary)/0.9] dark:prose-invert"
                >
                    {/* Main Heading */}
                    <h1
                        id="about-heading"
                        className="font-serif text-3xl md:text-5xl font-bold !mb-4 !mt-0 text-forest"
                    >
                        About
                    </h1>

                    {/* Biography */}
                    <p className="!mt-0 text-lg leading-relaxed">{bio}</p>

                    {/* Achievements */}
                    {sortedAchievements.length > 0 && (
                        <div className="not-prose mt-10">
                            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-deepCharcoal dark:text-cream">
                                Key Highlights & Achievements
                            </h2>

                            <ul className="mt-5 space-y-4">
                                {sortedAchievements.map((a, i) => {
                                    const body = (
                                        <div className="flex items-start gap-4 rounded-xl border border-lightGrey bg-warmWhite p-4 shadow-sm hover:shadow-md transition">

                                            {/* Year badge */}
                                            <div className="mt-0.5 shrink-0 rounded-full bg-[color:var(--color-primary)/0.1] px-3 py-1 text-sm font-semibold text-forest dark:bg-[color:var(--color-primary)/0.2]">
                                                {a.year}
                                            </div>

                                            {/* Title and Description */}
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-deepCharcoal text-lg dark:text-cream leading-snug">
                                                    {a.title}
                                                </h3>
                                                <p className="text-sm mt-0.5 text-[color:var(--color-on-secondary)/0.8] dark:text-white/70">{a.description}</p>
                                            </div>
                                        </div>
                                    );

                                    return (
                                        <motion.li
                                            key={`${a.title}-${a.year}-${i}`}
                                            variants={item}
                                            aria-label={`${a.title} in ${a.year}`}
                                        >
                                            {a.href ? (
                                                <Link
                                                    href={a.href}
                                                    prefetch={false}
                                                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-opacity-60 rounded-xl"
                                                    aria-label={`${a.title}: ${a.description}. Learn more.`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {body}
                                                </Link>
                                            ) : (
                                                body
                                            )}
                                        </motion.li>
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