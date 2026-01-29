// pages/brands/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Variants } from "framer-motion";
import {
  Users,
  Shield,
  Target,
  ArrowRight,
  Star,
  Zap,
  Heart,
  TrendingUp,
  Globe,
  Award,
  BookOpen,
  Users2,
  Target as TargetIcon,
  Briefcase,
  CheckCircle,
} from "lucide-react";

import Layout from "@/components/Layout";
import { safeSlice } from "@/lib/utils/safe";

// ✅ Framer Motion is the common culprit in static export / SSR edge-cases.
// Make it client-only so /brands never crashes during prerender.
const MotionDiv = dynamic(async () => {
  const mod = await import("framer-motion");
  return mod.motion.div;
}, { ssr: false });

const MotionArticle = dynamic(async () => {
  const mod = await import("framer-motion");
  return mod.motion.article;
}, { ssr: false });

type BrandStatus = "active" | "building" | "legacy" | "incubating";

interface Brand {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  href: string;
  status: BrandStatus;
  foundingYear: number;
  focus: string[];
  icon: React.ReactNode;
  color: string;
  gradient: string;
  cta: string;
  members?: number;
  locations?: string[];
  keyAchievements?: string[];
  featured?: boolean;
}

type BrandCardProps = {
  brand: Brand;
  index: number;
  featured?: boolean;
  isBuilding?: boolean;
};

