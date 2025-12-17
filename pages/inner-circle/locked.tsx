import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";

export default function LockedPage() {
  const router = useRouter();

  // Determine where to send them back after they join/login
  const returnTo =
    typeof router.query.returnTo === "string"
      ? router.query.returnTo
      : "/canon";

  const joinHref = `/inner-circle?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <Layout title="Access Restricted">
      <main className="flex min-h-[70vh] items-center justify-center px-6 py-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-xl text-center"
        >
          <div className="mb-8 flex justify-center">
            <div className="rounded-full border border-gold/20 bg-gold/5 p-4">
              {/* Lock Icon */}
              <svg className="h-8 w-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <h1 className="mb-4 font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Restricted Canon Volume
          </h1>

          <p className="mb-10 text-gray-400 text-base sm:text-lg leading-relaxed">
            This specific document is reserved for members of the <span className="text-gold font-medium">Inner Circle</span>. 
            Access is currently managed via private invitation and founder-tier subscriptions.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link
              href={joinHref}
              className="w-full sm:w-auto rounded-xl bg-gold px-10 py-4 font-bold text-black transition-all hover:bg-gold/90 hover:shadow-lg hover:shadow-gold/20"
            >
              Join the Inner Circle
            </Link>
            
            <Link 
              href="/canon"
              className="text-sm font-medium text-gray-500 hover:text-cream transition-colors"
            >
              Return to Public Library
            </Link>
          </div>
        </motion.div>
      </main>
    </Layout>
  );
}