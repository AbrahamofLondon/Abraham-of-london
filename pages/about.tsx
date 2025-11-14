// pages/about.tsx
import type { NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import AboutSection from "@/components/homepage/AboutSection";
import type { Achievement } from "@/components/homepage/AboutSection";

const AboutPage: NextPage = () => {
  const bio = `Abraham of London exists to equip serious men and builders with faith-rooted strategy, tools, and frameworks for intentional fatherhood, disciplined leadership, and lasting legacy. In a world that often encourages drift and compromise, we provide language, structure, and practical resources to help you build with clarity, courage, and conviction.`;

  const achievements: Achievement[] = [
    {
      title: "Founded Fathering Without Fear Movement",
      description: "Launched a global initiative helping thousands of men embrace intentional fatherhood and legacy building",
      year: 2023,
      href: "/brands/fathering-without-fear"
    },
    {
      title: "Published Entrepreneur Operating System",
      description: "Developed comprehensive strategic frameworks used by 500+ founders and business leaders",
      year: 2023,
      href: "/downloads/entrepreneur-operating-pack"
    },
    {
      title: "Established Brotherhood Covenant Network",
      description: "Built accountability structures fostering authentic brotherhood among Christian men and leaders",
      year: 2022,
      href: "/brands/brotherhood-covenant"
    },
    {
      title: "Created Family Altar Liturgy",
      description: "Developed practical tools for integrating faith into daily family rhythms, used by hundreds of households",
      year: 2022,
      href: "/downloads/family-altar-liturgy"
    },
    {
      title: "Launched Strategic Leadership Playbook",
      description: "Authored comprehensive leadership frameworks for executives and organizational leaders",
      year: 2021,
      href: "/downloads/leadership-playbook"
    }
  ];

  return (
    <Layout title="About">
      <Head>
        <title>About | Abraham of London</title>
        <meta 
          name="description" 
          content="Learn about Abraham of London's mission to equip men with faith-rooted strategy, fatherhood tools, and legacy-building frameworks." 
        />
        <meta property="og:title" content="About Abraham of London" />
        <meta 
          property="og:description" 
          content="Equipping serious men and builders with faith-rooted strategy, fatherhood tools, and legacy frameworks." 
        />
        <meta property="og:url" content="https://www.abrahamoflondon.org/about" />
        <meta property="og:type" content="website" />
      </Head>

      {/* Main About Section */}
      <AboutSection
        bio={bio}
        achievements={achievements}
        portraitSrc="/assets/images/abraham-portrait.jpg"
        portraitAlt="Abraham of London - Founder and Strategic Leader"
        priority={true}
      />

      {/* Mission & Values Section */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center mb-12 text-deepCharcoal dark:text-cream">
            Our Mission & Values
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-3 text-forest">Faith-Rooted Foundation</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  Every strategy, tool, and framework is built on conservative Christian conviction. 
                  We believe true leadership starts with submission to divine wisdom.
                </p>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-3 text-forest">Practical Utility</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  No theoretical fluff. Every resource is battle-tested and designed for immediate 
                  application in business, family, and community leadership.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-3 text-softGold">Legacy Focus</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  We equip men to build beyond their lifetime—focusing on multi-generational impact 
                  rather than temporary success.
                </p>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-3 text-softGold">Brotherhood Commitment</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  We believe no man should build alone. Our work fosters authentic community and 
                  accountability among like-minded builders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-forest to-softGold py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-6 text-white">
            Ready to Build With Purpose?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join hundreds of men already using these tools to lead with conviction and build lasting legacy.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/downloads"
              className="inline-flex items-center px-8 py-4 bg-white text-deepCharcoal font-semibold rounded-lg hover:bg-slate-100 transition-colors shadow-lg"
            >
              Explore Resources
            </a>
            <a
              href="/contact"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-deepCharcoal transition-colors"
            >
              Start a Conversation
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;