const BrandsIndexPage: NextPage = () => {
  const pageTitle = "Brands & Movements | Abraham of London";
  const pageDescription =
    "Strategic brands and movements under the Abraham of London umbrella. From fatherhood to brotherhood to legacy building, each movement carries a distinct mission.";

  const brands: Brand[] = [
    {
      id: "fathering-without-fear",
      title: "Fathering Without Fear",
      description:
        "A movement for men committed to intentional fatherhood, courageous love, and multi-generational legacy.",
      longDescription:
        "Fathering Without Fear provides frameworks, communities, and resources for fathers who refuse to outsource their responsibility. We focus on building courageous, intentional fatherhood that creates lasting legacies.",
      href: "/brands/fathering-without-fear",
      status: "active",
      foundingYear: 2020,
      focus: ["Fatherhood", "Legacy", "Family Leadership", "Courage"],
      icon: <Shield className="h-8 w-8" />,
      color: "text-blue-400",
      gradient: "from-blue-600/20 to-cyan-400/10",
      cta: "Join the Movement",
      members: 500,
      locations: ["Global", "UK Chapter", "Africa Chapters"],
      keyAchievements: ["4 Annual Retreats", "100+ Family Transformations", "Monthly Workshops"],
      featured: true,
    },
    {
      id: "brotherhood-covenant",
      title: "Brotherhood Covenant",
      description:
        "Structured circles of men committed to sharpening, accountability, and honour - not just casual friendship.",
      longDescription:
        "Brotherhood Covenant builds structured circles of men committed to spiritual growth, accountability, and genuine brotherhood. These are not casual friendships but intentional communities designed for transformation.",
      href: "/brands/brotherhood-covenant",
      status: "active",
      foundingYear: 2021,
      focus: ["Brotherhood", "Accountability", "Spiritual Growth", "Community"],
      icon: <Users className="h-8 w-8" />,
      color: "text-emerald-400",
      gradient: "from-emerald-600/20 to-green-400/10",
      cta: "Explore Brotherhood",
      members: 300,
      locations: ["London", "Manchester", "Online"],
      keyAchievements: ["12+ Covenant Groups", "Annual Retreat", "Monthly Gatherings"],
      featured: true,
    },
    {
      id: "legacy-builders",
      title: "Legacy Builders",
      description:
        "For founders and leaders building beyond their lifetime. Strategic frameworks for legacy planning and succession.",
      longDescription:
        "Legacy Builders provides strategic frameworks for founders and leaders focused on building beyond their lifetime. We focus on succession planning, organizational sustainability, and creating lasting impact.",
      href: "/brands/legacy-builders",
      status: "building",
      foundingYear: 2023,
      focus: ["Legacy Planning", "Succession", "Multi-generational Impact", "Stewardship"],
      icon: <Target className="h-8 w-8" />,
      color: "text-purple-400",
      gradient: "from-purple-600/20 to-pink-400/10",
      cta: "Build Legacy",
      members: 150,
      locations: ["Pilot Phase"],
      keyAchievements: ["Founding Cohort", "Framework Development", "Pilot Program"],
      featured: false,
    },
    {
      id: "kings-council",
      title: "Kings Council",
      description:
        "Executive leadership circles for Christian men in positions of significant influence and responsibility.",
      href: "/brands/kings-council",
      status: "incubating",
      foundingYear: 2024,
      focus: ["Executive Leadership", "Christian Business", "Kingdom Influence", "Strategic Prayer"],
      icon: <Award className="h-8 w-8" />,
      color: "text-amber-400",
      gradient: "from-amber-600/20 to-yellow-400/10",
      cta: "Learn More",
      featured: false,
    },
  ];

  const featuredBrands = brands.filter((b) => b.featured);
  const activeBrands = brands.filter((b) => b.status === "active" && !b.featured);
  const buildingBrands = brands.filter((b) => b.status === "building" || b.status === "incubating");

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.12,
      },
    },
  };

  const headingVariants: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: "easeOut", delay: i * 0.06 },
    }),
    hover: { y: -6, transition: { duration: 0.25 } },
  };

  const totalMembers = brands.reduce((sum, b) => sum + (b.members || 0), 0);
  const activeCount = brands.filter((b) => b.status === "active").length;
  const earliest = Math.min(...brands.map((b) => b.foundingYear));
  const yearsActive = new Date().getFullYear() - earliest;

  return (
    <Layout title={pageTitle} description={pageDescription} className="bg-black min-h-screen">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://abrahamoflondon.com/brands" />
        <meta property="og:image" content="/assets/images/brands-og.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://abrahamoflondon.com/brands" />
      </Head>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-gold/20 bg-gradient-to-b from-black via-charcoal to-black">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <MotionDiv
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={headingVariants}
          >
            <MotionDiv
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Globe className="h-4 w-4 text-gold" />
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-gold">
                Strategic Movements
              </span>
            </MotionDiv>

            <MotionDiv
              as="h1"
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-cream mb-6"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              Brands &amp; Movements
            </MotionDiv>

            <MotionDiv
              className="mx-auto max-w-2xl text-lg text-gold/70 leading-relaxed mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              Expressions of a single conviction: men who lead, love, and build with fear of God and
              respect for legacy. Each movement carries a distinct mission.
            </MotionDiv>

            {/* STATS */}
            <MotionDiv
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto mb-12"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <StatTile label="Total Movements" value={String(brands.length)} highlight={false} />
              <StatTile label="Active" value={String(activeCount)} highlight />
              <StatTile label="Members" value={String(totalMembers)} highlight={false} />
              <StatTile label="Years Active" value={String(yearsActive)} highlight={false} />
            </MotionDiv>

            <MotionDiv
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Link
                href="#featured"
                className="inline-flex items-center gap-3 rounded-xl bg-gold px-8 py-4 text-sm font-bold text-black hover:bg-gold/90 transition-colors"
              >
                <TrendingUp className="h-5 w-5" />
                Explore Movements
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-3 rounded-xl border border-gold/40 bg-white/5 px-8 py-4 text-sm font-bold text-gold hover:border-gold/60 hover:bg-white/10 transition-colors"
              >
                <Briefcase className="h-5 w-5" />
                Strategic Partnership
              </Link>
            </MotionDiv>
          </MotionDiv>
        </div>
      </section>

      {/* FEATURED */}
      {featuredBrands.length > 0 && (
        <SectionBlock
          id="featured"
          kickerIcon={<Award className="h-6 w-6 text-gold" />}
          kicker="Featured Movements"
          title="Flagship Brands"
          description="These movements have matured through years of refinement and community building. Each represents a pillar of the Abraham of London vision."
        >
          <MotionDiv
            className="grid gap-8 md:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {featuredBrands.map((brand, i) => (
              <BrandCard key={brand.id} brand={brand} index={i} featured />
            ))}
          </MotionDiv>
        </SectionBlock>
      )}

      {/* ACTIVE */}
      {activeBrands.length > 0 && (
        <SectionBlock
          kickerIcon={<CheckCircle className="h-6 w-6 text-gold" />}
          kicker="Active Movements"
          title="Growing Communities"
          description="These movements are actively building communities and creating impact in their respective focus areas."
        >
          <MotionDiv
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {activeBrands.map((brand, i) => (
              <BrandCard key={brand.id} brand={brand} index={i} />
            ))}
          </MotionDiv>
        </SectionBlock>
      )}

      {/* BUILDING */}
      {buildingBrands.length > 0 && (
        <SectionBlock
          kickerIcon={<Zap className="h-6 w-6 text-gold" />}
          kicker="In Development"
          title="Building Phase"
          description="These movements are currently being developed and refined. Early access and founding member opportunities may be available."
        >
          <MotionDiv
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {buildingBrands.map((brand, i) => (
              <BrandCard key={brand.id} brand={brand} index={i} isBuilding />
            ))}
          </MotionDiv>
        </SectionBlock>
      )}

      {/* VALUES */}
      <section className="py-16 border-b border-gold/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionDiv
            className="text-center mb-12"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-cream mb-4">Our Movement DNA</h2>
            <p className="text-gold/70 max-w-2xl mx-auto">
              Every brand under the Abraham of London umbrella shares these core principles that
              define our approach and distinguish our impact.
            </p>
          </MotionDiv>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Faith-Rooted",
                description:
                  "Built on biblical principles and spiritual foundation, not just business models or trends.",
                color: "text-blue-400",
              },
              {
                icon: <Users2 className="h-8 w-8" />,
                title: "Community-Focused",
                description:
                  "Designed to build genuine connection and accountability, not just audiences or customers.",
                color: "text-emerald-400",
              },
              {
                icon: <TargetIcon className="h-8 w-8" />,
                title: "Legacy-Minded",
                description:
                  "Focused on multi-generational impact and sustainable transformation, not quick wins.",
                color: "text-purple-400",
              },
            ].map((v, i) => (
              <MotionDiv
                key={v.title}
                className="text-center p-8 rounded-2xl border border-white/10 bg-white/5"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: "easeOut" }}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 mb-6 ${v.color}`}>
                  {v.icon}
                </div>
                <h3 className="font-serif text-xl font-semibold text-cream mb-3">{v.title}</h3>
                <p className="text-gold/70 text-sm leading-relaxed">{v.description}</p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <MotionDiv
            className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/5 to-transparent p-12 text-center"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
              <Heart className="h-7 w-7 text-gold" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-cream mb-4">Start Your Own Movement</h2>
            <p className="text-gold/70 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
              Have a vision for a movement that aligns with our values of faith, fatherhood, and
              legacy? Let&apos;s explore how we can build together.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 rounded-xl bg-gold px-8 py-4 text-sm font-bold text-black hover:bg-gold/90 transition-colors"
              >
                <Briefcase className="h-5 w-5" />
                Discuss Partnership
              </Link>

              <Link
                href="/ventures"
                className="inline-flex items-center gap-3 rounded-xl border border-gold/40 bg-white/5 px-8 py-4 text-sm font-bold text-gold hover:border-gold/60 hover:bg-white/10 transition-colors"
              >
                <BookOpen className="h-5 w-5" />
                Explore Ventures
              </Link>
            </div>
          </MotionDiv>
        </div>
      </section>
    </Layout>
  );
};

function SectionBlock({
  id,
  kickerIcon,
  kicker,
  title,
  description,
  children,
}: {
  id?: string;
  kickerIcon: React.ReactNode;
  kicker: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="py-16 border-b border-gold/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MotionDiv
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 mb-6">
            {kickerIcon}
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-gold">{kicker}</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-cream mb-4">{title}</h2>
          <p className="text-gold/70 max-w-2xl mx-auto">{description}</p>
        </MotionDiv>

        {children}
      </div>
    </section>
  );
}

function StatTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  if (highlight) {
    return (
      <div className="rounded-xl border border-gold/30 bg-gold/10 p-4 backdrop-blur-sm">
        <div className="text-2xl font-bold text-gold mb-1">{value}</div>
        <div className="text-xs font-medium text-gold/80 uppercase tracking-wider">{label}</div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function BrandCard({ brand, index, featured = false }: BrandCardProps) {
  const statusColors: Record<BrandStatus, { bg: string; text: string; border: string }> = {
    active: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    building: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
    incubating: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
    legacy: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  };

  const statusStyle = statusColors[brand.status];
  const focusTop = safeSlice(brand.focus ?? [], 0, 3);

  return (
    <MotionArticle
      className="group block h-full"
      custom={index}
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: (i: number) => ({
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: "easeOut", delay: i * 0.06 },
        }),
        hover: { y: -6, transition: { duration: 0.25 } },
      }}
      initial="hidden"
      whileInView="visible"
      whileHover="hover"
      viewport={{ once: true }}
    >
      <Link href={brand.href} className="block h-full">
        <div
          className={[
            "h-full rounded-2xl border bg-gradient-to-br from-white/5 to-white/0 p-8 transition-all duration-300",
            featured ? "border-gold/30" : "border-white/10",
            "group-hover:border-gold/40 group-hover:bg-white/10",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-3 bg-gradient-to-br ${brand.gradient} ${brand.color}`}>
                {brand.icon}
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                {brand.status === "active" && "Active"}
                {brand.status === "building" && "Building"}
                {brand.status === "incubating" && "Incubating"}
                {brand.status === "legacy" && "Legacy"}
              </span>
            </div>

            {featured ? (
              <div className="flex items-center gap-1 rounded-full bg-gold/20 px-2 py-1">
                <Star className="h-3 w-3 text-gold" />
                <span className="text-xs font-bold text-gold">Featured</span>
              </div>
            ) : null}
          </div>

          {/* Copy */}
          <h3 className="font-serif text-xl md:text-2xl font-semibold text-cream mb-3 group-hover:text-gold transition-colors">
            {brand.title}
          </h3>
          <p className="text-gold/70 text-sm leading-relaxed mb-4">{brand.description}</p>

          {/* Stats */}
          {(brand.members || brand.locations?.length) ? (
            <div className="mb-6 grid grid-cols-2 gap-4">
              {brand.members ? (
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{brand.members}+</div>
                  <div className="text-xs text-gray-400">Members</div>
                </div>
              ) : (
                <div />
              )}
              {brand.locations?.length ? (
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{brand.locations.length}</div>
                  <div className="text-xs text-gray-400">Locations</div>
                </div>
              ) : (
                <div />
              )}
            </div>
          ) : null}

          {/* Focus */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold/60 mb-2">Focus Areas</p>
            <div className="flex flex-wrap gap-2">
              {focusTop.map((area) => (
                <span key={area} className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                  {area}
                </span>
              ))}
              {(brand.focus?.length || 0) > focusTop.length ? (
                <span className="text-xs text-gray-500">+{(brand.focus?.length || 0) - focusTop.length} more</span>
              ) : null}
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gold group-hover:underline">{brand.cta}</span>
              <ArrowRight className="h-4 w-4 text-gold transition-transform group-hover:translate-x-1" />
            </div>
            <span className="text-xs text-gray-500">Since {brand.foundingYear}</span>
          </div>
        </div>
      </Link>
    </MotionArticle>
  );
}

export default BrandsIndexPage;