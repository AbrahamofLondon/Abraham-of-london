import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MAP = [
  { dir: "content/blog", type: "Post" },
  { dir: "content/books", type: "Book" },
  { dir: "content/events", type: "Event" },
  { dir: "content/resources", type: "Resource" },
  { dir: "content/strategy", type: "Strategy" },
  { dir: "content/downloads", type: "Download" },
];

const MDLIKE = new Set([".md", ".mdx", ".markdown"]);

function list(dir) {
  const out = [];
  const st = [dir];
  while (st.length) {
    const d = st.pop();
    if (!d || !fs.existsSync(d)) continue;
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) st.push(p);
      else out.push(p);
    }
  }
  return out;
}

function fixFile(p, wantedType, ensureKind) {
  const ext = path.extname(p).toLowerCase();
  if (!MDLIKE.has(ext)) return false;
  const raw = fs.readFileSync(p, "utf8");
  const m = raw.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!m) return false;

  let fm = m[1];
  const body = m[2] ?? "";

  // Normalize type (capitalize to match schema)
  if (!/^type\s*:/m.test(fm)) {
    fm = `type: "${wantedType}"\n${fm}`;
  } else {
    fm = fm.replace(
      /^(\s*)type\s*:\s*"?([A-Za-z]+)"?/m,
      (_, $1) => `${$1}type: "${wantedType}"`,
    );
  }

  // Downloads also need a `kind` string; add if missing
  if (ensureKind) {
    if (!/^kind\s*:/m.test(fm)) {
      fm = `kind: "template"\n${fm}`;
    }
  }

  // Do NOT convert `kind` -> `type`. Keep both if present.

  const rebuilt = `---\n${fm.trimEnd()}\n---\n\n${body}`;
  if (rebuilt !== raw) {
    fs.writeFileSync(p, rebuilt, "utf8");
    console.log("✔ FM fixed:", p);
    return true;
  }
  return false;
}

let changed = 0;
for (const { dir, type } of MAP) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) continue;
  for (const p of list(full)) {
    changed += +fixFile(p, type, dir.includes("downloads"));
  }
}
console.log(`\nDone. Files updated: ${changed}`);
