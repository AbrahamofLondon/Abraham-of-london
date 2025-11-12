// PostCSS plugin to convert Tailwind v2 slash opacity syntax to v3
module.exports = {
  postcssPlugin: 'no-slash-opacity',
  Once(root, { result }) {
    root.walkRules((rule) => {
      rule.selector = rule.selector.replace(
        /\/(0|5|10|15|20|25|30|35|40|45|50|55|60|65|70|75|80|85|90|95|100)(?=\s|$|:)/g,
        '-$1'
      );
    });
  },
};

module.exports.postcss = true;