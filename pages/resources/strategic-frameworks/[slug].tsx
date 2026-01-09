/* Abraham of London - Strategic Framework Detail V7.0
 * Unified Auth Integration
 */
import * as React from "react";
import { useEffect, useState } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
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
  Key,
  Download
} from "lucide-react";

import Layout from "@/components/Layout";
import { withUnifiedAuth } from "@/lib/auth/withUnifiedAuth";
import {
  getFrameworkBySlug,
  getAllFrameworkSlugs,
  type Framework,
  type FrameworkTier,
} from "@/lib/resources/strategic-frameworks";
import type { User } from '@/types/auth';
import type { InnerCircleAccess } from '@/lib/inner-circle';

type PageProps = {
  framework: Framework;
  isPreview?: boolean;
};

// Add user and innerCircleAccess from HOC
interface FrameworkPageProps extends PageProps {
  user?: User;
  innerCircleAccess?: InnerCircleAccess;
  requiredRole?: string;
}

// Your existing helper functions remain the same...
const tierIcon: Record<FrameworkTier, React.ReactNode> = {
  Board: <Shield className="h-4 w-4" aria-hidden="true" />,
  Founder: <Zap className="h-4 w-4" aria-hidden="true" />,
  Household: <Users className="h-4 w-4" aria-hidden="true" />,
};

const accentColor: Record<Framework["accent"], string> = {
  gold: "text-amber-400",
  emerald: "text-emerald-400",
  blue: "text-blue-400",
  rose: "text-rose-400",
  indigo: "text-indigo-400",
};

const accentBg: Record<Framework["accent"], string> = {
  gold: "bg-amber-500/10 border-amber-500/30",
  emerald: "bg-emerald-500/10 border-emerald-500/30",
  blue: "bg-blue-500/10 border-blue-500/30",
  rose: "bg-rose-500/10 border-rose-500/30",
  indigo: "bg-indigo-500/10 border-indigo-500/30",
};

