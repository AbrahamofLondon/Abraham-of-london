/* pages/consulting/strategy-room.tsx */
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";

// Import only client-safe components
const Layout = dynamic(() => import("@/components/Layout"));
const { getRecaptchaTokenSafe } = await import("@/lib/recaptchaClient");
import { hasInnerCircleAccess } from "@/lib/inner-circle/access"; // Now safe!

// Lazy load motion to avoid SSR issues
const MotionSection = dynamic(() => 
  import("framer-motion").then(mod => ({ default: mod.motion.section }))
);
const MotionDiv = dynamic(() => 
  import("framer-motion").then(mod => ({ default: mod.motion.div }))
);

// Lazy load icons
const IconLoader = ({ name }: { name: string }) => {
  const IconComponent = React.useMemo(() => dynamic(() => 
    import("lucide-react").then(mod => mod[name as keyof typeof mod] || mod.BookOpen)
  ), [name]);
  
  return <IconComponent />;
};

// Client-only components
const StrategyRoomForm = dynamic(() => import("@/components/strategy-room/Form"), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Loading form...</div>
});

const ArtifactGrid = dynamic(() => import("@/components/strategy-room/ArtifactGrid"), {
  ssr: false,
  loading: () => <div className="p-4">Loading artifacts...</div>
});

// Main page component
const StrategyRoomPage: NextPage = () => {
  const [mounted, setMounted] = React.useState(false);
  const [icAccess, setIcAccess] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Safe client-side check only
    setIcAccess(hasInnerCircleAccess());
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black">
        <Head>
          <title>Strategy Room | Abraham of London</title>
          <meta name="description" content="Board-grade decision environment" />
        </Head>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gold">Loading Strategy Room...</div>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Strategy Room">
      <Head>
        <title>Strategy Room | Abraham of London</title>
        <meta name="description" content="Board-grade decision environment powered by the Canon, Strategic Frameworks, and the Ultimate Purpose of Man. For leaders who carry weight." />
      </Head>

      <main className="min-h-screen bg-black text-cream">
        {/* HERO SECTION - Static, safe for SSR */}
        <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
          
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
                Board-Grade Decision Environment
              </p>
              
              <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Strategy Room
              </h1>
              
              <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
                A structured environment for leaders facing irreversible decisions.
              </p>
              
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  onClick={() => setShowForm(true)}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
                >
                  Begin Intake Process
                  <IconLoader name="ArrowRight" />
                </button>
                
                <Link
                  href="/resources/strategic-frameworks"
                  className="inline-flex items-center justify-center rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/15"
                >
                  View Strategic Frameworks
                  <IconLoader name="BookOpen" />
                </Link>
              </div>
              
              {icAccess && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-900/20 px-4 py-2 text-sm text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Inner Circle Member — Full Artifact Access
                </div>
              )}
            </div>
          </div>
        </section>

        {/* DYNAMIC CONTENT - Client-only */}
        {showForm && (
          <section className="py-10">
            <div className="mx-auto max-w-4xl px-4">
              <StrategyRoomForm />
            </div>
          </section>
        )}

        {/* ARTIFACTS - Client-only */}
        <section className="py-10">
          <div className="mx-auto max-w-6xl px-4">
            <ArtifactGrid hasAccess={icAccess} />
          </div>
        </section>

        {/* ACCESS & NEXT STEPS */}
        <section className="bg-zinc-950 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-10">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-white">
                    Access the Materials
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-gray-400">
                    The Strategy Room environment draws from the complete Canon.
                  </p>
                  
                  <div className="mt-8 space-y-4">
                    <Link
                      href="/inner-circle"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                    >
                      Unlock Inner Circle Access
                      <IconLoader name="Lock" />
                    </Link>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-white">
                    What Happens Next
                  </h3>
                  <div className="mt-6 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-white">Intake Review</p>
                        <p className="mt-1 text-sm text-gray-400">
                          48-hour review of your submission.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

// Export page config for static generation
export async function getStaticProps() {
  // Return empty props - page is client-side interactive
  return {
    props: {},
    // Revalidate every hour for content updates
    revalidate: 3600,
  };
}

export default StrategyRoomPage;