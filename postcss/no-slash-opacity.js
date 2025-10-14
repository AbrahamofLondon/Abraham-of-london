// postcss/no-slash-opacity.js — PostCSS plugin to block `/NN` tokens in CSS (e.g. @apply ring-forest/40)
module.exports = (opts = {}) => {
  const tokens = new Set([
    'forest',
    'cream',
    'deepCharcoal',
    'accent',
    'primary',
    'on-primary',
    'on-secondary',
    'secondary',
  ]);
  const re = new RegExp(`\\b(?:bg|text|border|ring|fill|stroke|outline|from|via|to|shadow)-(?:${[...tokens].join('|')})\\/(\\d{1,3})\\b`);

  return {
    postcssPlugin: 'no-slash-opacity',
    // Check raw @apply blocks BEFORE Tailwind transforms them.
    AtRule(atRule) {
      if (atRule.name !== 'apply') return;
      const val = String(atRule.params || '');
      const m = val.match(re);
      if (m) {
        throw atRule.error(
          `Forbidden slash opacity token "${m[0]}". Use arbitrary color: "${m[0].replace(/^(\\w+)-([\\w-]+)\\/(\\d{1,3})$/, (_,$1,$2,$3) => {
            const map = {
              forest: '--color-primary',
              cream: '--color-on-primary',
              deepCharcoal: '--color-on-secondary',
              accent: '--color-accent',
              primary: '--color-primary',
              'on-primary': '--color-on-primary',
              'on-secondary': '--color-on-secondary',
              secondary: '--color-secondary'
            };
            const dec = (() => {
              const n = Math.max(0, Math.min(100, parseInt($3,10)));
              if (n === 0) return '0';
              if (n === 100) return '1';
              return (n/100).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
            })();
            const cssVar = map[$2] || '--color-primary';
            return `${$1}-[color:var(${cssVar})/${dec}]`;
          })}"`
        );
      }
    },
    // Also scan declaration values (in case someone writes custom props with those tokens)
    Declaration(decl) {
      const val = String(decl.value || '');
      const m = val.match(re);
      if (m) {
        throw decl.error(`Forbidden slash opacity token "${m[0]}" in declaration "${decl.prop}".`);
      }
    }
  };
};
module.exports.postcss = true;