// Access Denied Component
const AccessDeniedComponent = ({ framework, requiredRole }: { framework: Framework; requiredRole?: string }) => {
  const router = useRouter();
  
  return (
    <Layout 
      title={`${framework.title} | Access Required`} 
      description={framework.oneLiner}
      className="bg-slate-950"
    >
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="max-w-md mx-auto p-8 text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
            <Lock className="w-12 h-12 text-amber-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            {requiredRole?.replace('-', ' ').toUpperCase()} Access Required
          </h1>
          
          <p className="text-slate-400 mb-6">
            "{framework.title}" requires {requiredRole} membership.
          </p>
          
          <div className="space-y-4">
            <Link
              href={`/inner-circle/join?framework=${framework.slug}&returnTo=${encodeURIComponent(router.asPath)}`}
              className="block w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-lg font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all text-center"
            >
              <Key className="inline h-4 w-4 mr-2" />
              Join Inner Circle
            </Link>
            
            <div className="text-sm text-slate-500 pt-4 border-t border-slate-800">
              <p>Already have access?</p>
              <Link 
                href={`/login?redirect=${encodeURIComponent(router.asPath)}&tier=${requiredRole}`}
                className="text-amber-500 hover:text-amber-400 underline"
              >
                Sign in with your credentials
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Main Component
const FrameworkDetailPageComponent: NextPage<FrameworkPageProps> = ({ 
  framework, 
  isPreview = false,
  user,
  innerCircleAccess,
  requiredRole
}) => {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  // Check access
  const hasInnerCircleAccess = innerCircleAccess?.hasAccess || false;
  const isAdmin = user?.role === 'admin' || user?.role === 'editor';
  const canViewFull = hasInnerCircleAccess || isAdmin || isPreview;
  
  // User display info
  const userName = user?.name || 'Guest';
  const userRole = user?.role || (hasInnerCircleAccess ? 'inner-circle' : 'guest');

  const handleDownload = async () => {
    if (!framework.artifactHref) return;
    
    if (!canViewFull) {
      router.push(`/inner-circle/locked?action=download&resource=${framework.slug}`);
      return;
    }

    setIsDownloading(true);
    try {
      // For inner-circle members, use their token
      const headers: HeadersInit = {};
      if (innerCircleAccess?.token) {
        headers.Authorization = `Bearer ${innerCircleAccess.token}`;
      }
      
      const response = await fetch(framework.artifactHref, { headers });
      
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
    } finally {
      setIsDownloading(false);
    }
  };

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

  return (
    <Layout 
      title={`${framework.title} | Strategic Framework`} 
      description={framework.oneLiner}
      className="bg-slate-950"
    >
      {/* Access Status Bar */}
      <div className={`border-b ${canViewFull ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-700/50 bg-slate-800/30'}`}>
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {canViewFull ? (
                <>
                  <Key className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-400">
                    {userRole === 'admin' || userRole === 'editor' ? 'Admin Access' : 'Inner Circle Access'}
                  </span>
                  <span className="text-slate-400">• {userName}</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-slate-500" />
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

      {/* Main Content (your existing layout) */}
      <main className="min-h-screen bg-slate-950">
        {/* Hero Header */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Link href="/resources/strategic-frameworks" className="text-sm text-gray-400 hover:text-white">
                ← Back to frameworks
              </Link>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${accentBg[framework.accent]} ${accentColor[framework.accent]}`}>
                    {framework.tag}
                  </span>
                  <div className="flex items-center gap-2">
                    {framework.tier.map((t) => (
                      <span key={t} className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300">
                        {tierIcon[t]} {t}
                      </span>
                    ))}
                  </div>
                </div>

                <h1 className="mb-4 font-serif text-4xl font-bold text-white sm:text-5xl">{framework.title}</h1>
                <p className="mb-8 text-xl text-gray-300">{framework.oneLiner}</p>
                <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold text-white">Canon foundation</h3>
                  <p className="text-gray-300 italic">"{framework.canonRoot}"</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold text-white">At a glance</h3>
                  <ul className="space-y-3 text-sm text-gray-300">
                    <li className="flex items-center gap-3"><CheckCircle className="h-4 w-4 text-green-400" /> Tier: {framework.tier.join(", ")}</li>
                    <li className="flex items-center gap-3"><TrendingUp className="h-4 w-4 text-blue-400" /> {framework.executiveSummary.length} Core Principles</li>
                    <li className="flex items-center gap-3"><Calendar className="h-4 w-4 text-amber-400" /> {framework.applicationPlaybook.length} Step Playbook</li>
                  </ul>
                </div>

                {framework.artifactHref && canViewFull && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">Download artifact</h3>
                    <button 
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-black transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDownloading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" /> Download template
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Gated Dossier Section */}
        <section id="full-dossier" className="border-t border-white/10 py-16 bg-black/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-3xl font-semibold text-white">Full dossier</h2>
                <p className="mt-2 text-slate-400">
                  {canViewFull ? 'Unlocked' : 'Locked - Inner Circle Access Required'}
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

            {canViewFull ? (
              <div className="space-y-16">
                {/* Show full content for authorized users */}
                <div>
                  <h3 className="mb-6 text-2xl font-semibold text-white">Complete Framework Content</h3>
                  <p className="text-slate-300">
                    Full operating logic, application playbook, and metrics are available to Inner Circle members.
                  </p>
                  {/* Your full framework content here */}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center backdrop-blur-sm">
                <Lock className="mx-auto mb-4 h-16 w-16 text-amber-500/50" />
                <h3 className="text-xl font-semibold text-white mb-4">Inner Circle Exclusive</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  This strategic framework contains proprietary insights reserved for Inner Circle members.
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
      </main>
    </Layout>
  );
};

// Determine if this framework requires inner-circle access
const requiresInnerCircle = (framework: Framework): boolean => {
  const protectedTags = ['canon', 'strategic', 'ultimate-purpose', 'governance'];
  const protectedTiers = framework.tier.filter(t => 
    t === 'Board' || t === 'Founder'
  );
  
  return (
    protectedTags.some(tag => framework.tag.toLowerCase().includes(tag)) ||
    protectedTiers.length > 0 ||
    framework.slug.includes('canon') ||
    framework.slug.includes('strategic-framework')
  );
};

// Export the wrapped component
const FrameworkDetailPage: NextPage<PageProps> = (props) => {
  const { framework } = props;
  
  // Check if this framework requires inner-circle access
  const needsInnerCircle = requiresInnerCircle(framework);
  
  if (needsInnerCircle) {
    // Wrap with unified auth for inner-circle content
    const ProtectedComponent = withUnifiedAuth(FrameworkDetailPageComponent, {
      requiredRole: 'inner-circle',
      fallbackComponent: () => <AccessDeniedComponent framework={framework} requiredRole="inner-circle" />,
      publicFallback: false // Don't show public version
    });
    
    return <ProtectedComponent {...props} />;
  }
  
  // Public framework - no auth required
  return <FrameworkDetailPageComponent {...props} />;
};

export default FrameworkDetailPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await getAllFrameworkSlugs();
  
  // Only expose public frameworks in sitemap
  const publicFrameworks = slugs.filter(slug => {
    // Filter out protected frameworks
    return !slug.includes('canon') && 
           !slug.includes('strategic-framework') &&
           !slug.includes('ultimate-purpose');
  });
  
  return { 
    paths: publicFrameworks.map((slug) => ({ params: { slug } })), 
    fallback: 'blocking' 
  };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params, preview = false }) => {
  const slug = String(params?.slug ?? "").trim();
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