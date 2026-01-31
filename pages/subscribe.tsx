/* pages/subscribe.tsx — THE FOUNDING READERS CIRCLE (INTEGRITY MODE) */
import type { NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  BookOpen, 
  Users, 
  Award, 
  ChevronRight, 
  Lock 
} from "lucide-react";

import Layout from "@/components/Layout";
import NewsletterForm from "@/components/NewsletterForm";

const SubscribePage: NextPage = () => {
  const pageTitle = "Founding Readers Circle | Abraham of London";
  const pageDescription =
    "Early access to The Architecture of Human Purpose Canon for fathers, founders, and institutional architects shaping the future of civilization.";

  // Mock counter for social proof / urgency
  const [spotsRemaining] = React.useState(842);

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Head>

      <main className="min-h-screen bg-black text-cream selection:bg-gold/30">
        {/* BACKGROUND TEXTURE */}
        <div className="fixed inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 pointer-events-none" />

        <section className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 py-20 lg:py-32">
          
          {/* HEADER SECTION */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 text-center"
          >
            <div className="inline-flex items-center gap-3 rounded-full border border-gold/30 bg-gold/5 px-5 py-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
                The Architecture of Human Purpose · Canon
              </span>
            </div>

            <h1 className="mx-auto max-w-4xl font-serif text-4xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Join the Founding <br />
              <span className="italic text-gold/90">Readers Circle</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
              For the builders and institutional architects ready to 
              reconstruct the frameworks of human purpose and civilizational design.
            </p>
          </motion.div>

          {/* TWO COLUMN CONTENT */}
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
            
            {/* LEFT: THE PROPOSITION */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-12"
            >
              <div className="space-y-8">
                <h2 className="font-serif text-3xl font-medium text-white">The Founding Charter</h2>
                
                <div className="grid gap-8">
                  {[
                    {
                      icon: BookOpen,
                      title: "Exclusive Early Access",
                      desc: "Receive chapter previews and frameworks months before public release, including implementation notes for leaders."
                    },
                    {
                      icon: Users,
                      title: "The Architecture Masterclasses",
                      desc: "Closed-door sessions diving deep into the tools of organizational and personal transformation."
                    },
                    {
                      icon: Award,
                      title: "Permanent Founding Status",
                      desc: "Recognition in the official Canon registry and lifetime priority access to all future London initiatives."
                    }
                  ].map((benefit, idx) => (
                    <div key={idx} className="flex gap-6 group">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold group-hover:bg-gold group-hover:text-black transition-all duration-300">
                        <benefit.icon size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-cream mb-1">{benefit.title}</h3>
                        <p className="text-sm leading-relaxed text-gray-500">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* URGENCY & SOCIAL PROOF */}
              <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-8 backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Availability</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold">{spotsRemaining} / 1000 Spots Left</span>
                </div>
                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: `${(spotsRemaining / 1000) * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gold"
                  />
                </div>
                <blockquote className="mt-8 border-l border-gold/30 pl-6 py-2">
                  <p className="text-sm italic leading-relaxed text-gray-400">
                    "Essential reading for anyone building institutions meant to last generations."
                  </p>
                  <footer className="mt-3 text-[10px] font-bold uppercase tracking-widest text-gold">
                    — Institutional Architect, Early Reader
                  </footer>
                </blockquote>
              </div>
            </motion.div>

            {/* RIGHT: THE INTAKE FORM */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:sticky lg:top-32"
            >
              <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-zinc-900 to-black p-8 lg:p-12 shadow-2xl">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Lock size={120} />
                </div>

                <div className="relative">
                  <h2 className="mb-4 font-serif text-3xl font-bold text-white">Secure Access</h2>
                  <p className="mb-10 text-sm leading-relaxed text-gray-400">
                    Enter your details to join the distribution list and receive 
                    the <span className="text-gold italic">Prelude MiniBook</span> immediately.
                  </p>

                  <div className="mb-10 rounded-xl border border-white/5 bg-white/[0.02] p-6">
                    <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gold">Immediate Dispatch:</h3>
                    <ul className="space-y-3">
                      {['Prelude (PDF) Digital Edition', 'Founding Reader Welcome Package', 'Invitations to 2026 Salons'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                          <ShieldCheck size={14} className="text-gold/50" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <NewsletterForm
                    variant="premium"
                    buttonText="Join the Foundational Circle"
                  />

                  <div className="mt-8 space-y-4 text-center">
                    <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      <span>Private</span>
                      <span className="h-1 w-1 bg-zinc-700 rounded-full" />
                      <span>Encrypted</span>
                      <span className="h-1 w-1 bg-zinc-700 rounded-full" />
                      <span>Revocable</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-gray-600">
                      By enrolling, you agree to our <Link href="/privacy" className="text-gold/60 underline underline-offset-4 hover:text-gold transition-colors">Privacy Charter</Link>. 
                      We treat your attention as an institutional trust.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* FOOTER CALLOUT */}
          <div className="border-t border-white/5 pt-16 text-center">
            <p className="mx-auto max-w-3xl text-sm leading-relaxed text-gray-500 italic">
              "The Founding Readers Circle is limited to ensure meaningful engagement and strategic focus. 
              This is the beginning of a movement to rebuild the architecture of human purpose."
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default SubscribePage;