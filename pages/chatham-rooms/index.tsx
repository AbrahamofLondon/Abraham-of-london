// pages/chatham-rooms/index.tsx

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Users, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

export default function ChathamRoomsPage(): JSX.Element {
  return (
    <Layout
      title="The Chatham Rooms"
      transparentHeader
      className="bg-deepCharcoal text-white"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-softGold/10 via-transparent to-amber-200/10" />

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <motion.header
            className="mb-8 max-w-3xl md:mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.p
              className="text-xs font-semibold uppercase tracking-[0.25em] text-softGold/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              The Chatham Rooms
            </motion.p>

            <motion.h1
              className="mt-4 font-serif text-3xl font-semibold text-white sm:text-4xl lg:text-5xl xl:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Private, off-record rooms for
              <span className="block bg-gradient-to-r from-softGold to-amber-200 bg-clip-text text-transparent">
                honest leaders and heavy fathers.
              </span>
            </motion.h1>

            <motion.p
              className="mt-4 text-base leading-relaxed text-softGold/85 sm:text-lg md:mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              The Chatham Rooms are small, curated conversations held under
              Chatham House Rule — where founders, executives, and fathers can
              speak plainly about power, family, faith, and consequence without
              performance or optics.
            </motion.p>

            <motion.div
              className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4 md:mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link
                href="/events"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-softGold to-amber-200 px-6 py-3 text-base font-semibold text-charcoal shadow-2xl transition-all hover:shadow-3xl sm:px-8 sm:py-4 sm:text-lg"
              >
                <span className="relative z-10">See upcoming rooms</span>
                <motion.div
                  className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.8 }}
                />
              </Link>

              <Link
                href="/contact"
                className="rounded-xl border border-softGold/60 px-6 py-3 text-base font-semibold text-softGold transition-all hover:border-softGold hover:bg-softGold/10 sm:px-8 sm:py-4 sm:text-lg"
              >
                Enquire about invitation
              </Link>
            </motion.div>
          </motion.header>
        </div>
      </section>

      {/* Mandate Statement */}
      <section className="border-t border-softGold/20 bg-deepCharcoal">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
          <MandateStatement />
        </div>
      </section>

      {/* What It Is */}
      <section className="bg-deepCharcoal py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid gap-8 md:gap-12 lg:grid-cols-[3fr,2fr]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div>
              <motion.h2
                className="mb-6 font-serif text-2xl font-semibold text-white md:text-3xl"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                What actually happens in the room?
              </motion.h2>

              <motion.p
                className="mb-6 text-base leading-relaxed text-softGold/90 md:mb-8 md:text-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                These are not networking events. They are working conversations
                with men and women who carry real weight: decisions that affect
                families, employees, congregations, or citizens.
              </motion.p>

              <motion.ul
                className="space-y-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                {[
                  "6–12 people, carefully curated.",
                  "2–3 hour facilitated dialogue around a real theme.",
                  "No performance, no recording, no social posting.",
                  "Scripture, history, and strategy in one room.",
                ].map((item, index) => (
                  <motion.li
                    key={item}
                    className="flex items-center gap-4 text-softGold/90"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-softGold" />
                    <span className="text-sm md:text-base">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            <motion.aside
              className="rounded-2xl border border-softGold/40 bg-gradient-to-br from-softGold/10 to-softGold/15 p-6 text-white md:p-8"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="mb-4 font-serif text-lg font-semibold md:text-xl">
                Who is it for?
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-white/90 md:mb-6 md:text-base">
                The Rooms are designed for leaders who cannot afford fantasy:
              </p>
              <ul className="mb-4 space-y-2 text-sm text-white/90 md:mb-6 md:space-y-3 md:text-base">
                {[
                  "Founders and owners, not just employees.",
                  "Fathers navigating complex, real-world family realities.",
                  "Elders, trustees, and community leaders with real consequence.",
                ].map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3"
                  >
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-softGold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-white/90 md:text-base">
                Admission is by invitation or referral. The goal is not prestige
                for its own sake, but protection of the conversation — so the
                right people can finally talk honestly.
              </p>
            </motion.aside>
          </motion.div>
        </div>
      </section>

      {/* Format & Principles */}
      <section className="bg-deepCharcoal py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.h2
              className="mb-6 font-serif text-2xl font-semibold text-white md:text-3xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Format, principles, and expectations
            </motion.h2>

            <div className="mt-8 grid gap-6 md:gap-8 lg:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: "Under the Rule",
                  description:
                    "What is said in the room can be used outside, but identities and affiliations are never attributed. Leaders need one place where honesty is not a risk to reputation.",
                },
                {
                  icon: BookOpen,
                  title: "Scripture & strategy",
                  description:
                    "We draw from Scripture, history, psychology, and hard market reality. The point is not theory but wisdom you can act on on Monday morning.",
                },
                {
                  icon: Users,
                  title: "No spectators",
                  description:
                    "Everyone contributes. Everyone is accountable. You come to work on real questions — fatherhood, calling, power, money, and legacy — not to collect quotes.",
                },
              ].map((principle, index) => (
                <motion.div
                  key={principle.title}
                  className="group rounded-2xl border border-softGold/30 bg-charcoal/80 p-6 text-white backdrop-blur transition-all hover:border-softGold/50 hover:bg-charcoal/90 md:p-8"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <principle.icon className="mb-4 h-10 w-10 text-softGold md:h-12 md:w-12" />
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-softGold/90 md:text-lg">
                    {principle.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/90 md:text-base">
                    {principle.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mt-8 rounded-2xl border border-softGold/40 bg-gradient-to-br from-softGold/10 to-softGold/15 p-6 text-white md:mt-12 md:p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <p className="mb-4 text-base text-white/90 md:mb-6 md:text-lg">
                If you would like to propose a Room in your city, or host a
                closed session for your board, eldership, or leadership team,
                send a short context note with stakes, desired outcomes, and who
                should be in the room.
              </p>
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-softGold/70 px-4 py-2 text-sm font-semibold text-softGold transition-all hover:bg-softGold hover:text-charcoal md:px-6 md:py-3 md:text-base sm:w-auto"
              >
                Propose a room
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}