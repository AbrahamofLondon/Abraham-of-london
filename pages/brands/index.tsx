// pages/brands/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Shield,
  Target,
  ArrowRight,
  Star,
  Zap,
  Heart,
} from "lucide-react";
import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";

interface Brand {
  id: string;
  title: string;
  description: string;
  href: string;
  status: "active" | "building" | "legacy";
  foundingYear: number;
  focus: string[];
  icon: React.ReactNode;
  color: string;
  cta: string;
}

export default function BrandsIndex() {
  const pageTitle = "Brands & Movements";

  const brands: Brand[] = [
    {
      id: "fathering-without-fear",
      title: "Fathering Without Fear",
      description:
        "A movement for men committed to intentional fatherhood, courageous love, and multi-generational legacy. We provide frameworks, communities, and resources for fathers who refuse to outsource their responsibility.",
      href: "/brands/fathering-without-fear",
      status: "active",
      foundingYear: 2020,
      focus: ["Fatherhood", "Legacy", "Family Leadership"],
      icon: <Shield className="h-8 w-8" />,
      color: "from-blue-600/20 to-cyan-400/10",
      cta: "Join the Movement",
    },
    {
      id: "brotherhood-covenant",
      title: "Brotherhood Covenant",
      description:
        "Structured circles of men committed to sharpening, accountability, and honour – not just casual friendship. We build brotherhoods that last through seasons of challenge and celebration.",
      href: "/brands/brotherhood-covenant",
      status: "active",
      foundingYear: 2021,
      focus: ["Brotherhood", "Accountability", "Spiritual Growth"],
      icon: <Users className="h-8 w-8" />,
      color: "from-emerald-600/20 to-green-400/10",
      cta: "Explore Brotherhood",
    },
    {
      id: "legacy-builders",
      title: "Legacy Builders",
      description:
        "For founders and leaders building beyond their lifetime. We provide strategic frameworks for legacy planning, succession, and creating organizations that outlive their founders.",
      href: "/brands/legacy-builders",
      status: "building",
      foundingYear: 2023,
      focus: ["Legacy Planning", "Succession", "Multi-generational Impact"],
      icon: <Target className="h-8 w-8" />,
      color: "from-purple-600/20 to-pink-400/10",
      cta: "Build Legacy",
    },
  ];

  const activeBrands = brands.filter((brand) => brand.status === "active");
  const buildingBrands = brands.filter((brand) => brand.status === "building");

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{getPageTitle(pageTitle)}</title>
        <meta
          name="description"
          content="Strategic brands and movements under the Abraham of London umbrella. From fatherhood to brotherhood to legacy building, each movement carries a distinct mission."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-charcoal to-black">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-gold/20">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-amber-200/5" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.p
                className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Strategic Movements
              </motion.p>
              <motion.h1
                className="font-serif text-4xl font-bold text-cream sm:text-5xl lg:text-6xl mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Brands & Movements
              </motion.h1>
              <motion.p
                className="mx-auto max-w-2xl text-lg text-gold/70 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Expressions of a single conviction: men who lead, love, and
                build with fear of God and respect for legacy. Each movement
                carries a distinct mission.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Active Brands */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="mb-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-2 text-sm font-semibold text-gold mb-4">
                <Star className="h-4 w-4" />
                Established Movements
              </div>
              <h2 className="font-serif text-3xl font-bold text-cream mb-4">
                Active Brands
              </h2>
              <p className="text-gold/70 max-w-2xl mx-auto">
                These movements have matured through years of refinement and
                community building. Each represents a pillar of the Abraham of
                London vision.
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2">
              {activeBrands.map((brand, index) => (
                <BrandCard key={brand.id} brand={brand} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Building Brands */}
        {buildingBrands.length > 0 && (
          <section className="py-16 border-t border-gold/20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <motion.div
                className="mb-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-2 text-sm font-semibold text-gold mb-4">
                  <Zap className="h-4 w-4" />
                  In Development
                </div>
                <h2 className="font-serif text-3xl font-bold text-cream mb-4">
                  Building Phase
                </h2>
                <p className="text-gold/70 max-w-2xl mx-auto">
                  These movements are currently being developed and refined.
                  Early access and founding member opportunities may be
                  available.
                </p>
              </motion.div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {buildingBrands.map((brand, index) => (
                  <BrandCard
                    key={brand.id}
                    brand={brand}
                    index={index}
                    isBuilding={true}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 border-t border-gold/20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-gold/10 p-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif text-3xl font-bold text-cream mb-4">
                Start Your Own Movement
              </h2>
              <p className="text-gold/70 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                Have a vision for a movement that aligns with our values of
                faith, fatherhood, and legacy? Let's explore how we can build
                together.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 rounded-xl bg-gold px-8 py-4 font-semibold text-charcoal transition-all hover:bg-amber-200"
                >
                  <Heart className="h-5 w-5" />
                  Discuss Partnership
                </Link>
                <Link
                  href="/ventures"
                  className="inline-flex items-center gap-3 rounded-xl border border-gold px-8 py-4 font-semibold text-gold transition-all hover:bg-gold/10"
                >
                  <ArrowRight className="h-5 w-5" />
                  Explore Ventures
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 border-t border-gold/20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif text-3xl font-bold text-cream mb-4">
                Our Movement DNA
              </h2>
              <p className="text-gold/70 max-w-2xl mx-auto">
                Every brand under the Abraham of London umbrella shares these
                core principles that define our approach and distinguish our
                impact.
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: <Shield className="h-8 w-8" />,
                  title: "Faith-Rooted",
                  description:
                    "Built on biblical principles and spiritual foundation, not just business models or trends.",
                },
                {
                  icon: <Users className="h-8 w-8" />,
                  title: "Community-Focused",
                  description:
                    "Designed to build genuine connection and accountability, not just audiences or customers.",
                },
                {
                  icon: <Target className="h-8 w-8" />,
                  title: "Legacy-Minded",
                  description:
                    "Focused on multi-generational impact and sustainable transformation, not quick wins.",
                },
              ].map((value, index) => (
                <motion.div
                  key={value.title}
                  className="text-center p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/10 text-gold mb-4">
                    {value.icon}
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-cream mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gold/70 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

// Brand Card Component
function BrandCard({
  brand,
  index,
  isBuilding = false,
}: {
  brand: Brand;
  index: number;
  isBuilding?: boolean;
}) {
  return (
    <motion.article
      className="group overflow-hidden rounded-2xl border border-gold/20 bg-charcoal/60 backdrop-blur-sm transition-all hover:border-gold/40 hover:bg-charcoal/70"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      <Link href={brand.href} className="block h-full">
        <div className={`h-2 bg-gradient-to-r ${brand.color}`} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-xl p-3 bg-gradient-to-br ${brand.color} text-gold`}
              >
                {brand.icon}
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-cream group-hover:text-gold transition-colors">
                  {brand.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-gold/70">
                    Since {brand.foundingYear}
                  </span>
                  {isBuilding && (
                    <span className="rounded-full bg-gold/20 px-2 py-1 text-xs font-semibold text-gold">
                      Building
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gold/70 text-sm leading-relaxed mb-4 line-clamp-3">
            {brand.description}
          </p>

          {/* Focus Areas */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold/60 mb-2">
              Focus Areas
            </p>
            <div className="flex flex-wrap gap-2">
              {brand.focus.map((area) => (
                <span
                  key={area}
                  className="rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-gold/20">
            <span className="text-sm font-semibold text-gold group-hover:underline flex items-center gap-2">
              {brand.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="text-xs text-gold/50">
              {isBuilding ? "Early Access" : "Join Now"}
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
