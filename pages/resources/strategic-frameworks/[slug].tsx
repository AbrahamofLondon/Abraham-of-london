/* Abraham of London - Strategic Framework Detail V8.0
 * Reconciled for Database-Backed Access and Gated Integrity
 */
import * as React from "react";
import { useEffect, useState } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Head from "next/head";
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
  Download,
  ArrowLeft
} from "lucide-react";

import Layout from "@/components/Layout";
import { withUnifiedAuth } from "@/lib/auth/withUnifiedAuth";

// STRATEGIC FIX: Import the database-backed server getters
import {
  getServerFrameworkBySlug,
  getAllFrameworkSlugs,
  type Framework,
  type FrameworkTier,
} from "@/lib/resources/strategic-frameworks";

import { sanitizeData } from "@/lib/server/md-utils";
import type { User } from '@/types/auth';
import type { InnerCircleAccess } from '@/lib/inner-circle';

type PageProps = {
  framework: Framework;
  isPreview?: boolean;
};

interface FrameworkPageProps extends PageProps {
  user?: User;
  innerCircleAccess?: InnerCircleAccess;
  requiredRole?: string;
}

// Clean icon mapping
const tierIcon: Record<FrameworkTier, React.ReactNode> = {
  Board: <Shield className="h-5 w-5" aria-hidden="true" />,
  Founder: <Zap className="h-5 w-5" aria-hidden="true" />,
  Household: <Users className="h-5 w-5" aria-hidden="true" />,
};

// Clean color system
const accentColor: Record<Framework["accent"], string> = {
  gold: "text-amber-400",
  emerald: "text-emerald-400",
  blue: "text-blue-400",
  rose: "text-rose-400",
  indigo: "text-indigo-400",
};

const accentBg: Record<Framework["accent"], string> = {
  gold: "bg-amber-500/10 border-amber-500/20",
  emerald: "bg-emerald-500/10 border-emerald-500/20",
  blue: "bg-blue-500/10 border-blue-500/20",
  rose: "bg-rose-500/10 border-rose-500/20",
  indigo: "bg-indigo-500/10 border-indigo-500/20",
};

