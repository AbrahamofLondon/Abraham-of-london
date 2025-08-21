// scripts/check-env.ts
/* eslint-disable no-console */

type Rule = {
  key: string;
  required?: boolean;
  pattern?: RegExp;      // optional format check
  example?: string;      // shown in error help
};

const RULES: Rule[] = [
  {
    key: "NEXT_PUBLIC_SITE_URL",
    required: true,
    pattern: /^https?:\/\/[^\s/]+/i,
    example: "https://abrahamoflondon.org",
  },
  {
    key: "NEXT_PUBLIC_INNOVATEHUB_URL",
    required: true,
    pattern: /^https?:\/\/[^\s/]+/i,
    example: "https://innovatehub.abrahamoflondon.org",
  },
  {
    key: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    required: true,
    pattern: /^G-[A-Z0-9]{6,}$/i,
    example: "G-XXXXXXXXXX",
  },

  // Optional but useful fallbacks (don’t fail if missing)
  { key: "URL", required: false, pattern: /^https?:\/\/[^\s/]+/i, example: "https://abrahamoflondon.org" },
  { key: "DEPLOY_PRIME_URL", required: false, pattern: /^https?:\/\/[^\s/]+/i, example: "https://abraham-of-london.netlify.app" },
];

function isEmpty(v: unknown) {
  return v === undefined || v === null || String(v).trim() === "";
}

const errors: string[] = [];
const warnings: string[] = [];

// Validate
for (const rule of RULES) {
  const raw = process.env[rule.key];

  if (rule.required && isEmpty(raw)) {
    errors.push(`• ${rule.key} is required but missing.`);
    continue;
  }
  if (!isEmpty(raw) && rule.pattern && !rule.pattern.test(String(raw))) {
    const msg = `• ${rule.key} is set but malformed: "${raw}". Expected like: ${rule.example ?? rule.pattern}`;
    // required → error, optional → warning
    (rule.required ? errors : warnings).push(msg);
  }
}

// Nice output
const header = (label: string) => console.log(`\n\x1b[1m${label}\x1b[0m`);

header("Environment check");
console.log("Loaded from .env.local / CI env.");

if (warnings.length) {
  header("Warnings");
  warnings.forEach((w) => console.warn(w));
}

if (errors.length) {
  header("Errors");
  errors.forEach((e) => console.error(e));
  console.error("\nFix the items above. Example .env.local:\n");
  console.error(`NEXT_PUBLIC_SITE_URL=https://abrahamoflondon.org
NEXT_PUBLIC_INNOVATEHUB_URL=https://innovatehub.abrahamoflondon.org
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-R2Y3YMY8F8
URL=https://abrahamoflondon.org
DEPLOY_PRIME_URL=https://abraham-of-london.netlify.app`);
  process.exit(1);
}

console.log("\nAll required environment variables look good ✅");
