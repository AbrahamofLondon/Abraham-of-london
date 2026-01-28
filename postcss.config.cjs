/**
 * postcss.config.cjs — HARDENED (CJS) for Next.js CI
 * - Avoids ESM/CJS ambiguity on Netlify
 * - Supports Tailwind v4 plugin (@tailwindcss/postcss) if present
 * - Falls back gracefully without crashing the build
 */

function tryRequire(id) {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(id);
  } catch {
    return null;
  }
}

const autoprefixer = tryRequire("autoprefixer");

// Tailwind v4 recommends @tailwindcss/postcss
const tailwindPostcss = tryRequire("@tailwindcss/postcss");
// Older fallback (still works in some setups)
const tailwindLegacy = tryRequire("tailwindcss");

function resolveTailwindPlugin() {
  if (tailwindPostcss) return tailwindPostcss;
  if (tailwindLegacy) return tailwindLegacy;
  return null;
}

const tailwindPlugin = resolveTailwindPlugin();

module.exports = {
  plugins: [
    ...(tailwindPlugin ? [tailwindPlugin] : []),
    ...(autoprefixer ? [autoprefixer] : []),
  ],
};