// Access Denied Component
const AccessDeniedComponent = ({ framework, requiredRole }: { framework: Framework; requiredRole?: string }) => {
  const router = useRouter();
  
  return (
    <Layout 
      title={`${framework.title} | Access Required`} 
      description={framework.oneLiner}
    >
      <div className="min-h-[80vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full mx-auto p-8 text-center bg-gradient-to-b from-slate-900/50 to-slate-950/50 rounded-2xl border border-slate-800/50">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 mb-6">
            <Lock className="w-12 h-12 text-amber-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            {requiredRole?.replace('-', ' ').toUpperCase()} Access Required
          </h1>
          
          <p className="text-slate-300 mb-6">
            "{framework.title}" requires {requiredRole} membership.
          </p>
          
          <div className="space-y-4">
            <Link
              href={`/inner-circle/join?framework=${framework.slug}&returnTo=${encodeURIComponent(router.asPath)}`}
              className="block w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all text-center hover:scale-[1.02] active:scale-[0.98]"
            >
              <Key className="inline h-4 w-4 mr-2" />
              Join Inner Circle
            </Link>
            
            <div className="text-sm text-slate-400 pt-4 border-t border-slate-800/50">
              <p>Already have access?</p>
              <Link 
                href={`/login?redirect=${encodeURIComponent(router.asPath)}&tier=${requiredRole}`}
                className="text-amber-400 hover:text-amber-300 underline transition-colors"
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

  const hasInnerCircleAccess = innerCircleAccess?.hasAccess || false;
  const isAdmin = user?.role === 'admin' || user?.role === 'editor';
  const canViewFull = hasInnerCircleAccess || isAdmin || isPreview;
  
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
        query: { returnTo: router.asPath, framework: framework.slug }
      });
    }
  };

  return (
    <Layout 
      title={`${framework.title} | Strategic Framework`} 
      description={framework.oneLiner}
    >
      <div className={`border-b ${canViewFull ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent' : 'border-slate-800 bg-gradient-to-r from-slate-800/30 to-transparent'}`}>
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              {canViewFull ? (
                <>
                  <Key className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-300 font-medium">
                    {userRole === 'admin' || userRole === 'editor' ? 'Admin Access' : 'Inner Circle Access'}
                  </span>
                  <span className="text-slate-300">• {userName}</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300">Limited Preview</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-black">
        <section className="relative overflow-hidden border-b border-slate-800/50">
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="mb-8">
              <Link href="/resources/strategic-frameworks" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors group">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to frameworks
              </Link>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${accentBg[framework.accent]} ${accentColor[framework.accent]}`}>
                    {framework.tag}
                  </span>
                </div>
                <h1 className="mb-4 font-serif text-4xl font-bold text-white sm:text-5xl leading-tight">
                  {framework.title}
                </h1>
                <p className="mb-8 text-xl text-slate-300 leading-relaxed">
                  {framework.oneLiner}
                </p>
                <div className="rounded-xl border border-slate-800/50 bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold text-white">Canon foundation</h3>
                  <p className="text-slate-300 italic">"{framework.canonRoot}"</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-slate-800/50 bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold text-white">At a glance</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-3 text-slate-300">
                      <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" /> 
                      Tier: {framework.tier.join(", ")}
                    </li>
                  </ul>
                </div>

                {framework.artifactHref && canViewFull && (
                  <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-amber-600/5 p-6">
                    <button 
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                    >
                      {isDownloading ? 'Downloading...' : 'Download template'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="full-dossier" className="border-t border-slate-800/50 py-16 bg-gradient-to-b from-black/20 to-slate-950/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl font-semibold text-white">Full dossier</h2>
                <p className="mt-2 text-slate-300">
                  {canViewFull ? 'Unlocked' : 'Locked - Inner Circle Access Required'}
                </p>
              </div>
            </div>

            {canViewFull ? (
              <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-8 backdrop-blur-sm">
                <h3 className="mb-6 text-2xl font-semibold text-white">Complete Framework Content</h3>
                <p className="text-slate-300">
                  Full operating logic and application playbook for {framework.title}.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700/50 p-12 text-center bg-gradient-to-b from-slate-900/30 to-slate-950/30 backdrop-blur-sm">
                <Lock className="mx-auto mb-4 h-16 w-16 text-amber-500/50" />
                <h3 className="text-xl font-semibold text-white mb-4">Inner Circle Exclusive</h3>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href={`/inner-circle/join?framework=${framework.slug}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 text-sm font-bold text-white transition-all">
                    <Key className="h-4 w-4" /> Join Inner Circle
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

// Access Logic
const requiresInnerCircle = (framework: Framework): boolean => {
  return framework.tier.some(t => t === 'Board' || t === 'Founder') || framework.slug.includes('canon');
};

const FrameworkDetailPage: NextPage<PageProps> = (props) => {
  const { framework } = props;
  const needsInnerCircle = requiresInnerCircle(framework);
  
  if (needsInnerCircle) {
    const ProtectedComponent = withUnifiedAuth(FrameworkDetailPageComponent, {
      requiredRole: 'inner-circle',
      fallbackComponent: () => <AccessDeniedComponent framework={framework} requiredRole="inner-circle" />,
      publicFallback: false
    });
    return <ProtectedComponent {...props} />;
  }
  return <FrameworkDetailPageComponent {...props} />;
};

export default FrameworkDetailPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await getAllFrameworkSlugs();
  return { 
    paths: slugs.map((slug) => ({ params: { slug } })), 
    fallback: 'blocking' 
  };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  const framework = await getServerFrameworkBySlug(slug);
  if (!framework) return { notFound: true };
  
  return { 
    props: { framework: sanitizeData(framework) }, 
    revalidate: 3600 
  };
};