#!/usr/bin/env node
/**
 * scripts/check-and-stage-releases.mjs
 *
 * Checks if any scheduled content is due for release today.
 * If so, outputs a summary for CI to create an approval issue.
 *
 * Designed to be run by a GitHub Actions cron workflow.
 * Does NOT modify any files — only reads and reports.
 *
 * Exit codes:
 *   0 — No content due today
 *   10 — Content due today (caller should create approval request)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Use system date or override for testing
const TODAY = process.env.RELEASE_DATE
  ? new Date(process.env.RELEASE_DATE)
  : new Date();

const todayStr = TODAY.toISOString().split("T")[0];

// ─── Release schedule ────────────────────────────────────────────────────────
// Each entry: { date, file, title, series }
const RELEASE_SCHEDULE = [
  // Shorts
  { date: "2026-05-29", file: "content/shorts/when-the-burden-changes-address.mdx", title: "When the Burden Changes Address", series: "Shorts" },
  { date: "2026-06-01", file: "content/shorts/when-the-archive-keeps-talking.mdx", title: "When the Archive Keeps Talking", series: "Shorts" },
  { date: "2026-06-01", file: "content/blog/leadership-begins-at-home.mdx", title: "Leadership Begins at Home", series: "Blog" },
  { date: "2026-06-04", file: "content/shorts/when-old-records-still-rule-you.mdx", title: "When Old Records Still Rule You", series: "Shorts" },
  { date: "2026-06-07", file: "content/shorts/when-the-past-becomes-management.mdx", title: "When the Past Becomes Management", series: "Shorts" },
  { date: "2026-06-10", file: "content/shorts/when-the-record-is-not-the-truth.mdx", title: "When the Record Is Not the Truth", series: "Shorts" },
  { date: "2026-06-13", file: "content/shorts/when-data-needs-judgement.mdx", title: "When Data Needs Judgement", series: "Shorts" },
  { date: "2026-06-16", file: "content/shorts/when-the-dashboard-lies-politely.mdx", title: "When the Dashboard Lies Politely", series: "Shorts" },
  { date: "2026-06-19", file: "content/shorts/when-custody-becomes-power.mdx", title: "When Custody Becomes Power", series: "Shorts" },
  { date: "2026-06-22", file: "content/shorts/when-classification-decides-reality.mdx", title: "When Classification Decides Reality", series: "Shorts" },
  { date: "2026-06-25", file: "content/shorts/when-it-holds-the-system-but-not-the-responsibility.mdx", title: "When It Holds the System but Not the Responsibility", series: "Shorts" },
  { date: "2026-06-28", file: "content/shorts/when-speed-starts-thinking-for-you.mdx", title: "When Speed Starts Thinking for You", series: "Shorts" },
  { date: "2026-07-01", file: "content/shorts/when-a-decision-needs-friction.mdx", title: "When a Decision Needs Friction", series: "Shorts" },
  { date: "2026-07-04", file: "content/shorts/when-slow-thought-saves-you.mdx", title: "When Slow Thought Saves You", series: "Shorts" },
  { date: "2026-07-07", file: "content/shorts/when-ai-writes-and-nobody-owns-it.mdx", title: "When AI Writes and Nobody Owns It", series: "Shorts" },
  { date: "2026-07-10", file: "content/shorts/when-prompting-is-not-authorship.mdx", title: "When Prompting Is Not Authorship", series: "Shorts" },
  { date: "2026-07-13", file: "content/shorts/when-the-author-leaves-the-room.mdx", title: "When the Author Leaves the Room", series: "Shorts" },
  { date: "2026-07-16", file: "content/shorts/when-the-archive-needs-a-living-mind.mdx", title: "When the Archive Needs a Living Mind", series: "Shorts" },
  { date: "2026-07-19", file: "content/shorts/when-memory-outlives-meaning.mdx", title: "When Memory Outlives Meaning", series: "Shorts" },
  { date: "2026-07-22", file: "content/shorts/when-the-burden-never-disappears.mdx", title: "When the Burden Never Disappears", series: "Shorts" },

  // The Science of Inherited Selves
  { date: "2026-05-31", file: "content/blog/series/the-science-of-inherited-selves/the-child-before-the-story.mdx", title: "The Child Before the Story", series: "The Science of Inherited Selves" },
  { date: "2026-06-03", file: "content/blog/series/the-science-of-inherited-selves/love-loss-and-the-familiar-wound.mdx", title: "Love, Loss, and the Familiar Wound", series: "The Science of Inherited Selves" },
  { date: "2026-06-06", file: "content/blog/series/the-science-of-inherited-selves/choose-the-ancestral-landscape.mdx", title: "Choose the Ancestral Landscape", series: "The Science of Inherited Selves" },
  { date: "2026-06-07", file: "content/blog/series/the-science-of-inherited-selves/the-house-that-teaches-the-nervous-system.mdx", title: "The House That Teaches the Nervous System", series: "The Science of Inherited Selves" },
  { date: "2026-06-14", file: "content/blog/series/the-science-of-inherited-selves/what-silence-gives-to-the-next-generation.mdx", title: "What Silence Gives to the Next Generation", series: "The Science of Inherited Selves" },
  { date: "2026-06-21", file: "content/blog/series/the-science-of-inherited-selves/when-biology-becomes-biography.mdx", title: "When Biology Becomes Biography", series: "The Science of Inherited Selves" },
  { date: "2026-06-28", file: "content/blog/series/the-science-of-inherited-selves/the-generation-that-refuses-to-pass-it-on.mdx", title: "The Generation That Refuses to Pass It On", series: "The Science of Inherited Selves" },

  // The Truth in the Frame
  { date: "2026-07-07", file: "content/blog/series/the-truth-in-the-frame/before-the-word-what-the-cave-walls-remember.mdx", title: "Before the Word: What the Cave Walls Remember", series: "The Truth in the Frame" },
  { date: "2026-07-14", file: "content/blog/series/the-truth-in-the-frame/the-kings-shadow.mdx", title: "The King's Shadow: How Writing and Monumental Art Created Official Memory", series: "The Truth in the Frame" },
  { date: "2026-07-21", file: "content/blog/series/the-truth-in-the-frame/the-emperors-canvas.mdx", title: "The Emperor's Canvas: Napoleon and the Invention of Modern Propaganda", series: "The Truth in the Frame" },
  { date: "2026-07-28", file: "content/blog/series/the-truth-in-the-frame/the-empire-in-the-frame.mdx", title: "The Empire in the Frame: How Britain Painted Its Colonies", series: "The Truth in the Frame" },
  { date: "2026-08-04", file: "content/blog/series/the-truth-in-the-frame/the-grain-is-abundant.mdx", title: "The Grain Is Abundant: Socialist Realism and the Manufacture of Utopia", series: "The Truth in the Frame" },
  { date: "2026-08-11", file: "content/blog/series/the-truth-in-the-frame/the-camera-never-lies.mdx", title: "The Camera Never Lies (But the Photographer Can)", series: "The Truth in the Frame" },
  { date: "2026-08-18", file: "content/blog/series/the-truth-in-the-frame/the-algorithms-gallery.mdx", title: "The Algorithm's Gallery: The Handprint That No One Pressed", series: "The Truth in the Frame" },
  { date: "2026-08-25", file: "content/blog/series/the-truth-in-the-frame/the-synthetic-truth.mdx", title: "The Synthetic Truth: When Seeing Is No Longer Believing", series: "The Truth in the Frame" },
  { date: "2026-09-01", file: "content/blog/series/the-truth-in-the-frame/what-deserves-to-survive.mdx", title: "What Deserves to Survive", series: "The Truth in the Frame" },

  // Events
  { date: "2026-09-12", file: "content/events/leadership-workshop.mdx", title: "Leadership Workshop", series: "Events" },

  // What Survived
  { date: "2026-11-03", file: "content/blog/series/what-survived/the-paintings-that-waited.mdx", title: "The Paintings That Waited Thirty-Six Thousand Years", series: "What Survived" },
  { date: "2026-11-10", file: "content/blog/series/what-survived/the-living-archive.mdx", title: "The Living Archive: What the Griot Kept", series: "What Survived" },
  { date: "2026-11-17", file: "content/blog/series/what-survived/four-hundred-years-without-paper.mdx", title: "Four Hundred Years Without Paper: The Iliad Remembers", series: "What Survived" },
  { date: "2026-11-24", file: "content/blog/series/what-survived/the-man-who-was-not-there.mdx", title: "The Man Who Was Not There: Stalin Erases Yezhov", series: "What Survived" },
  { date: "2026-12-01", file: "content/blog/series/what-survived/the-library-that-cannot-tell-us.mdx", title: "The Library That Cannot Tell Us What It Lost", series: "What Survived" },
  { date: "2026-12-08", file: "content/blog/series/what-survived/the-tapestry-the-winners-made.mdx", title: "The Tapestry the Winners Made", series: "What Survived" },
  { date: "2026-12-15", file: "content/blog/series/what-survived/what-we-are-losing-right-now.mdx", title: "What We Are Losing Right Now", series: "What Survived" },

  // The Mind's Clay — Series 2
  { date: "2027-03-02", file: "content/editorial-series/the-minds-clay-2/the-attention-landscape.mdx", title: "The Attention Landscape", series: "The Mind's Clay — Series 2" },
  { date: "2027-03-09", file: "content/editorial-series/the-minds-clay-2/the-feed-and-the-truth.mdx", title: "The Feed and the Truth", series: "The Mind's Clay — Series 2" },
  { date: "2027-03-16", file: "content/editorial-series/the-minds-clay-2/the-interface-and-the-question.mdx", title: "The Interface and the Question", series: "The Mind's Clay — Series 2" },
  { date: "2027-03-23", file: "content/editorial-series/the-minds-clay-2/the-sentence-that-writes-itself.mdx", title: "The Sentence That Writes Itself", series: "The Mind's Clay — Series 2" },
  { date: "2027-03-30", file: "content/editorial-series/the-minds-clay-2/the-memory-that-does-not-need-to-remember.mdx", title: "The Memory That Does Not Need to Remember", series: "The Mind's Clay — Series 2" },
  { date: "2027-04-06", file: "content/editorial-series/the-minds-clay-2/the-judgment-that-is-not-yours.mdx", title: "The Judgment That Is Not Yours", series: "The Mind's Clay — Series 2" },
  { date: "2027-04-13", file: "content/editorial-series/the-minds-clay-2/the-kind-of-mind.mdx", title: "The Kind of Mind", series: "The Mind's Clay — Series 2" },
];

// ─── Main ────────────────────────────────────────────────────────────────────

function checkReleases() {
  const dueToday = RELEASE_SCHEDULE.filter(entry => entry.date === todayStr);
  const overdue = RELEASE_SCHEDULE.filter(entry => entry.date < todayStr);

  // Check if overdue items are still draft (not yet released)
  const stillDraft = overdue.filter(entry => {
    const fullPath = path.join(ROOT, entry.file);
    if (!fs.existsSync(fullPath)) return false;
    const content = fs.readFileSync(fullPath, "utf8");
    return content.includes("draft: true");
  });

  if (dueToday.length === 0 && stillDraft.length === 0) {
    console.log(`[release-check] ${todayStr}: No content due today.`);
    process.exit(0);
  }

  console.log(`[release-check] ${todayStr}: Content due for release!\n`);

  if (dueToday.length > 0) {
    console.log("=== DUE TODAY ===");
    for (const entry of dueToday) {
      const fullPath = path.join(ROOT, entry.file);
      const isDraft = fs.existsSync(fullPath)
        ? fs.readFileSync(fullPath, "utf8").includes("draft: true")
        : "FILE NOT FOUND";
      console.log(`  📝 ${entry.title}`);
      console.log(`     Series: ${entry.series}`);
      console.log(`     File: ${entry.file}`);
      console.log(`     Status: ${isDraft ? "draft (needs release)" : "already released"}`);
      console.log("");
    }
  }

  if (stillDraft.length > 0) {
    console.log("=== OVERDUE (still in draft) ===");
    for (const entry of stillDraft) {
      console.log(`  ⚠️  ${entry.title} (was due ${entry.date})`);
      console.log(`     File: ${entry.file}`);
      console.log("");
    }
  }

  // Output JSON for GitHub Actions
  const output = {
    date: todayStr,
    dueToday: dueToday.map(e => ({ file: e.file, title: e.title, series: e.series })),
    overdue: stillDraft.map(e => ({ file: e.file, title: e.title, series: e.series, dueDate: e.date })),
  };

  const outputPath = path.join(ROOT, "reports", "pending-releases.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

  console.log(`[release-check] Report written to reports/pending-releases.json`);
  process.exit(10); // Exit code 10 signals "content due"
}

checkReleases();
