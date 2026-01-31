/* pages/newsletter.tsx — THE STRATEGIC BRIEF (INTEGRITY MODE) */
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Mail, 
  ShieldCheck, 
  Users, 
  Zap, 
  Lock, 
  BookOpen,
  Calendar
} from "lucide-react";

import Layout from "@/components/Layout";
import NewsletterForm from "@/components/NewsletterForm";

export default function NewsletterPage(): JSX.Element {
  const pageTitle = "The Inner Circle";

  return (
    <Layout
      title={pageTitle}
      description="Join the Inner Circle - a curated brief for founders, boards, and leaders building with depth. High-signal strategic insights and early access to mandates."
      className="bg-black text-cream"
    >
      <div className="min-h-screen bg-black">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold mb-6">Strategic Intelligence</p>
                <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                  The Inner Circle
                </h1>
                <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
                  Curated wisdom for those navigating high-stakes complexity. 
                  Sent only when there is structural clarity to be shared.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT GRID */}
        <section className="py-20 lg:py-32 bg-black">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-start gap-16 lg:grid-cols-2">
              
              {/* LEFT: THE PROMISE */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="font-serif text-3xl font-semibold text-white mb-8">Signal Over Noise</h2>
                <div className="space-y-10">
                  {[
                    {
                      icon: Calendar,
                      title: "Priority Access",
                      desc: "Early insight into private salons, board retreats, and limited advisory mandates before they are broadly announced."
                    },
                    {
                      icon: BookOpen,
                      title: "Strategic Volumes",
                      desc: "Excerpts from the private Canon and frameworks for institutional governance and market architecture."
                    },
                    {
                      icon: ShieldCheck,
                      title: "Decision Hygiene",
                      desc: "Practical notes on maintaining operating cadence, governance integrity, and leadership culture."
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold">
                        <item.icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-cream mb-2">{item.title}</h3>
                        <p className="text-sm leading-relaxed text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 rounded-2xl border border-white/5 bg-zinc-900/30 p-8">
                  <h4 className="font-serif text-lg font-semibold text-gold mb-4 text-center italic">Institutional Standard</h4>
                  <ul className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <li className="flex items-center gap-2"><div className="h-1 w-1 bg-gold rounded-full" /> No routine spam</li>
                    <li className="flex items-center gap-2"><div className="h-1 w-1 bg-gold rounded-full" /> High Signal Only</li>
                    <li className="flex items-center gap-2"><div className="h-1 w-1 bg-gold rounded-full" /> Encrypted Data</li>
                    <li className="flex items-center gap-2"><div className="h-1 w-1 bg-gold rounded-full" /> Easy Revocation</li>
                  </ul>
                </div>
              </motion.div>

              {/* RIGHT: THE INTAKE */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:sticky lg:top-32"
              >
                <div className="rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-12 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Lock size={120} className="text-gold" />
                  </div>
                  
                  <div className="relative">
                    <h3 className="font-serif text-2xl font-bold text-white mb-4">Request Subscription</h3>
                    <p className="text-gray-400 mb-10 text-sm">
                      Enter your institutional or personal email to join the distribution list for The Inner Circle.
                    </p>

                    <NewsletterForm 
                      variant="premium" 
                      placeholder="advisory@firm.com"
                      buttonText="Join the Circle"
                    />

                    <div className="mt-8 pt-8 border-t border-gold/10">
                      <div className="space-y-4">
                        <blockquote className="border-l border-gold/40 pl-4 py-1">
                          <p className="text-sm italic text-gray-400">
                            "The only brief I read twice. It provides structural clarity where others provide commentary."
                          </p>
                          <cite className="mt-2 block text-[10px] font-bold uppercase tracking-widest text-gold">— Managing Director, PE</cite>
                        </blockquote>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="border-t border-white/5 bg-zinc-950 py-20 lg:py-32">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="font-serif text-3xl font-bold text-white mb-4">Terms of Engagement</h2>
              <p className="text-gray-500">Frequently asked questions regarding the distribution.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  q: "How often are notes sent?",
                  a: "Typically 1-2 times per month. We value your attention; frequency is dictated by relevance, not a schedule."
                },
                {
                  q: "Is this for everyone?",
                  a: "The content is curated for founders, board members, and leaders. It assumes a base level of operational responsibility."
                },
                {
                  q: "Is my data shared?",
                  a: "Never. Your email is used strictly for The Inner Circle distribution and handled under GDPR compliance."
                },
                {
                  q: "How do I unsubscribe?",
                  a: "Every brief contains a secure one-click revocation link. Your data is purged immediately upon request."
                }
              ].map((faq, i) => (
                <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <h4 className="font-bold text-cream mb-2 text-sm uppercase tracking-wider">{faq.q}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <p className="text-xs text-gray-600">
                For deeper concerns, view our <Link href="/privacy-policy" className="text-gold/60 hover:text-gold transition-colors">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}