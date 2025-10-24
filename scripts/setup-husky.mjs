// scripts/setup-husky.mjs
// Creates a Husky pre-commit hook that blocks bad slash-opacity before commit.
import fs from "fs";
import path from "path";

const root = process.cwd();
const huskyDir = path.join(root, '.husky');
const hook = path.join(huskyDir, 'pre-commit');

if (!fs.existsSync(huskyDir)) fs.mkdirSync(huskyDir, { recursive: true });

// Git Bash script (works cross-platform when committing)
const script = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "⏳ Running Tailwind slash-opacity checks..."
node scripts/convert-tailwind-slash-opacity.mjs --check || exit 1
node scripts/postcss-guard-dryrun.mjs || exit 1
echo "✅ Checks passed."
`;

if (!fs.existsSync(path.join(huskyDir, '_'))) {
  // minimal shim so husky.sh exists; compatible with husky v9 init layout
  fs.mkdirSync(path.join(huskyDir, '_'), { recursive: true });
  fs.writeFileSync(path.join(huskyDir, '_/.gitignore'), '*\n', 'utf8');
  fs.writeFileSync(path.join(huskyDir, '_/husky.sh'),
`#!/usr/bin/env sh
# Husky minimal shim for CI/editor environments
command -v sh >/dev/null 2>&1 || { echo >&2 "sh required for husky hooks."; exit 1; }
`, 'utf8');
}

fs.writeFileSync(hook, script, { encoding: 'utf8', mode: 0o755 });
console.log('✔ Husky pre-commit hook installed: .husky/pre-commit');
