// postcss/no-slash-opacity.js
// Minimal PostCSS 8 plugin that can "error" or "fix" slash opacity tokens
// in @apply or declarations, e.g. text-emerald-500/70
// Set NO_SLASH_OPACITY_MODE=fix to auto-rewrite inside @apply.

const TOKEN = /(?:^|\s)([a-zA-Z0-9:_-]+\/\d{1,3})(?=\s|$)/g;

function rewriteToken(sample) {
  // Example: "text-emerald-500/70" -> "text-[color:oklch(var(--twc-emerald-500)/0.70)]"
  // Keep it simple: just suggest Tailwind arbitrary color with 0.xx opacity.
  const m = sample.match(/^(.*)\/(\d{1,3})$/);
  if (!m) return sample;
  const [, base, pct] = m;
  const o = Math.max(0, Math.min(100, parseInt(pct, 10))) / 100;
  // Generic suggestion; you can tailor to your color system if desired
  return `${base} opacity-${Math.round(o * 100)}`;
}

module.exports = function noSlashOpacity(opts = {}) {
  const mode = String(opts.mode || process.env.NO_SLASH_OPACITY_MODE || "error").toLowerCase();

  return {
    postcssPlugin: "no-slash-opacity",

    AtRule(at) {
      if (at.name !== "apply") return;
      const val = String(at.params || "");
      const hits = val.match(TOKEN) || [];
      if (!hits.length) return;

      if (mode === "fix") {
        let next = val;
        for (const h of hits) next = next.replace(h, rewriteToken(h.trim()));
        at.params = next;
        return;
      }

      const sample = hits[0].trim();
      const suggestion = rewriteToken(sample);
      throw at.error(
        `Forbidden slash opacity token "${sample}" in @apply. ` +
        `Use a non-slash form instead (e.g. "${suggestion}") or set NO_SLASH_OPACITY_MODE=fix to auto-rewrite.`
      );
    },

    Declaration(decl) {
      const val = String(decl.value || "");
      const m = val.match(TOKEN);
      if (!m) return;

      if (mode === "fix") {
        // Don’t auto-rewrite in declarations; advise moving into @apply/className.
        throw decl.error(
          `Forbidden slash opacity token "${m[0].trim()}" in "${decl.prop}". ` +
          `Move it into @apply or a className so it can be rewritten.`
        );
      }

      throw decl.error(
        `Forbidden slash opacity token "${m[0].trim()}" in "${decl.prop}".`
      );
    },
  };
};

module.exports.postcss = true; // ✅ important for PostCSS 8
