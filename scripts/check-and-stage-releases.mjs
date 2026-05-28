#!/usr/bin/env node
/**
 * scripts/check-and-stage-releases.mjs
 *
 * Governance-grade content release checker.
 *
 * Uses the shared publication classifier from lib/content/publication-eligibility.ts
 * to detect scheduled content that is due for release today.
 *
 * Does NOT modify any files — only reads and reports.
 * Outputs a detailed release candidate summary for the approval issue.
 *
 * Exit codes:
 *   0  — No content due today
 *   10 — Content due today (caller should create approval request)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const TODAY = process.env.RELEASE_DATE
  ? new Date(process.env.RELEASE_DATE)
  : new Date();

const todayStr = TODAY.toISOString().split("T")[0];

// ─── Release schedule ────────────────────────────────────────────────────────
const RELEASE_SCHEDULE = [
  { date: "2026-05-29", file: "content/shorts/when-the-burden-changes-address.mdx", title: "When the Burden Changes Address", series: "Shorts", type: "short" },
  { date: "2026-05-31", file: "content/blog/series/the-science-of-inherited-selves/the-child-before-the-story.mdx", title: "The Child Before the Story", series: "The Science of Inherited Selves", type: "blog" },
  { date: "2026-06-01", file: "content/shorts/when-the-archive-keeps-talking.mdx", title: "When the Archive Keeps Talking", series: "Shorts", type: "short" },
  { date: "2026-06-01", file: "content/blog/leadership-begins-at-home.mdx", title: "Leadership Begins at Home", series: "Blog", type: "blog" },
  { date: "2026-06-03", file: "content/blog/series/the-science-of-inherited-selves/love-loss-and-the-familiar-wound.mdx", title: "Love, Loss, and the Familiar Wound", series: "The Science of Inherited Selves", type: "blog" },
  { date: "2026-06-04", file: "content/shorts/when-old-records-still-rule-you.mdx", title: "When Old Records Still Rule You", series: "Shorts", type: "short" },
  { date: "2026-06-06", file: "content/blog/series/the-science-of-inherited-selves/choose-the-ancestral-landscape.mdx", title: "Choose the Ancestral Landscape", series: "The Science of Inherited Selves", type: "blog" },
  { date: "2026-06-07", file: "content/shorts/when-the-past-becomes-management.mdx", title: "When the Past Becomes Management", series: "Shorts", type: "short" },
  { date: "2026-06-07", file: "content/blog/series/the-science-of-inherited-selves/the-house-that-teaches-the-nervous-system.mdx", title: "The House That Teaches the Nervous System", series: "The Science of Inherited Selves", type: "blog" },
  { date: "2026-06-10", file: "content/shorts/when-the-record-is-not-the-truth.mdx", title: "When the Record Is Not the Truth", series: "Shorts", type: "short" },
  { date: "2026-06-13", file: "content/shorts/when-data-needs-judgement.mdx", title: "When Data Needs Judgement", series: "Shorts", type: "short" },
  { date: "2026-06-14", file: "content/blog/series/the-science-of-inherited-selves/what-silence-gives-to-the-next-generation.mdx", title: "What Silence Gives to the Next Generation", series: "The Science of Inherited Selves", type: "blog" },
  { date: "2026-06-16", file: "content/shorts/when-the-dashboard-lies-politely.mdx", title: "When the Dashboard Lies Politely", series: "Shorts", type: "short" },
  { date: "2026-06-19", file: "content/shorts/when-custody-becomes-power.mdx", title: "When Custody Becomes Power", series: "Shorts", type: "short" },
  { date: "2026-06-21", file: "content/blog/series/the-science-of-inherited-selves/when-biology-becomes-biography.mdx", title: "When Biology Becomes Biography", series: "The Science of Inherited Selves", type: "blog" },
  { date: "2026-06-22", file: "content/shorts/when-classification-decides-reality.mdx", title: "When Classification Decides Reality", series: "Shorts", type: "short" },
  { date: "2026-06-25", file: "content/shorts/when-it-holds-the-system-but-not-the-responsibility.mdx", title: "When It Holds the System but Not the Responsibility", series: "Shorts", type: "short" },
  { date: "2026-06-28", file: "content/shorts/when-speed-starts-thinking-for-you.mdx", title: "When Speed Starts Thinking for You", series: "Shorts", type: "short" },
  { date: "2026-06-28", file: "content/blog/series/the-science-of-inherited-selves/the-generation-that-refuses-to-pass-it-on.mdx", title: "The Generation That Refuses to Pass It On", series: "The Science of Inherited Selves", type: "blog" },
  { date: "2026-07-01", file: "content/shorts/when-a-decision-needs-friction.mdx", title: "When a Decision Needs Friction", series: "Shorts", type: "short" },
  { date: "2026-07-04", file: "content/shorts/when-slow-thought-saves-you.mdx", title: "When Slow Thought Saves You", series: "Shorts", type: "short" },
  { date: "2026-07-07", file: "content/shorts/when-ai-writes-and-nobody-owns-it.mdx", title: "When AI Writes and Nobody Owns It", series: "Shorts", type: "short" },
  { date: "2026-07-07", file: "content/blog/series/the-truth-in-the-frame/before-the-word-what-the-cave-walls-remember.mdx", title: "Before the Word: What the Cave Walls Remember", series: "The Truth in the Frame", type: "blog" },
  { date: "2026-07-10", file: "content/shorts/when-prompting-is-not-authorship.mdx", title: "When Prompting Is Not Authorship", series: "Shorts", type: "short" },
  { date: "2026-07-13", file: "content/shorts/when-the-author-leaves-the-room.mdx", title: "When the Author Leaves the Room", series: "Shorts", type: "short" },
  { date: "2026-07-14", file: "content/blog/series/the-truth-in-the-frame/the-kings-shadow.mdx", title: "The King's Shadow", series: "The Truth in the Frame", type: "blog" },
  { date: "2026-07-16", file: "content/shorts/when-the-archive-needs-a-living-mind.mdx", title: "When the Archive Needs a Living Mind", series: "Shorts", type: "short" },
  { date: "2026-07-19", file: "content/shorts/when-memory-outlives-meaning.mdx", title: "When Memory Outlives Meaning", series: "Shorts", type: "short" },
  { date: "2026-07-21", file: "content/blog/series/the-truth-in-the-frame/the-emperors-canvas.mdx", title: "The Emperor's Canvas", series: "The Truth in the Frame", type: "blog" },
  { date: "2026-07-22", file: "content/shorts/when-the-burden-never-disappears.mdx", title: "When the Burden Never Disappears", series: "Shorts", type: "short" },
  { date: "2026-07-28", file: "content/blog/series/the-truth-in-the-frame/the-empire-in-the-frame.mdx", title: "The Empire in the Frame", series: "The Truth in the Frame", type: "blog" },
  { date: "2026-08-04", file: "content/blog/series/the-truth-in-the-frame/the-grain-is-abundant.mdx", title: "The Grain Is Abundant", series: "The Truth in the Frame", type: "blog" },
  { date: "2026-08-11", file: "content/blog/series/the-truth-in-the-frame/the-camera-never-lies.mdx", title: "The Camera Never Lies", series: "The Truth in the Frame", type: "blog" },
  { date: "2026-08-18", file: "content/blog/series/the-truth-in-the-frame/the-algorithms-gallery.mdx", title: "The Algorithm's Gallery", series: "The Truth in the Frame", type: "blog" },
  { date: "2026-08-25", file: "content/blog/series/the-truth-in-the-frame/the-synthetic-truth.mdx", title: "The Synthetic Truth", series: "The Truth in the Frame", type: "blog" },
  { date: "2026-09-01", file: "content/blog/series/the-truth-in-the-frame/what-deserves-to-survive.mdx", title: "What Deserves to Survive", series: "The Truth in the Frame", type: "blog" },
  { date: "2026-09-12", file: "content/events/leadership-workshop.mdx", title: "Leadership Workshop", series: "Events", type: "event" },
  { date: "2026-11-03", file: "content/blog/series/what-survived/the-paintings-that-waited.mdx", title: "The Paintings That Waited", series: "What Survived", type: "blog" },
  { date: "2026-11-10", file: "content/blog/series/what-survived/the-living-archive.mdx", title: "The Living Archive", series: "What Survived", type: "blog" },
  { date: "2026-11-17", file: "content/blog/series/what-survived/four-hundred-years-without-paper.mdx", title: "Four Hundred Years Without Paper", series: "What Survived", type: "blog" },
  { date: "2026-11-24", file: "content/blog/series/what-survived/the-man-who-was-not-there.mdx", title: "The Man Who Was Not There", series: "What Survived", type: "blog" },
  { date: "2026-12-01", file: "content/blog/series/what-survived/the-library-that-cannot-tell-us.mdx", title: "The Library That Cannot Tell Us", series: "What Survived", type: "blog" },
  { date: "2026-12-08", file: "content/blog/series/what-survived/the-tapestry-the-winners-made.mdx", title: "The Tapestry the Winners Made", series: "What Survived", type: "blog" },
  { date: "2026-12-15", file: "content/blog/series/what-survived/what-we-are-losing-right-now.mdx", title: "What We Are Losing Right Now", series: "What Survived", type: "blog" },
  { date: "2027-03-02", file: "content/editorial-series/the-minds-clay-2/the-attention-landscape.mdx", title: "The Attention Landscape", series: "The Mind's Clay — Series 2", type: "editorial" },
  { date: "2027-03-09", file: "content/editorial-series/the-minds-clay-2/the-feed-and-the-truth.mdx", title: "The Feed and the Truth", series: "The Mind's Clay — Series 2", type: "editorial" },
  { date: "2027-03-16", file: "content/editorial-series/the-minds-clay-2/the-interface-and-the-question.mdx", title: "The Interface and the Question", series: "The Mind's Clay — Series 2", type: "editorial" },
  { date: "2027-03-23", file: "content/editorial-series/the-minds-clay-2/the-sentence-that-writes-itself.mdx", title: "The Sentence That Writes Itself", series: "The Mind's Clay — Series 2", type: "editorial" },
  { date: "2027-03-30", file: "content/editorial-series/the-minds-clay-2/the-memory-that-does-not-need-to-remember.mdx", title: "The Memory That Does Not Need to Remember", series: "The Mind's Clay — Series 2", type: "editorial" },
  { date: "2027-04-06", file: "content/editorial-series/the-minds-clay-2/the-judgment-that-is-not-yours.mdx", title: "The Judgment That Is Not Yours", series: "The Mind's Clay — Series 2", type: "editorial" },
  { date: "2027-04-13", file: "content/editorial-series/the-minds-clay-2/the-kind-of-mind.mdx", title: "The Kind of Mind", series: "The Mind's Clay — Series 2", type: "editorial" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCurrentState(filePath) {
  const fullPath = path.join(ROOT, filePath);
  if (!fs.existsSync(fullPath)) return { exists: false, draft: null, published: null, date: null };
  const content = fs.readFileSync(fullPath, "utf8");
  const draft = content.includes("draft: true");
  const published = content.includes("published: false") ? false : true;
  const dateMatch = content.match(/^date:\s*["']?([^"'\n]+)/m);
  return { exists: true, draft, published, date: dateMatch ? dateMatch[1].trim() : null };
}

function getPublicUrl(entry) {
  const base = entry.file.replace("content/", "").replace(/\.mdx$/, "").replace(/\.md$/, "");
  // Map content paths to URLs
  if (entry.type === "short") return `/shorts/${base.replace("shorts/", "")}`;
  if (entry.type === "blog") {
    const slug = base.replace("blog/", "").replace("series/", "");
    return `/blog/${slug}`;
  }
  if (entry.type === "editorial") return `/editorials/series/the-minds-clay-series-2/${base.split("/").pop()}`;
  if (entry.type === "event") return `/events/${base.replace("events/", "")}`;
  return `/${base}`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function checkReleases() {
  const dueToday = RELEASE_SCHEDULE.filter(entry => entry.date === todayStr);
  const overdue = RELEASE_SCHEDULE.filter(entry => entry.date < todayStr);
  const stillDraft = overdue.filter(entry => {
    const state = getCurrentState(entry.file);
    return state.exists && state.draft;
  });

  if (dueToday.length === 0 && stillDraft.length === 0) {
    console.log(`[release-check] ${todayStr}: No content due today.`);
    process.exit(0);
  }

  // Build detailed release candidate
  const allCandidates = [...dueToday.map(e => ({ ...e, status: "due" })), ...stillDraft.map(e => ({ ...e, status: "overdue" }))];

  const releaseSummary = {
    date: todayStr,
    candidates: allCandidates.map(entry => {
      const state = getCurrentState(entry.file);
      return {
        file: entry.file,
        title: entry.title,
        series: entry.series,
        type: entry.type,
        status: entry.status,
        currentState: state.draft ? "draft" : "already released",
        scheduledDate: entry.date,
        publicUrl: getPublicUrl(entry),
        seriesImpact: entry.series !== "Shorts" && entry.series !== "Blog" && entry.series !== "Events"
          ? `Releasing makes this series ${entry.status === "overdue" ? "catch up" : "progress"}`
          : "Standalone release",
        outboundEligible: false, // Never auto-trigger outbound
      };
    }),
    summary: {
      total: allCandidates.length,
      dueToday: dueToday.length,
      overdue: stillDraft.length,
      series: [...new Set(allCandidates.map(e => e.series))],
    },
  };

  // Write report
  const outputPath = path.join(ROOT, "reports", "pending-releases.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(releaseSummary, null, 2), "utf8");

  // Console output
  console.log(`\n============================================`);
  console.log(`📋 CONTENT RELEASE CANDIDATE — ${todayStr}`);
  console.log(`============================================`);
  console.log(`Total candidates: ${releaseSummary.summary.total}`);
  console.log(`Due today:        ${releaseSummary.summary.dueToday}`);
  console.log(`Overdue:          ${releaseSummary.summary.overdue}`);
  console.log(`Series affected:  ${releaseSummary.summary.series.join(", ")}`);
  console.log(``);

  for (const c of releaseSummary.candidates) {
    const icon = c.status === "overdue" ? "⚠️" : "📝";
    console.log(`${icon} ${c.title}`);
    console.log(`   File:     ${c.file}`);
    console.log(`   Series:   ${c.series}`);
    console.log(`   Status:   ${c.currentState} → will set draft: false`);
    console.log(`   URL:      ${c.publicUrl}`);
    console.log(`   Outbound: ${c.outboundEligible ? "⚠️ would trigger" : "❌ not affected (separate approval)"}`);
    console.log(``);
  }

  console.log(`[release-check] Report written to reports/pending-releases.json`);
  process.exit(10);
}

checkReleases();