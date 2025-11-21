// pages/chatham-rooms/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Users, BookOpen, ArrowRight, CheckCircle } from "lucide-react";

export default function ChathamRoomsPage() {
  return (
    <>
      <Head>
        <title>The Chatham Rooms - Abraham of London</title>
        <meta name="description" content="Private, off-record rooms for honest leaders and heavy fathers" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-charcoal to-black pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-amber-200/5" />
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
                The Chatham Rooms are small, curated conversations held
                under Chatham House Rule — where founders, executives, and
                fathers can talk plainly about power, family, faith, and
                consequence without performative optics.
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
                  className="font-serif text-3xl font-semibold text-cream mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  What actually happens in the room?
                </motion.h2>
                <motion.p 
                  className="text-lg text-gold/70 mb-8 leading-relaxed"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  These are not networking events. They are working
                  conversations with men and women who carry real weight:
                  decisions that affect families, employees, congregations,
                  or citizens.
                </motion.p>
                <motion.ul 
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  {[
                    "6–12 people, carefully curated",
                    "2–3 hour facilitated dialogue",
                    "Clear theme; no performance, no recording",
                    "Scripture, history, and strategy in one room"
                  ].map((item, index) => (
                    <motion.li 
                      key={item}
                      className="flex items-center gap-4 text-gold/70"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <CheckCircle className="h-5 w-5 text-gold flex-shrink-0" />
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
                <h3 className="font-serif text-xl font-semibold text-cream mb-4">
                  Who is it for?
                </h3>
                <p className="text-gold/80 mb-6 leading-relaxed">
                  The Rooms are designed for:
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Founders and owners, not just employees",
                    "Fathers navigating complex family realities",
                    "Elders, trustees, and community leaders"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-gold/80">
                      <ArrowRight className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-gold/80">
                  Admission is by invitation or referral. The goal is not
                  exclusivity for its own sake, but protection of the
                  conversation.
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
                className="font-serif text-3xl font-semibold text-cream mb-6"
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
                    description: "What is said in the room can be used outside, but identities and affiliations are never attributed. Leaders need one place where honesty is not a risk to reputation."
                  },
                  {
                    icon: BookOpen,
                    title: "Scripture & strategy",
                    description: "We draw from Scripture, history, psychology, and hard market reality. The point is not theory but wisdom you can act on on Monday morning."
                  },
                  {
                    icon: Users,
                    title: "No spectators",
                    description: "Everyone contributes. Everyone is accountable. You come to work on real questions — fatherhood, calling, power, money, and legacy — not to collect quotes."
                  }
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
                    <principle.icon className="h-12 w-12 text-gold mb-4" />
                    <h3 className="text-lg font-semibold uppercase tracking-[0.18em] text-gold/80 mb-4">
                      {principle.title}
                    </h3>
                    <p className="text-gold/70 leading-relaxed">
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
                <p className="text-lg text-gold/80 mb-6">
                  If you would like to propose a Room in your city, or host
                  a closed session for your board, eldership, or leadership
                  team, reach out with context and desired outcomes.
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
    </>
  );
}