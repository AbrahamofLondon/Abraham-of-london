/* pages/chatham-rooms/index.tsx — THE CHATHAM ROOMS (INTEGRITY MODE) */
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

export default function ChathamRoomsPage(): JSX.Element {
  return (
    <Layout
      title="The Chatham Rooms"
      transparentHeader
      className="bg-deepCharcoal text-white"
    >
      {/* HERO SECTION: THE SANCTUARY */}
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
              <span className="block bg-gradient-to-r from-softGold to-amber-200 bg-clip-text text-transparent italic">
                honest leaders and heavy fathers.
              </span>
            </motion.h1>

            <motion.p
              className="mt-4 text-base leading-relaxed text-softGold/85 sm:text-lg md:mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Small, curated conversations held under Chatham House Rule—where founders and decision-makers speak plainly about power, faith, and consequence without optics.
            </motion.p>

            <motion.div
              className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4 md:mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link
                href="/events"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-softGold to-amber-200 px-6 py-3 text-base font-semibold text-charcoal shadow-2xl transition-all sm:px-8 sm:py-4 sm:text-lg"
              >
                <span className="relative z-10">See upcoming rooms</span>
              </Link>

              <Link
                href="/contact?source=chatham-rooms&intent=invitation"
                className="rounded-xl border border-softGold/60 px-6 py-3 text-base font-semibold text-softGold transition-all hover:bg-softGold/10 sm:px-8 sm:py-4 sm:text-lg"
              >
                Enquire about invitation
              </Link>
            </motion.div>
          </motion.header>
        </div>
      </section>

      {/* MANDATE: INSTITUTIONAL ALIGNMENT */}
      <section className="border-t border-softGold/20 bg-deepCharcoal">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
          <MandateStatement />
        </div>
      </section>

      {/* CORE CONTENT: THE WORKING CONVERSATION */}
      <section className="bg-deepCharcoal py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:gap-12 lg:grid-cols-[3fr,2fr]">
            <div>
              <h2 className="mb-6 font-serif text-2xl font-semibold text-white md:text-3xl">
                What actually happens in the room?
              </h2>

              <p className="mb-6 text-base leading-relaxed text-softGold/90 md:mb-8 md:text-lg">
                These are not networking events. They are working conversations with those who carry real weight: decisions affecting families, employees, or citizens.
              </p>

              <ul className="space-y-4">
                {[
                  "6-12 people, carefully curated for alignment.",
                  "2-3 hour facilitated dialogue around a specific theme.",
                  "Zero social posting; strictly confidential.",
                  "Integration of Scripture, history, and hard strategy.",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-4 text-softGold/90">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-softGold" />
                    <span className="text-sm md:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <motion.aside
              className="rounded-2xl border border-softGold/40 bg-gradient-to-br from-softGold/10 to-softGold/15 p-6 text-white md:p-8"
              whileHover={{ scale: 1.01 }}
            >
              <h3 className="mb-4 font-serif text-lg font-semibold md:text-xl">
                Who is it for?
              </h3>
              <ul className="mb-6 space-y-3 text-sm text-white/90 md:text-base">
                {[
                  "Owners who cannot afford fantasy.",
                  "Fathers navigating multi-generational complexity.",
                  "Trustees and leaders with real consequence.",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-softGold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-white/70 italic">
                Admission is by referral or verified mandate-fit. We protect the conversation so the right people can talk honestly.
              </p>
            </motion.aside>
          </div>
        </div>
      </section>

      {/* PRINCIPLES: THE PILLARS OF HONESTY */}
      <section className="bg-deepCharcoal py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 font-serif text-2xl font-semibold text-white md:text-3xl text-center">
            Institutional Principles
          </h2>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Under the Rule",
                description: "Wisdom exits the room; identities stay behind. One place where honesty is not a risk to reputation."
              },
              {
                icon: BookOpen,
                title: "Truth & Strategy",
                description: "We draw from Scripture and market reality. Not theory, but wisdom you can act on on Monday morning."
              },
              {
                icon: Users,
                title: "No Spectators",
                description: "Everyone contributes. Everyone is accountable. We come to solve questions of legacy, not collect quotes."
              }
            ].map((principle, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-softGold/30 bg-charcoal/80 p-6 text-white transition-all hover:border-softGold/50 md:p-8"
              >
                <principle.icon className="mb-4 h-10 w-10 text-softGold" />
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-softGold/90">
                  {principle.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/80">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CALL: PROPOSE A ROOM */}
      <section className="border-t border-softGold/20 bg-deepCharcoal py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 font-serif text-3xl font-semibold text-white">
            Propose a Room
          </h2>
          <p className="mb-8 text-softGold/90 md:text-lg">
            Host a closed session for your board, eldership, or leadership team. 
            Share a context note with stakes and desired outcomes.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/contact?source=chatham-rooms&intent=propose-room"
              className="rounded-xl bg-gradient-to-r from-softGold to-amber-200 px-8 py-4 text-base font-semibold text-charcoal shadow-lg transition-all"
            >
              Propose Room
            </Link>
            <Link
              href="/events"
              className="rounded-xl border border-softGold/60 px-8 py-4 text-base font-semibold text-softGold transition-all hover:bg-softGold/10"
            >
              View Upcoming
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}