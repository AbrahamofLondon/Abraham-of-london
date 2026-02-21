import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const BACKUP_DIR = path.join(ROOT, ".mdx-sanitize-backups");
const REPORT_PATH = path.join(ROOT, "mdx-sanitize-report.json");

/**
 * Generates a SHA-1 hash for buffer comparison
 */
function sha1(buf) {
  return crypto.createHash("sha1").update(buf).digest("hex");
}

/**
 * Sanitizes text to remove characters that commonly crash MDX tooling:
 * - BOM, NULL bytes, ASCII control chars, Unpaired surrogate halves
 */
function sanitizeText(input) {
  let s = input;

  // Remove BOM if present
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);

  // Remove NULL bytes
  s = s.replace(/\u0000/g, "");

  // Remove control chars (except tab/newline/cr)
  s = s.replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  // Remove unpaired surrogates
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    // high surrogate
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = s.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out.push(s[i], s[i + 1]);
        i++;
      }
      continue;
    }
    // low surrogate without a preceding high surrogate
    if (code >= 0xdc00 && code <= 0xdfff) continue;
    out.push(s[i]);
  }
  return out.join("");
}

function listMdxFiles(dir) {
  const results = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    if (!d || !fs.existsSync(d)) continue;
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && p.toLowerCase().endsWith(".mdx")) results.push(p);
    }
  }
  return results;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function backupFile(src, buf) {
  ensureDir(BACKUP_DIR);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dst = path.join(BACKUP_DIR, `${rel(src).replace(/\//g, "__")}__${stamp}.bak`);
  fs.writeFileSync(dst, buf);
  return dst;
}

function run() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`❌ content/ directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const files = listMdxFiles(CONTENT_DIR);
  const report = {
    scanned: files.length,
    changed: 0,
    unchanged: 0,
    errors: 0,
    files: [],
    createdAt: new Date().toISOString(),
  };

  console.log(`🔎 [HEAL CHECK]: Scanning ${files.length} MDX files with Integrity Guard...`);

  for (const file of files) {
    try {
      const originalBuf = fs.readFileSync(file);
      const originalHash = sha1(originalBuf);

      const originalText = originalBuf.toString("utf8");
      const cleanedText = sanitizeText(originalText);

      const cleanedBuf = Buffer.from(cleanedText, "utf8");
      const cleanedHash = sha1(cleanedBuf);

      if (cleanedHash !== originalHash) {
        // 🛡️ INTEGRITY GUARD: Detect and block HTML Entity Corruption
        // This prevents the script from saving if it detects functional tags have been escaped
        const corruptionDetected = /&lt;(Callout|Divider|Quote|Button|Grid|Image|Video)/i.test(cleanedText);

        if (corruptionDetected) {
          console.warn(`🛑 [INTEGRITY ALERT]: Corruption detected in ${rel(file)}. Refusing to save escaped entities.`);
          report.errors++;
          report.files.push({
            file: rel(file),
            status: "blocked",
            reason: "Illegal HTML entities found in functional tags"
          });
          continue;
        }

        const backup = backupFile(file, originalBuf);
        fs.writeFileSync(file, cleanedBuf);

        report.changed++;
        report.files.push({
          file: rel(file),
          status: "changed",
          backup: rel(backup),
          beforeBytes: originalBuf.length,
          afterBytes: cleanedBuf.length,
        });

        console.log(`✅ fixed: ${rel(file)} (backup: ${rel(backup)})`);
      } else {
        report.unchanged++;
      }
    } catch (err) {
      report.errors++;
      report.files.push({
        file: rel(file),
        status: "error",
        error: String(err?.message || err),
      });
      console.log(`❌ error: ${rel(file)} -> ${String(err?.message || err)}`);
    }
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
  console.log(`\n📄 Report: ${rel(REPORT_PATH)}`);
  console.log(`🏁 Done. changed=${report.changed}, unchanged=${report.unchanged}, blocked/errors=${report.errors}`);
}

run();