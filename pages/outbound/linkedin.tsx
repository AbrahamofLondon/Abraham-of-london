/**
 * pages/outbound/linkedin.tsx — LinkedIn Publishing Dashboard
 *
 * Admin-only dashboard for managing LinkedIn outbound posts.
 * Reads drafts from content/outbound/linkedin/ and provides:
 * - Connection panel (LinkedIn OAuth status)
 * - Tabbed view (Draft, Ready, Needs Review, Posted, Archived)
 * - Post preview with character count
 * - Missing metadata warnings
 * - Copy-to-clipboard button
 * - Publish button (only when connected, enabled, status=ready)
 * - CTA and hashtags display
 * - "Mark as posted" workflow
 * - Link to LinkedIn company page
 *
 * Publishing uses LinkedIn's official API. Posts are only published
 * when status is "ready" and publishing is enabled.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Clipboard,
  ExternalLink,
  FileText,
  Filter,
  Hash,
  Link2,
  Loader2,
  MessageSquare,
  Plug,
  PlugZap,
  RefreshCw,
  Send,
  Shield,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import type { LinkedInPost, LinkedInStatus } from "@/lib/outbound/linkedin-types";

// ─────────────────────────────────────────────────────────────────────────────
// Server-side props
// ─────────────────────────────────────────────────────────────────────────────

export async function getServerSideProps(context: any) {
  const guard = await requireAdminPage(context);
  if (!guard.authorized) return guard.redirect;

  const { getAllLinkedInPosts } = await import("@/lib/outbound/linkedin-utils");
  const posts = getAllLinkedInPosts(false);

  return {
    props: {
      isAuthorized: true,
      initialPosts: posts,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PageProps = {
  isAuthorized: true;
  initialPosts: LinkedInPost[];
};

type TabId = LinkedInStatus | "all";

interface ConnectionStatus {
  connected: boolean;
  organisationId: string | null;
  scopes: string[];
  expiresAt: string | null;
  publishingEnabled: boolean;
  message: string;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "ready", label: "Ready" },
  { id: "needs_review", label: "Needs Review" },
  { id: "posted", label: "Posted" },
  { id: "archived", label: "Archived" },
];

const MAX_CHARS = 3000;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function statusBadgeClass(status?: string): string {
  switch (status) {
    case "draft":
      return "bg-gray-700 text-gray-200";
    case "ready":
      return "bg-green-900/50 text-green-300 border border-green-700";
    case "needs_review":
      return "bg-amber-900/50 text-amber-300 border border-amber-700";
    case "posted":
      return "bg-blue-900/50 text-blue-300 border border-blue-700";
    case "archived":
      return "bg-zinc-800 text-zinc-400";
    default:
      return "bg-gray-800 text-gray-400";
  }
}

function classificationBadgeClass(classification: string): string {
  switch (classification) {
    case "post":
      return "bg-emerald-900/40 text-emerald-300";
    case "script":
      return "bg-purple-900/40 text-purple-300";
    case "essay":
      return "bg-cyan-900/40 text-cyan-300";
    case "misplaced_asset":
      return "bg-red-900/40 text-red-300";
    default:
      return "bg-gray-800 text-gray-400";
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Connection Panel Component
// ─────────────────────────────────────────────────────────────────────────────

function ConnectionPanel() {
  const [status, setStatus] = React.useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [connecting, setConnecting] = React.useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/outbound/linkedin/status");
      const data = await res.json();
      if (data.ok) {
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch connection status:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = () => {
    setConnecting(true);
    window.location.href = "/api/admin/outbound/linkedin/connect";
  };

  // Check URL params for connection result
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectionResult = params.get("connection");
    if (connectionResult === "success") {
      fetchStatus();
      // Clean URL
      window.history.replaceState({}, "", "/outbound/linkedin");
    }
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking LinkedIn connection...
        </div>
      </div>
    );
  }

  const isConnected = status?.connected === true;
  const isEnabled = status?.publishingEnabled === true;

  return (
    <div
      className={`rounded-lg border p-4 ${
        isConnected
          ? "border-emerald-800 bg-emerald-950/30"
          : "border-zinc-800 bg-zinc-900/60"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {isConnected ? (
            <PlugZap className="w-5 h-5 text-emerald-400 mt-0.5" />
          ) : (
            <Plug className="w-5 h-5 text-zinc-500 mt-0.5" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white">
                LinkedIn Company Page
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  isConnected
                    ? "bg-emerald-900/50 text-emerald-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {isConnected ? "Connected" : "Not Connected"}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  isEnabled
                    ? "bg-green-900/50 text-green-300"
                    : "bg-amber-900/50 text-amber-300"
                }`}
              >
                {isEnabled ? "Publishing Enabled" : "Publishing Disabled"}
              </span>
            </div>

            {status && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-zinc-400">{status.message}</p>
                {isConnected && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span>
                      Org ID:{" "}
                      <code className="text-zinc-300">
                        {status.organisationId}
                      </code>
                    </span>
                    {status.expiresAt && (
                      <span>
                        Token expires: {formatDate(status.expiresAt)}
                      </span>
                    )}
                    {status.scopes.length > 0 && (
                      <span>
                        Scopes:{" "}
                        {status.scopes.map((s) => (
                          <code key={s} className="text-zinc-300 mr-1">
                            {s}
                          </code>
                        ))}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="text-xs px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors disabled:opacity-50"
            >
              Reconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="text-xs px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {connecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Link2 className="w-3 h-3" />
              )}
              Connect LinkedIn
            </button>
          )}
          <button
            onClick={fetchStatus}
            className="text-xs p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Safety note */}
      <div className="mt-3 flex items-start gap-1.5 text-xs text-zinc-500">
        <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>
          Publishing uses LinkedIn&apos;s official API. Posts are only published
          when status is <strong>ready</strong> and publishing is enabled.
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Post Card Component
// ─────────────────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onRefresh,
  connectionStatus,
}: {
  post: LinkedInPost;
  onRefresh: () => void;
  connectionStatus: ConnectionStatus | null;
}) {
  const [copied, setCopied] = React.useState(false);
  const [marking, setMarking] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [postUrl, setPostUrl] = React.useState("");
  const [showMarkPosted, setShowMarkPosted] = React.useState(false);
  const [statusUpdating, setStatusUpdating] = React.useState(false);

  const charPercent = Math.round((post.charCount / MAX_CHARS) * 100);
  const isOverLimit = post.charCount > MAX_CHARS;

  const canPublish =
    connectionStatus?.connected === true &&
    connectionStatus?.publishingEnabled === true &&
    post.frontmatter.status === "ready" &&
    !post.isPosted &&
    !isOverLimit &&
    post.frontmatter.platform === "linkedin" &&
    post.frontmatter.channel === "company";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = post.body;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePublish = async () => {
    if (!confirm(`Publish "${post.frontmatter.title || post.filename}" to LinkedIn?`)) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/outbound/linkedin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: post.filename }),
      });
      const data = await res.json();
      if (data.ok) {
        onRefresh();
      } else {
        alert(`Publish failed: ${data.error}\n\nCode: ${data.errorCode || "unknown"}`);
      }
    } catch (err) {
      alert("Failed to publish. Check console for details.");
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const handleMarkPosted = async () => {
    if (!postUrl.trim()) return;
    setMarking(true);
    try {
      const res = await fetch("/api/admin/outbound/linkedin/mark-posted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: post.filename,
          linkedinPostUrl: postUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowMarkPosted(false);
        setPostUrl("");
        onRefresh();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to mark as posted. Check console for details.");
      console.error(err);
    } finally {
      setMarking(false);
    }
  };

  const handleStatusChange = async (newStatus: LinkedInStatus) => {
    setStatusUpdating(true);
    try {
      const res = await fetch("/api/admin/outbound/linkedin/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: post.filename,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onRefresh();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to update status.");
      console.error(err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const fm = post.frontmatter;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-medium text-white truncate">
              {fm.title || "Untitled"}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(
                fm.status,
              )}`}
            >
              {fm.status || "no status"}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classificationBadgeClass(
                post.classification,
              )}`}
            >
              {post.classification}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-mono truncate">
            {post.filename}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Copy post body to clipboard"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Clipboard className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Character count */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isOverLimit
                ? "bg-red-500"
                : charPercent > 80
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(charPercent, 100)}%` }}
          />
        </div>
        <span
          className={`text-xs font-mono ${
            isOverLimit ? "text-red-400" : "text-zinc-400"
          }`}
        >
          {post.charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()}
        </span>
      </div>

      {/* Warnings */}
      {post.warnings.length > 0 && (
        <div className="space-y-1">
          {post.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 text-xs text-amber-400"
            >
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      {fm.ctaLabel && (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Send className="w-3.5 h-3.5" />
          <span className="font-medium text-zinc-300">{fm.ctaLabel}</span>
          {fm.ctaUrl && (
            <a
              href={fm.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline truncate"
            >
              {fm.ctaUrl}
            </a>
          )}
        </div>
      )}

      {/* Hashtags */}
      {fm.hashtags && fm.hashtags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Hash className="w-3.5 h-3.5 text-zinc-500" />
          {fm.hashtags.map((tag, i) => (
            <span
              key={i}
              className="text-xs text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Preview */}
      <details className="group">
        <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          Preview
        </summary>
        <div className="mt-2 p-3 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
          {post.body}
        </div>
      </details>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
        {!post.isPosted && (
          <>
            {/* Status quick change */}
            <select
              value={fm.status || "draft"}
              onChange={(e) =>
                handleStatusChange(e.target.value as LinkedInStatus)
              }
              disabled={statusUpdating}
              className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-zinc-500"
            >
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="needs_review">Needs Review</option>
              <option value="archived">Archived</option>
            </select>

            {/* Publish button */}
            <button
              onClick={handlePublish}
              disabled={!canPublish || publishing}
              className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                canPublish
                  ? "bg-blue-700 text-white hover:bg-blue-600"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
              title={
                !connectionStatus?.connected
                  ? "Connect LinkedIn first"
                  : !connectionStatus?.publishingEnabled
                    ? "Publishing is disabled in environment"
                    : fm.status !== "ready"
                      ? "Set status to 'ready' before publishing"
                      : isOverLimit
                        ? "Post exceeds character limit"
                        : "Publish to LinkedIn"
              }
            >
              {publishing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Publish
            </button>

            {/* Mark as posted (manual fallback) */}
            <button
              onClick={() => setShowMarkPosted(true)}
              className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition-colors"
            >
              Mark as Posted
            </button>
          </>
        )}

        {post.isPosted && (
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-400" />
            Posted {fm.postedAt ? formatDate(fm.postedAt) : ""}
          </span>
        )}

        {fm.linkedinPostUrl && (
          <a
            href={fm.linkedinPostUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 ml-auto"
          >
            <ExternalLink className="w-3 h-3" />
            View on LinkedIn
          </a>
        )}
      </div>

      {/* Mark as posted modal */}
      {showMarkPosted && (
        <div className="mt-2 p-3 rounded bg-zinc-950 border border-zinc-700 space-y-2">
          <p className="text-xs text-zinc-400">
            Paste the LinkedIn post URL to confirm it has been published.
          </p>
          <input
            type="text"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            placeholder="https://www.linkedin.com/company/.../posts/..."
            className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-600"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkPosted}
              disabled={marking || !postUrl.trim()}
              className="text-xs px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              {marking ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Confirm Posted
            </button>
            <button
              onClick={() => {
                setShowMarkPosted(false);
                setPostUrl("");
              }}
              className="text-xs px-3 py-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

const LinkedInOutboundPage: NextPage<PageProps> = ({ initialPosts }) => {
  const { data: session } = useSession();
  const [posts, setPosts] = React.useState<LinkedInPost[]>(initialPosts);
  const [activeTab, setActiveTab] = React.useState<TabId>("ready");
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [connectionStatus, setConnectionStatus] =
    React.useState<ConnectionStatus | null>(null);

  const refreshPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/outbound/linkedin?includePosted=${activeTab === "posted" || activeTab === "all"}`,
      );
      const data = await res.json();
      if (data.ok) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Failed to refresh posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch connection status
  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/admin/outbound/linkedin/status");
        const data = await res.json();
        if (data.ok) {
          setConnectionStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch connection status:", err);
      }
    };
    fetchStatus();
  }, []);

  // Filter posts by tab and search
  const filteredPosts = React.useMemo(() => {
    let result = posts;

    if (activeTab !== "all") {
      result = result.filter((p) => {
        const status = p.frontmatter.status || "draft";
        if (activeTab === "posted") return p.isPosted || status === "posted";
        if (activeTab === "archived") return status === "archived";
        return status === activeTab && !p.isPosted;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.frontmatter.title || "").toLowerCase().includes(q) ||
          p.filename.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          (p.frontmatter.hashtags || []).some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [posts, activeTab, searchQuery]);

  const tabCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: posts.length };
    for (const tab of TABS) {
      if (tab.id === "all") continue;
      if (tab.id === "posted") {
        counts.posted = posts.filter((p) => p.isPosted || p.frontmatter.status === "posted").length;
      } else if (tab.id === "archived") {
        counts.archived = posts.filter((p) => p.frontmatter.status === "archived").length;
      } else {
        counts[tab.id] = posts.filter(
          (p) => p.frontmatter.status === tab.id && !p.isPosted,
        ).length;
      }
    }
    return counts;
  }, [posts]);

  return (
    <>
      <Head>
        <title>LinkedIn Outbound — Admin</title>
      </Head>
      <AdminLayout>
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                LinkedIn Outbound
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Manage company page posts from content/outbound/linkedin/
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://www.linkedin.com/company/115850136/admin/page-posts/published/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                LinkedIn Company Page
              </a>
              <button
                onClick={refreshPosts}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Connection Panel */}
          <ConnectionPanel />

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-zinc-800 pb-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs px-3 py-2 rounded-t transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "text-white bg-zinc-800 border-b-2 border-blue-500"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                {tab.label}
                {(tabCounts[tab.id] ?? 0) > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    {tabCounts[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts by title, filename, body, or hashtag..."
              className="w-full text-sm bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Post list */}
          <div className="space-y-3">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
              </div>
            )}

            {!loading && filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">
                  {activeTab === "all"
                    ? "No LinkedIn posts found."
                    : `No posts with status "${activeTab}".`}
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  Posts live in content/outbound/linkedin/
                </p>
              </div>
            )}

            {!loading &&
              filteredPosts.map((post) => (
                <PostCard
                  key={post.filename}
                  post={post}
                  onRefresh={refreshPosts}
                  connectionStatus={connectionStatus}
                />
              ))}
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default LinkedInOutboundPage;