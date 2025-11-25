import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { motion } from "framer-motion";
import { Moon, SunMedium, Target, Users, Shield, BookOpen, ArrowRight, Star, Award } from "lucide-react";
import Layout from "@/components/Layout";
import { siteConfig } from "@/lib/siteConfig";

// Reuse your existing variants
const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

interface Achievement {
  title: string;
  description: string;
  year: number;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const AboutPage: NextPage = () => {
  const [isDark, setIsDark] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  // Theme management
  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("aof-theme");
      if (stored === "light" || stored === "dark") {
        setIsDark(stored === "dark");
        return;
      }
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("aof-theme", next ? "dark" : "light");
      } catch {
        // ignore localStorage errors
      }
      return next;
    });
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <Layout title="About">
        <div className="min-h-screen bg-gray-100" />
      </Layout>
    );
  }

  // Theme classes
  const shellClass = isDark 
    ? "min-h-screen bg-gradient-to-br from-deepCharcoal via-gray-900 to-black text-cream"
    : "min-h-screen bg-gradient-to-br from-warmWhite via-cream to-white text-ink";

  const cardClass = isDark
    ? "border-white/10 bg-white/5 backdrop-blur-sm hover:border-softGold/30 transition-all duration-300"
    : "border-lightGrey bg-white shadow-lg hover:shadow-xl transition-all duration-300";

  const primaryTextClass = isDark ? "text-cream" : "text-deepCharcoal";
  const secondaryTextClass = isDark ? "text-gray-300" : "text-slate-700";
  const accentTextClass = isDark ? "text-softGold" : "text-forest";

  const buttonClass = isDark
    ? "bg-softGold text-deepCharcoal hover:bg-softGold/90 shadow-lg hover:shadow-softGold/25"
    : "bg-forest text-cream hover:bg-forest/90 shadow-lg hover:shadow-forest/25";

  const secondaryButtonClass = isDark
    ? "border-white/20 bg-transparent text-cream hover:bg-white/10"
    : "border-lightGrey bg-white text-ink hover:bg-warmWhite";

  const achievements: Achievement[] = [
    {
      title: "Founded Fathering Without Fear Movement",
      description: "Launched a global initiative helping thousands of men embrace intentional fatherhood and legacy building",
      year: 2023,
      href: "/brands/fathering-without-fear",
      icon: Users
    },
    {
      title: "Published Entrepreneur Operating System",
      description: "Developed comprehensive strategic frameworks used by 500+ founders and business leaders",
      year: 2023,
      href: "/downloads/entrepreneur-operating-pack",
      icon: Target
    },
    {
      title: "Established Brotherhood Covenant Network",
      description: "Built accountability structures fostering authentic brotherhood among Christian men and leaders",
      year: 2022,
      href: "/downloads/brotherhood-covenant",
      icon: Shield
    },
    {
      title: "Created Family Altar Liturgy",
      description: "Developed practical tools for integrating faith into daily family rhythms, used by hundreds of households",
      year: 2022,
      href: "/downloads/family-altar-liturgy",
      icon: BookOpen
    },
    {
      title: "Launched Strategic Leadership Playbook",
      description: "Authored comprehensive leadership frameworks for executives and organizational leaders",
      year: 2021,
      href: "/downloads/leadership-playbook",
      icon: Award
    }
  ];

  return (
    <Layout title="About">
      <Head>
        <title>About | Abraham of London — Strategic Stewardship & Legacy Building</title>
        <meta 
          name="description" 
          content="Learn about Abraham of London's mission to equip men with faith-rooted strategy, fatherhood tools, and legacy-building frameworks." 
        />
        <meta property="og:title" content="About Abraham of London — Strategic Stewardship & Legacy Building" />
        <meta 
          property="og:description" 
          content="Equipping serious men and builders with faith-rooted strategy, fatherhood tools, and legacy frameworks for generational impact." 
        />
        <meta property="og:url" content="https://www.abrahamoflondon.org/about" />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content={isDark ? "#0f172a" : "#f7f5ee"} />
        <link rel="canonical" href="https://www.abrahamoflondon.org/about" />
      </Head>

      <div className={shellClass}>
        {/* Header with theme toggle */}
        <div className="max-w-6xl mx-auto px-4 pt-12">
          <div className="flex items-start justify-between gap-4 mb-12">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${accentTextClass}`}>
                Strategic Stewardship
              </p>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition-all ${
                isDark
                  ? "border-white/15 bg-white/5 text-cream hover:bg-white/10"
                  : "border-lightGrey bg-white text-ink hover:bg-warmWhite"
              }`}
              aria-label="Toggle light/dark mode"
            >
              {isDark ? (
                <>
                  <SunMedium className="h-4 w-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <section className={`py-20 ${isDark ? "bg-gradient-to-b from-black to-deepCharcoal" : "bg-gradient-to-b from-warmWhite to-cream"}`}>
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <motion.h1 
                variants={itemVariants}
                className={`font-serif text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 ${primaryTextClass}`}
              >
                Building Fathers, 
                <span className={`block mt-4 ${accentTextClass}`}>Founders & Faithful Leaders</span>
              </motion.h1>
              <motion.p 
                variants={itemVariants}
                className={`text-xl max-w-3xl mx-auto leading-relaxed ${secondaryTextClass}`}
              >
                Equipping serious men with faith-rooted strategy, tools, and frameworks for 
                intentional fatherhood, disciplined leadership, and lasting legacy.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Bio & Portrait Section */}
        <section className={`py-16 ${isDark ? "bg-deepCharcoal" : "bg-white"}`}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <h2 className={`font-serif text-3xl md:text-4xl font-semibold mb-6 ${primaryTextClass}`}>
                  Our Purpose
                </h2>
                <div className={`space-y-4 text-lg leading-relaxed ${secondaryTextClass}`}>
                  <p>
                    Abraham of London exists to equip serious men and builders with faith-rooted 
                    strategy, tools, and frameworks for intentional fatherhood, disciplined leadership, 
                    and lasting legacy.
                  </p>
                  <p>
                    In a world that often encourages drift and compromise, we provide language, 
                    structure, and practical resources to help you build with clarity, courage, 
                    and conviction.
                  </p>
                  <p>
                    Every strategy, tool, and framework is built on conservative Christian conviction. 
                    We believe true leadership starts with submission to divine wisdom.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/ventures"
                    className={`rounded-full px-6 py-3 font-semibold transition-all ${buttonClass}`}
                  >
                    Explore Ventures
                  </Link>
                  <Link
                    href="/contact"
                    className={`rounded-full border px-6 py-3 font-semibold transition-all ${secondaryButtonClass}`}
                  >
                    Start Conversation
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative"
              >
                <div className={`relative rounded-2xl overflow-hidden shadow-2xl ${isDark ? "ring-1 ring-white/10" : "ring-1 ring-lightGrey"}`}>
                  <Image
                    src="/assets/images/abraham-portrait.jpg"
                    alt="Abraham of London - Founder and Strategic Leader"
                    width={600}
                    height={800}
                    className="w-full h-auto"
                    priority
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? "from-black/40 to-transparent" : "from-white/20 to-transparent"}`} />
                </div>
                <div className={`absolute -bottom-6 -left-6 px-6 py-3 rounded-lg shadow-lg ${isDark ? "bg-softGold text-deepCharcoal" : "bg-forest text-cream"}`}>
                  <p className="font-semibold">Abraham of London</p>
                  <p className="text-sm opacity-90">Founder & Strategic Leader</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Key Achievements */}
        <section className={`py-16 ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className={`font-serif text-3xl md:text-4xl font-semibold mb-4 ${primaryTextClass}`}>
                Strategic Milestones
              </h2>
              <p className={`text-xl max-w-2xl mx-auto ${secondaryTextClass}`}>
                Building tools and communities that empower men to lead with conviction and build lasting legacy
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement, index) => {
                const IconComponent = achievement.icon;
                return (
                  <motion.div
                    key={achievement.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`rounded-2xl p-6 ${cardClass}`}
                  >
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}>
                      <IconComponent className={isDark ? "h-6 w-6 text-softGold" : "h-6 w-6 text-forest"} />
                    </div>
                    <div className={`text-sm font-semibold mb-2 ${accentTextClass}`}>
                      {achievement.year}
                    </div>
                    <h3 className={`font-serif text-xl font-semibold mb-3 ${primaryTextClass}`}>
                      {achievement.title}
                    </h3>
                    <p className={`text-sm leading-relaxed mb-4 ${secondaryTextClass}`}>
                      {achievement.description}
                    </p>
                    <Link
                      href={achievement.href}
                      className={`inline-flex items-center text-sm font-semibold hover:underline ${accentTextClass}`}
                    >
                      Learn more <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mission & Values */}
        <section className={`py-16 ${isDark ? "bg-deepCharcoal" : "bg-white"}`}>
          <div className="max-w-4xl mx-auto px-4">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`font-serif text-3xl md:text-4xl font-semibold text-center mb-12 ${primaryTextClass}`}
            >
              Our Guiding Principles
            </motion.h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {siteConfig.brand.values.slice(0, 3).map((value, index) => (
                  <motion.div 
                    key={value}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-2xl p-6 ${cardClass}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`rounded-lg p-2 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}>
                        <Star className={isDark ? "h-4 w-4 text-softGold" : "h-4 w-4 text-forest"} />
                      </div>
                      <h3 className={`text-xl font-semibold ${primaryTextClass}`}>{value}</h3>
                    </div>
                    <p className={secondaryTextClass}>
                      {value === "Faith-rooted leadership" && 
                        "Every strategy and framework is built on conservative Christian conviction, believing true leadership starts with submission to divine wisdom."}
                      {value === "Strategic discipline" && 
                        "We maintain rigorous focus on long-term objectives, avoiding distractions and staying committed to the core mission through disciplined execution."}
                      {value === "Generational thinking" && 
                        "Our work extends beyond immediate results to create lasting impact that benefits multiple generations and builds enduring legacy."}
                    </p>
                  </motion.div>
                ))}
              </div>
              
              <div className="space-y-6">
                {siteConfig.brand.values.slice(3).map((value, index) => (
                  <motion.div 
                    key={value}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-2xl p-6 ${cardClass}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`rounded-lg p-2 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}>
                        <Star className={isDark ? "h-4 w-4 text-softGold" : "h-4 w-4 text-forest"} />
                      </div>
                      <h3 className={`text-xl font-semibold ${primaryTextClass}`}>{value}</h3>
                    </div>
                    <p className={secondaryTextClass}>
                      {value === "Community focus" && 
                        "We build ecosystems and brotherhoods that support growth, accountability, and shared success rather than individual achievement alone."}
                      {value === "Excellence in execution" && 
                        "Every resource is battle-tested and designed for immediate practical application, delivering tangible results in business, family, and leadership."}
                      {value === "Sustainable impact" && 
                        "We prioritize long-term value creation and responsible growth that benefits communities and preserves resources for future generations."}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-16 text-center ${isDark ? "bg-gradient-to-r from-forest to-softGold" : "bg-gradient-to-r from-forest to-forest/90"}`}>
          <div className="max-w-2xl mx-auto px-4">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-serif font-semibold mb-6 text-white"
            >
              Ready to Build With Purpose?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-white/90 mb-8"
            >
              Join hundreds of men already using these tools to lead with conviction and build lasting legacy.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link
                href="/downloads"
                className="inline-flex items-center px-8 py-4 bg-white text-deepCharcoal font-semibold rounded-lg hover:bg-slate-100 transition-colors shadow-lg transform hover:-translate-y-0.5"
              >
                Explore Resources
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-deepCharcoal transition-colors transform hover:-translate-y-0.5"
              >
                Start a Conversation
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AboutPage;