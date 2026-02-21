import fs from "fs";
import path from "path";

type FixResult = {
  file: string;
  changed: boolean;
  removedOrphanClosings: number;
  insertedClosings: number;
};

const TARGET_FILES = [
  "content/blog/fathering-principles.mdx",
  "content/blog/in-my-fathers-house.mdx",
  "content/blog/principles-for-my-son.mdx",
];

function read(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath: string, content: string) {
  fs.writeFileSync(filePath, content, "utf8");
}

function normalizeNewlines(s: string) {
  return s.replace(/\r\n/g, "\n");
}

/**
 * Fix logic:
 * 1) Remove orphan </Note> lines when there is no open <Note ...> remaining.
 * 2) For each <Note ...> that is not self-closing and has no corresponding </Note>,
 *    insert </Note> at the end of the same paragraph block (best-effort).
 *
 * This is conservative: it only touches explicit <Note ...> and </Note> tokens.
 */
function fixNoteBalance(content: string): { fixed: string; removed: number; inserted: number } {
  let s = normalizeNewlines(content);

  let removedOrphans = 0;
  let insertedClosings = 0;

  const lines = s.split("\n");

  // Pass 1: count openings/closings
  const openingIdxs: number[] = [];
  const closingIdxs: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Opening <Note ...> (not self-closing)
    if (/<Note\b[^>]*>/.test(line) && !/<Note\b[^>]*\/>/.test(line)) openingIdxs.push(i);
    if (/<\/Note>/.test(line)) closingIdxs.push(i);
  }

  // If there are more closings than openings, remove orphan closings from top-down
  // until counts balance.
  let openCount = openingIdxs.length;
  let closeCount = closingIdxs.length;

  if (closeCount > openCount) {
    const toRemove = closeCount - openCount;
    let removed = 0;

    for (let i = 0; i < lines.length && removed < toRemove; i++) {
      // Only remove a line that is JUST a closing tag (or whitespace + closing)
      if (/^\s*<\/Note>\s*$/.test(lines[i])) {
        lines[i] = ""; // delete line
        removed++;
        removedOrphans++;
      }
    }
  }

  // Recompute after orphan removal
  const s1 = lines.filter((ln) => ln !== "").join("\n");
  const lines1 = s1.split("\n");

  // Pass 2: insert missing closing tags for openings that don't close.
  // We will scan, pushing on open, popping on close.
  const stack: number[] = [];
  const out: string[] = [];

  for (let i = 0; i < lines1.length; i++) {
    const line = lines1[i];

    const isOpen = /<Note\b[^>]*>/.test(line) && !/<Note\b[^>]*\/>/.test(line);
    const isClose = /<\/Note>/.test(line);

    if (isOpen) stack.push(out.length);
    out.push(line);

    if (isClose && stack.length > 0) stack.pop();
  }

  // If stack not empty => there are openings with no closing.
  // Insert </Note> after the block in a conservative way:
  // - If opening line contains content after '>' on same line, close at end of that line (wrap)
  // - Else close at the next blank line or next JSX block boundary.
  if (stack.length > 0) {
    // We'll do a second pass with positional insertion.
    const out2: string[] = [];
    const openStack: { outIndex: number }[] = [];

    for (let i = 0; i < out.length; i++) {
      const line = out[i];
      const isOpen = /<Note\b[^>]*>/.test(line) && !/<Note\b[^>]*\/>/.test(line);
      const isClose = /<\/Note>/.test(line);

      if (isOpen) openStack.push({ outIndex: out2.length });

      out2.push(line);

      if (isClose && openStack.length > 0) openStack.pop();

      // If we are inside a Note and we hit a blank line, close before the blank line
      // (common structure: <Note ...>text...</Note> then blank).
      if (openStack.length > 0 && /^\s*$/.test(line)) {
        // close BEFORE the blank line we just pushed
        out2.splice(out2.length - 1, 0, "</Note>");
        insertedClosings++;
        openStack.pop(); // close one note
      }
    }

    // If still open notes, close at end of file
    while (openStack.length > 0) {
      out2.push("</Note>");
      insertedClosings++;
      openStack.pop();
    }

    return { fixed: out2.join("\n"), removed: removedOrphans, inserted: insertedClosings };
  }

  return { fixed: s1, removed: removedOrphans, inserted: insertedClosings };
}

function main() {
  console.log("========================================");
  console.log("🧩 FIX: <Note> TAG BALANCE (orphan </Note>, missing </Note>)");
  console.log("========================================");

  const results: FixResult[] = [];

  for (const rel of TARGET_FILES) {
    const abs = path.resolve(process.cwd(), rel);
    if (!fs.existsSync(abs)) {
      console.log(`⏭️  ${rel} (missing)`);
      continue;
    }

    const before = read(abs);
    const { fixed, removed, inserted } = fixNoteBalance(before);
    const changed = fixed !== before;

    if (changed) write(abs, fixed);

    results.push({
      file: rel,
      changed,
      removedOrphanClosings: removed,
      insertedClosings: inserted,
    });

    const mark = changed ? "✅" : "⏭️ ";
    console.log(
      `${mark} ${rel}  (removed orphan </Note>: ${removed}, inserted </Note>: ${inserted})`
    );
  }

  const changedCount = results.filter((r) => r.changed).length;
  const removedTotal = results.reduce((a, r) => a + r.removedOrphanClosings, 0);
  const insertedTotal = results.reduce((a, r) => a + r.insertedClosings, 0);

  console.log("----------------------------------------");
  console.log(`Files processed: ${results.length}`);
  console.log(`Files changed:   ${changedCount}`);
  console.log(`Orphans removed: ${removedTotal}`);
  console.log(`Closings added:  ${insertedTotal}`);
  console.log("========================================");
}

main();