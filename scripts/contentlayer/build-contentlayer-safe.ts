import { spawnSync } from "node:child_process";

type Step = {
  title: string;
  cmd: string;
  args: string[];
};

function runStep(step: Step) {
  console.log(`\n▶ ${step.cmd} ${step.args.join(" ")}\n`);
  const res = spawnSync(step.cmd, step.args, {
    stdio: "inherit",
    shell: process.platform === "win32", // makes pnpm resolve correctly on Windows
    env: process.env,
  });

  if (res.status !== 0) {
    throw new Error(`Command failed: ${step.cmd} ${step.args.join(" ")}`);
  }
}

async function main() {
  console.log("========================================");
  console.log("🧱 Contentlayer SAFE BUILD RUNNER (v6)");
  console.log("========================================");

  const steps: Step[] = [
    // 1) Fix current blocking MDX structural errors
    { title: "Fix MDX acorn/JSX issues", cmd: "pnpm", args: ["exec", "tsx", "scripts/contentlayer/fix-mdx-acorn-errors.ts"] },

    // 2) Repair escaped &gt; inside tags ONLY (your existing tool)
    { title: "Repair escaped gt in tags", cmd: "pnpm", args: ["exec", "tsx", "scripts/contentlayer/repair-escaped-gt-in-tags.ts"] },

    // 3) Fix unclosed tags (your existing tool)
    { title: "Fix unclosed mdx tags", cmd: "pnpm", args: ["exec", "tsx", "scripts/contentlayer/fix-unclosed-mdx-tags.ts"] },

    // 4) Sanitizer v2 (text-only, JSX-safe)
    { title: "Sanitize MDX v2", cmd: "pnpm", args: ["exec", "tsx", "scripts/contentlayer/sanitize-mdx-v2.ts"] },

    // 5) Contentlayer build
    { title: "Contentlayer build", cmd: "pnpm", args: ["exec", "contentlayer2", "build", "--clearCache"] },
  ];

  for (const s of steps) runStep(s);

  console.log("\n✅ SAFE BUILD COMPLETE");
  console.log("========================================");
}

main().catch((err) => {
  console.error("\n❌ BUILD FAILED:");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});