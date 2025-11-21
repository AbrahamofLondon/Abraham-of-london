// pages/chatham-rooms/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Users, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
import { getPageTitle } from "@/lib/siteConfig";

export default function ChathamRoomsPage(): JSX.Element {
  return (
    <Layout title="The Chatham Rooms">
      <Head>
        <title>{getPageTitle("The Chatham Rooms")}</title>
        <meta
          name="description"
          content="The Chatham Rooms – private, off-record conversations for honest leaders and heavy fathers under Chatham House Rule."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-charcoal to-black pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/6 via-transparent to-amber-200/6" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <motion.header
              className="mb-12 max-w-3xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.p
                className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                The Chatham Rooms
              </motion.p>

              <motion.h1
                className="mt-4 font-serif text-4xl font-semibold text-cream sm:text-5xl lg:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Private, off-record rooms for
                <span className="block bg-gradient-to-r from-gold to-amber-200 bg-clip-text text-transparent">
                  honest leaders and heavy fathers.
                </span>
              </motion.h1>

              <motion.p
                className="mt-6 text-lg leading-relaxed text-gold/70 sm:text-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                The Chatham Rooms are small, curated conversations held under
                Chatham House Rule — where founders, executives, and fathers can
                speak plainly about power, family, faith, and consequence
                without performance or optics.
              </motion.p>

              <motion.div
                className="mt-8 flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/events"
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gold to-amber-200 px-8 py-4 text-lg font-semibold text-charcoal shadow-2xl transition-all hover:shadow-3xl"
                >
                  <span className="relative z-10">See upcoming rooms</span>
                  <motion.div
                    className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.8 }}
                  />
                </Link>

                <Link
                  href="/contact"
                  className="rounded-xl border border-gold/40 px-8 py-4 text-lg font-semibold text-gold transition-all hover:border-gold hover:bg-gold/10"
                >
                  Enquire about invitation
                </Link>
              </motion.div>
            </motion.header>
          </div>
        </section>

        {/* Mandate Statement - Added here for consistency */}
        <MandateStatement />

        {/* What It Is */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="grid gap-12 lg:grid-cols-[3fr,2fr]"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div>
                <motion.h2
                  className="mb-6 font-serif text-3xl font-semibold text-cream"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  What actually happens in the room?
                </motion.h2>

                <motion.p
                  className="mb-8 text-lg leading-relaxed text-gold/70"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  These are not networking events. They are working
                  conversations with men and women who carry real weight:
                  decisions that affect families, employees, congregations, or
                  citizens.
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
                      className="flex items-center gap-4 text-gold/70"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-gold" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>

              <motion.aside
                className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/5 to-gold/10 p-8"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="mb-4 font-serif text-xl font-semibold text-cream">
                  Who is it for?
                </h3>
                <p className="mb-6 leading-relaxed text-gold/80">
                  The Rooms are designed for leaders who cannot afford fantasy:
                </p>
                <ul className="mb-6 space-y-3">
                  {[
                    "Founders and owners, not just employees.",
                    "Fathers navigating complex, real-world family realities.",
                    "Elders, trustees, and community leaders with real consequence.",
                  ].map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-gold/80"
                    >
                      <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-gold/80">
                  Admission is by invitation or referral. The goal is not
                  prestige for its own sake, but protection of the
                  conversation — so the right people can finally talk
                  honestly.
                </p>
              </motion.aside>
            </motion.div>
          </div>
        </section>

        {/* Format & Principles */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <motion.h2
                className="mb-6 font-serif text-3xl font-semibold text-cream"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Format, principles, and expectations
              </motion.h2>

              <div className="mt-8 grid gap-8 lg:grid-cols-3">
                {[
                  {
                    icon: Shield,
                    title: "Under the rule",
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
                    className="group rounded-2xl border border-gold/20 bg-charcoal/60 p-8 backdrop-blur transition-all hover:border-gold/40 hover:bg-charcoal/70"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                  >
                    <principle.icon className="mb-4 h-12 w-12 text-gold" />
                    <h3 className="mb-4 text-lg font-semibold uppercase tracking-[0.18em] text-gold/80">
                      {principle.title}
                    </h3>
                    <p className="leading-relaxed text-gold/70">
                      {principle.description}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="mt-12 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/5 to-gold/10 p-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <p className="mb-6 text-lg text-gold/80">
                  If you would like to propose a Room in your city, or host a
                  closed session for your board, eldership, or leadership team,
                  send a short context note with stakes, desired outcomes, and
                  who should be in the room.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-gold/60 px-6 py-3 font-semibold text-gold transition-all hover:bg-gold hover:text-charcoal"
                >
                  Propose a room
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
    </Layout>
  );
}