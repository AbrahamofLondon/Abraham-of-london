/* Abraham of London - Strategic Framework Detail V6.0
 * Enhanced Security & True Gating
 */
import * as React from "react";
import { useEffect, useState } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Lock,
  Shield,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Eye,
  EyeOff,
  Download,
  Key
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  getFrameworkBySlug,
  getAllFrameworkSlugs,
  type Framework,
  type FrameworkTier,
  getFrameworkContent // New function for protected content
} from "@/lib/resources/strategic-frameworks";
import { getInnerCircleAccess, type AccessState } from "@/lib/inner-circle/access";
import { withInnerCircleAuth } from "@/lib/auth/withInnerCircleAuth"; // Your existing HOC

type PageProps = {
  framework: Framework;
  isPreview?: boolean;
  initialAccess?: AccessState;
  protectedContent?: {
    operatingLogic?: any[];
    applicationPlaybook?: any[];
    boardQuestions?: string[];
    metrics?: any[];
  } | null;
};

// Your existing tierIcon, accentColor, accentBg remain the same...

const FrameworkDetailPage: NextPage<PageProps> = ({ 
  framework, 
  isPreview = false,
  initialAccess,
  protectedContent
}) => {
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>(initialAccess || {
    hasAccess: false,
    ok: false,
    reason: "missing",
    token: null,
    checkedAt: new Date(), 
  });

  const [isLoadingContent, setIsLoadingContent] = useState(!protectedContent && access.hasAccess);

  useEffect(() => {
    // Refresh access state on mount
    const currentAccess = getInnerCircleAccess();
    setAccess(currentAccess);

    // If we have access but no protected content, fetch it
    if (currentAccess.hasAccess && !protectedContent && typeof window !== 'undefined') {
      fetchProtectedContent();
    }
  }, []);

  const fetchProtectedContent = async () => {
    setIsLoadingContent(true);
    try {
      const response = await fetch(`/api/frameworks/${framework.slug}/protected`, {
        headers: {
          'Authorization': `Bearer ${access.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Store in component state or context
      }
    } catch (error) {
      console.error('Failed to fetch protected content:', error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const canViewFull = access.hasAccess || isPreview;
  const userRole = access.user?.role || 'guest';

  const scrollToLocked = (id: string) => {
    if (canViewFull) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push({
        pathname: "/inner-circle/locked",
        query: {
          returnTo: router.asPath,
          reason: 'protected-framework',
          framework: framework.slug,
          tier: framework.tier.join(',')
        }
      });
    }
  };

  // Download handler with authentication
  const handleDownload = async () => {
    if (!framework.artifactHref) return;
    
    if (!canViewFull) {
      router.push(`/inner-circle/locked?action=download&resource=${framework.slug}`);
      return;
    }

    try {
      const response = await fetch(framework.artifactHref, {
        headers: access.token ? { 'Authorization': `Bearer ${access.token}` } : {}
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${framework.slug}-artifact.${framework.artifactHref.split('.').pop()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please ensure you have proper access.');
    }
  };

  return (
    <Layout 
      title={`${framework.title} | Strategic Framework`} 
      description={framework.oneLiner}
      className="bg-slate-950"
    >
      {/* Access Status Bar */}
      {userRole !== 'guest' && (
        <div className={`border-b ${canViewFull ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-700/50 bg-slate-800/30'}`}>
          <div className="mx-auto max-w-7xl px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {canViewFull ? (
                  <>
                    <Key className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-400">Inner Circle Access Active</span>
                    <span className="text-slate-400">• {access.user?.name}</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-400">Limited Preview</span>
                  </>
                )}
              </div>
              {!canViewFull && (
                <Link 
                  href="/inner-circle/join" 
                  className="text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  Upgrade Access <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content remains similar but with enhanced security */}

      {/* Gated Dossier with real content check */}
      <section id="full-dossier" className="border-t border-white/10 py-16 bg-black/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-white">Full dossier</h2>
              <p className="mt-2 text-slate-400">
                {canViewFull ? 'Unlocked for Inner Circle' : 'Locked - Requires Inner Circle Access'}
              </p>
            </div>
            
            {!canViewFull ? (
              <button 
                onClick={() => scrollToLocked("full-dossier")} 
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-black transition-all hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25"
              >
                <Lock className="h-4 w-4" /> Unlock Inner Circle
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm text-amber-400">Access Granted</span>
              </div>
            )}
          </div>

          {isLoadingContent ? (
            <div className="rounded-2xl border border-white/10 p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <p className="mt-4 text-slate-400">Loading protected content...</p>
            </div>
          ) : canViewFull ? (
            // Show protected content if available
            <div className="space-y-16">
              {protectedContent?.operatingLogic ? (
                <div>
                  <h3 className="mb-6 text-2xl font-semibold text-white">Operating logic</h3>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {protectedContent.operatingLogic.map((logic, idx) => (
                      <div key={idx} className="rounded-xl border border-white/10 bg-black/40 p-6">
                        <div className="mb-2 flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${accentBg[framework.accent]}`}>
                            <Shield className={`h-4 w-4 ${accentColor[framework.accent]}`} />
                          </div>
                          <h4 className="text-lg font-semibold text-white">{logic.title}</h4>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">{logic.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 p-8 text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-amber-500/50" />
                  <p className="mt-4 text-slate-400">Protected content not available</p>
                </div>
              )}
              {/* ... rest of protected sections ... */}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center backdrop-blur-sm">
              <Lock className="mx-auto mb-4 h-16 w-16 text-amber-500/50" />
              <h3 className="text-xl font-semibold text-white mb-4">Inner Circle Exclusive</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                This framework contains proprietary operating logic, application playbooks, 
                and board-level metrics reserved for Inner Circle members.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href={`/inner-circle/join?framework=${framework.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 text-sm font-bold text-black hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                >
                  <Key className="h-4 w-4" /> Join Inner Circle
                </Link>
                <Link 
                  href="/inner-circle/details" 
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors"
                >
                  <Users className="h-4 w-4" /> Learn About Membership
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

// Wrap with your existing HOC for route-level protection
export default withInnerCircleAuth(FrameworkDetailPage, {
  requiredRole: 'inner-circle',
  fallbackComponent: (props: any) => {
    // You can render a simplified version for non-authenticated users
    const PublicFrameworkView = (props: PageProps) => (
      <FrameworkDetailPage {...props} />
    );
    return <PublicFrameworkView {...props} />;
  }
});

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await getAllFrameworkSlugs();
  
  // Only expose public frameworks in sitemap
  const publicFrameworks = slugs.filter(slug => 
    !slug.includes('canon') && 
    !slug.includes('strategic-framework') // Adjust based on your actual slug pattern
  );
  
  return { 
    paths: publicFrameworks.map((slug) => ({ params: { slug } })), 
    fallback: 'blocking' 
  };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params, preview = false }) => {
  const slug = String(params?.slug ?? "").trim();
  
  // Check if this is a protected framework
  const isProtected = slug.includes('ultimate-purpose') || 
                     slug.includes('canon') || 
                     slug.includes('strategic-framework');
  
  if (isProtected && !preview) {
    // For protected frameworks, we need to check access server-side
    // This would require getServerSideProps instead
    // For now, return minimal props and let client-side handle auth
    return {
      props: {
        framework: await getFrameworkBySlug(slug),
        isPreview: false,
        protectedContent: null // Will be fetched client-side if user has access
      },
      revalidate: 3600
    };
  }
  
  // Public framework
  const framework = await getFrameworkBySlug(slug);
  if (!framework) return { notFound: true };
  
  return { 
    props: { 
      framework,
      isPreview: preview
    }, 
    revalidate: 3600 
  };
};