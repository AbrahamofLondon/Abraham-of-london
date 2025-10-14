// postcss/no-slash-opacity.js — guard with optional auto-fix
const TOKEN_TO_VAR = {
  forest: '--color-primary',
  cream: '--color-on-primary',
  deepCharcoal: '--color-on-secondary',
  accent: '--color-accent',
  primary: '--color-primary',
  'on-primary': '--color-on-primary',
  'on-secondary': '--color-on-secondary',
  secondary: '--color-secondary',
};

const UTILITIES = ['bg','text','border','ring','fill','stroke','outline','from','via','to','shadow'];
const TOKENS = Object.keys(TOKEN_TO_VAR);
const RE = new RegExp(`\\b(?:${UTILITIES.join('|')})-(?:${TOKENS.join('|')})\\/(\\d{1,3})\\b`);

function pctToDec(pct) {
  const n = Math.max(0, Math.min(100, parseInt(pct, 10) || 0));
  if (n === 0) return '0';
  if (n === 100) return '1';
  return (n / 100).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
}

function rewriteToken(token) {
  // token like "ring-forest/40"
  const m = token.match(/^([a-z]+)-([\w-]+)\/(\d{1,3})$/i);
  if (!m) return token;
  const [, util, name, pct] = m;
  const cssVar = TOKEN_TO_VAR[name] || '--color-primary';
  const dec = pctToDec(pct);
  if (util === 'shadow') return `shadow-[color:var(${cssVar})/${dec}]`;
  return `${util}-[color:var(${cssVar})/${dec}]`;
}

module.exports = (opts = {}) => {
  // mode: 'error' (default) | 'fix'
  const mode = (opts.mode || process.env.NO_SLASH_OPACITY_MODE || 'error').toLowerCase();

  return {
    postcssPlugin: 'no-slash-opacity',
    AtRule(at) {
      if (at.name !== 'apply') return;
      const val = String(at.params || '');
      const hits = val.match(new RegExp(RE, 'g')) || [];
      if (!hits.length) return;

      if (mode === 'fix') {
        let next = val;
        for (const h of hits) next = next.replace(h, rewriteToken(h));
        at.params = next;
        return;
      }

      const sample = hits[0];
      const suggestion = rewriteToken(sample);
      throw at.error(
        `Forbidden slash opacity token "${sample}" in @apply. ` +
        `Use arbitrary color instead: "${suggestion}". ` +
        `To auto-fix during build, set NO_SLASH_OPACITY_MODE=fix.`
      );
    },
    Declaration(decl) {
      const val = String(decl.value || '');
      const m = val.match(RE);
      if (!m) return;

      if (mode === 'fix') {
        // Conservative: do not auto-mutate arbitrary declarations.
        // We still error so authors relocate into @apply or class strings.
        throw decl.error(
          `Forbidden slash opacity token "${m[0]}" in "${decl.prop}". ` +
          `Move it into @apply or className so plugin can rewrite.`
        );
      }

      throw decl.error(
        `Forbidden slash opacity token "${m[0]}" in "${decl.prop}".`
      );
    },
  };
};
module.exports.postcss = true;
