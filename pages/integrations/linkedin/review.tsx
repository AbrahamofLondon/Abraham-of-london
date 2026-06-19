import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import {
  BarChart3,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  Lock,
  Plug,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import {
  getReviewState,
  requireLinkedInReviewerPage,
  type LinkedInReviewActor,
} from "@/lib/integrations/linkedin/review-workflow";

type ReviewState = Awaited<ReturnType<typeof getReviewState>>;

export const getServerSideProps: GetServerSideProps<{
  initialState: ReviewState;
  oauthNotice: { status: string; code: string | null; message: string | null } | null;
}> = async (ctx) => {
  const guard = await requireLinkedInReviewerPage(ctx);
  if (!guard.actor) return { redirect: guard.redirect! };

  return {
    props: {
      initialState: await getReviewState(guard.actor as LinkedInReviewActor),
      oauthNotice:
        typeof ctx.query.connection === "string"
          ? {
              status: ctx.query.connection,
              code: typeof ctx.query.code === "string" ? ctx.query.code : null,
              message: typeof ctx.query.message === "string" ? ctx.query.message : null,
            }
          : null,
    },
  };
};

const badges = [
  "Page Management",
  "Page Analytics",
  "User-approved publishing",
  "No scraping",
  "No unauthorised automation",
  "No sales targeting",
];

const checklist = [
  "Content is prepared inside Abraham of London.",
  "The selected LinkedIn page is visible before approval.",
  "Publication requires explicit user approval.",
  "No profile publishing, scraping, enrichment, or sales targeting is used.",
];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-white/10 bg-black/20 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <div className="mt-1 break-words text-sm text-zinc-200">{value || "Not available"}</div>
    </div>
  );
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/10 py-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400/70">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-2xl text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function LinkedInReviewPage({
  initialState,
  oauthNotice,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [state, setState] = React.useState(initialState);
  const [content, setContent] = React.useState(initialState.draft?.content ?? "");
  const [confirmed, setConfirmed] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [publishResult, setPublishResult] = React.useState<any>(null);

  React.useEffect(() => {
    setContent(state.draft?.content ?? "");
  }, [state.draft?.content]);

  async function mutate(label: string, url: string, init: RequestInit) {
    setBusy(label);
    setMessage(null);
    try {
      const data = await parseResponse(await fetch(url, init));
      if (data.state) setState(data.state);
      if (data.result) setPublishResult(data.result);
      setMessage(`${label} completed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `${label} failed.`);
    } finally {
      setBusy(null);
    }
  }

  const charCount = content.length;
  const workspaceDeleted = Boolean(state.workspace.deletedAt);
  const draft = state.draft;
  const selectedPage = state.connection.organizationName || "Pending authorised page selection";
  const selectedPost = draft?.title || "No LinkedIn review draft selected";
  const analyticsMessage =
    state.analytics?.metrics?.unavailableReason ||
    "Analytics endpoint is wired for LinkedIn Page Analytics. Live values will appear once LinkedIn grants the required Standard Tier access. No mock analytics are shown as live data.";

  return (
    <>
      <Head>
        <title>LinkedIn Community Management Review | Abraham of London</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
          <header className="border-b border-white/10 pb-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/75">
                  Restricted reviewer workflow
                </p>
                <h1 className="mt-3 font-serif text-4xl text-white">
                  LinkedIn Community Management Review
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                  Abraham of London uses LinkedIn Community Management API access to help authorised users manage approved LinkedIn company-page content and review page/post performance analytics. Content is prepared inside the platform, reviewed by the user, and only then published or scheduled for LinkedIn.
                </p>
              </div>
              <div className="border border-amber-400/20 bg-amber-400/5 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-200/70">
                  Reviewer
                </p>
                <p className="mt-1 text-sm text-white">{state.actor.email}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span key={badge} className="border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
                  {badge}
                </span>
              ))}
            </div>
          </header>

          {oauthNotice ? (
            <div className="mt-6 border border-white/10 bg-black/25 p-4 text-sm text-zinc-300">
              LinkedIn OAuth {oauthNotice.status}
              {oauthNotice.code ? `: ${oauthNotice.code}` : ""}
              {oauthNotice.message ? ` - ${oauthNotice.message}` : ""}
            </div>
          ) : null}
          {message ? <div className="mt-6 border border-white/10 bg-black/25 p-4 text-sm text-zinc-300">{message}</div> : null}

          <Section eyebrow="Step 1" title="Product Context">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <p className="text-sm leading-6 text-zinc-300">
                  This reviewer workspace demonstrates governed executive publishing: approved strategic material is converted into LinkedIn company-page content, reviewed by the authorised user, and then either published through the connected Page token or shown as a clearly labelled API Review Dry Run while Standard Tier access is pending.
                </p>
              </div>
              <div className="border border-white/10 bg-black/20 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Use cases requested</p>
                <p className="mt-2 text-sm text-zinc-200">Page Management and Page Analytics only.</p>
              </div>
            </div>
          </Section>

          <Section eyebrow="Step 2" title="LinkedIn Connection Status">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-100">
                <Plug className="h-4 w-4" />
                {state.connection.status}
              </span>
              {state.config.reviewMode ? (
                <span className="border border-sky-400/20 bg-sky-400/5 px-3 py-2 text-sm text-sky-100">
                  API Review Dry Run enabled
                </span>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Connected user" value={state.connection.displayName} />
              <Field label="LinkedIn organisation/page" value={state.connection.organizationName} />
              <Field label="Page URN / masked ID" value={state.connection.organizationUrnMasked} />
              <Field label="Granted scopes" value={state.connection.grantedScopes.join(", ")} />
              <Field label="Connection created" value={state.connection.createdAt} />
              <Field label="Token expiry" value={state.connection.tokenExpiresAt} />
            </div>
          </Section>

          <Section eyebrow="Step 3" title="Connect LinkedIn">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm leading-6 text-zinc-300">
                  OAuth uses a server-side callback, signed state validation, encrypted token storage, and minimum configured Community Management scopes. Tokens and client secrets are never sent to the browser.
                </p>
                {!state.config.configured ? (
                  <p className="mt-2 text-sm text-amber-200">
                    OAuth configuration pending: {state.config.missing.join(", ") || "redirect URI validation"}.
                  </p>
                ) : null}
              </div>
              <a
                href="/api/integrations/linkedin/start"
                className="inline-flex items-center justify-center gap-2 border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 hover:bg-amber-400/15"
              >
                <ShieldCheck className="h-4 w-4" />
                Connect LinkedIn
              </a>
            </div>
          </Section>

          <Section eyebrow="Step 4" title="Select LinkedIn Organisation Page">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Page name" value={state.connection.organizationName} />
              <Field label="Identifier / URN" value={state.connection.organizationUrnMasked} />
              <Field label="Permission status" value={state.connection.organizationSource === "connected_metadata" ? "Selected from connected metadata" : "Pending Standard Tier approval"} />
              <Field label="Selected page confirmation" value={selectedPage} />
            </div>
            <button
              type="button"
              onClick={() =>
                mutate("Confirm page context", "/api/integrations/linkedin/review-state", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "confirmPage" }),
                })
              }
              disabled={Boolean(busy) || workspaceDeleted}
              className="mt-4 inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm selected page context
            </button>
            {state.connection.organizationSource !== "connected_metadata" ? (
              <p className="mt-4 border border-sky-400/15 bg-sky-400/5 p-4 text-sm leading-6 text-sky-100/80">
                This environment is pending Standard Tier approval. The integration is wired for authorised organisation-page selection. No mock LinkedIn data is represented as live API data.
              </p>
            ) : null}
          </Section>

          <Section eyebrow="Step 5" title="Approved Content Workspace">
            {workspaceDeleted || !draft ? (
              <div className="border border-sky-400/15 bg-sky-400/5 p-5">
                <p className="text-sm leading-6 text-sky-100/85">
                  LinkedIn integration data has been deleted. No LinkedIn connection, analytics, or review drafts remain in this workspace. To recreate the demo content, select Reset Review Workspace.
                </p>
                <button
                  type="button"
                  onClick={() => mutate("Reset Review Workspace", "/api/integrations/linkedin/reset-demo", { method: "POST" })}
                  disabled={Boolean(busy)}
                  className="mt-4 inline-flex items-center gap-2 border border-sky-300/25 bg-sky-300/10 px-4 py-3 text-sm text-sky-100 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Review Workspace
                </button>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-300" />
                    <h3 className="text-lg text-white">{draft.title}</h3>
                  </div>
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={8}
                    className="w-full border border-white/10 bg-black/30 p-4 text-sm leading-6 text-zinc-100 outline-none focus:border-amber-400/40"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs text-zinc-500">{charCount} characters</span>
                    <span className="font-mono text-xs text-zinc-500">Status: {draft.status}</span>
                    <button
                      type="button"
                      onClick={() =>
                        mutate("Save draft", "/api/integrations/linkedin/review-state", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "saveDraft", content }),
                        })
                      }
                      disabled={Boolean(busy)}
                      className="border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-200 disabled:opacity-50"
                    >
                      Save as draft
                    </button>
                  </div>
                </div>
                <div className="border border-white/10 bg-black/20 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Compliance checklist</p>
                  <div className="mt-4 space-y-3">
                    {checklist.map((item) => (
                      <div key={item} className="flex gap-3 text-sm text-zinc-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Section>

          <Section eyebrow="Step 6" title="Publishing Approval Gate">
            <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
              <div className="border border-white/10 bg-black/20 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Content preview</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{content}</p>
              </div>
              <div className="space-y-3">
                <Field label="Selected LinkedIn page" value={selectedPage} />
                <Field label="Actor approving" value={state.actor.email} />
                <Field label="Timestamp" value={new Date().toISOString()} />
                <label className="flex gap-3 border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    disabled={workspaceDeleted || !draft}
                    className="mt-1"
                  />
                  <span>I confirm this content is approved for publication to the selected LinkedIn page.</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    mutate("Approve for LinkedIn", "/api/integrations/linkedin/review-state", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "approve", confirmed }),
                    })
                  }
                  disabled={!confirmed || Boolean(busy) || workspaceDeleted || !draft}
                  className="inline-flex w-full items-center justify-center gap-2 border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Approve for LinkedIn
                </button>
              </div>
            </div>
          </Section>

          <Section eyebrow="Step 7" title="Publish Or Safe Review Mode">
            <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <button
                  type="button"
                  onClick={() =>
                    mutate("Publish dry run", "/api/integrations/linkedin/posts/publish", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({}),
                    })
                  }
                  disabled={Boolean(busy) || workspaceDeleted || draft?.approvalStatus !== "approved"}
                  className="inline-flex items-center gap-2 border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ExternalLink className="h-4 w-4" />
                  Publish / API Review Dry Run
                </button>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Live posting is disabled unless the environment explicitly enables it and the connected token has the required Page permission. Dry run is visibly labelled and does not claim a live LinkedIn post was created.
                </p>
              </div>
              <div className="border border-white/10 bg-black/30 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300">
                  {publishResult?.mode === "live" ? "Live publish result" : "API Review Dry Run"}
                </p>
                <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-zinc-300">
                  {JSON.stringify(publishResult?.requestBody || state.dryRunPayload, null, 2)}
                </pre>
                {publishResult?.reason ? <p className="mt-3 text-sm text-amber-100/80">{publishResult.reason}</p> : null}
              </div>
            </div>
          </Section>

          <Section eyebrow="Step 8" title="Page Analytics">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-zinc-300">Connected page: {selectedPage}</p>
                <p className="text-sm text-zinc-500">Selected post: {selectedPost}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  mutate("Analytics refresh", "/api/integrations/linkedin/analytics/refresh", {
                    method: "POST",
                  })
                }
                disabled={Boolean(busy) || workspaceDeleted || !draft}
                className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-200 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh metrics
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              {["Impressions/views", "Clicks", "Reactions", "Comments", "Shares", "Engagement rate"].map((metric) => (
                <Field key={metric} label={metric} value="Pending access" />
              ))}
            </div>
            <p className="mt-4 border border-sky-400/15 bg-sky-400/5 p-4 text-sm leading-6 text-sky-100/80">
              {analyticsMessage}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Last refreshed: {state.analytics?.capturedAt || "Not refreshed yet"}
            </p>
          </Section>

          <Section eyebrow="Step 9" title="Privacy And Deletion Controls">
            <div className="grid gap-4 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => mutate("Disconnect LinkedIn", "/api/integrations/linkedin/disconnect", { method: "POST" })}
                disabled={Boolean(busy)}
                className="inline-flex items-center justify-center gap-2 border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200 disabled:opacity-50"
              >
                <Plug className="h-4 w-4" />
                Disconnect LinkedIn
              </button>
              <button
                type="button"
                onClick={() => mutate("Delete LinkedIn integration data", "/api/integrations/linkedin/delete-data", { method: "DELETE" })}
                disabled={Boolean(busy)}
                className="inline-flex items-center justify-center gap-2 border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete LinkedIn integration data
              </button>
              <button
                type="button"
                onClick={() => mutate("Reset Review Workspace", "/api/integrations/linkedin/reset-demo", { method: "POST" })}
                disabled={Boolean(busy)}
                className="inline-flex items-center justify-center gap-2 border border-sky-300/25 bg-sky-300/10 px-4 py-3 text-sm text-sky-100 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Review Workspace
              </button>
              <div className="inline-flex items-center justify-center gap-2 border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                <Database className="h-4 w-4" />
                Stored metadata visible below
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Stored metadata" value={`${state.connection.status}; scopes: ${state.connection.grantedScopes.join(", ") || "none"}`} />
              <Field label="Deletion scope" value="Tokens, page mapping, cached analytics snapshots, and LinkedIn review workspace test data." />
            </div>
          </Section>

          <Section eyebrow="Step 10" title="Reviewer Instructions">
            <div className="grid gap-4 lg:grid-cols-2">
              <p className="text-sm leading-6 text-zinc-300">
                Please verify that the reviewer account can access this workflow, connect LinkedIn through OAuth, inspect the selected organisation-page status, edit the approved content item, explicitly approve publication, run publishing or dry-run handling, refresh analytics status, disconnect, delete data, and view the audit trail.
              </p>
              <p className="flex gap-3 border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
                <Lock className="mt-1 h-4 w-4 shrink-0 text-amber-300" />
                The reviewer account is restricted to this workspace and must not expose admin controls, private customer data, billing, owner settings, raw OAuth payloads, or token records.
              </p>
            </div>
          </Section>

          <Section eyebrow="Step 11" title="Audit Trail">
            <div className="space-y-2">
              {state.auditTrail.length === 0 ? (
                <p className="text-sm text-zinc-500">No reviewer-safe audit events recorded yet.</p>
              ) : (
                state.auditTrail.map((event: ReviewState["auditTrail"][number]) => (
                  <div key={event.id} className="grid gap-2 border border-white/10 bg-black/20 p-3 text-sm md:grid-cols-[0.8fr_0.8fr_1fr_1.4fr]">
                    <span className="text-white">{event.eventType}</span>
                    <span className="text-zinc-400">{event.createdAt}</span>
                    <span className="text-zinc-400">{event.actor}</span>
                    <span className="break-words font-mono text-xs text-zinc-500">
                      {JSON.stringify(event.safeMetadata)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Section>

          <footer className="border-t border-white/10 py-8 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              LinkedIn Community Management API review workflow. No secrets are rendered in this page.
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
