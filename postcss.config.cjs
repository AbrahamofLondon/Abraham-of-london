// postcss.config.cjs
function has(pkg) {
  try {
    require.resolve(pkg);
    return true;
  } catch {
    return false;
  }
}

const tailwindPlugin = has("@tailwindcss/postcss")
  ? "@tailwindcss/postcss" // Tailwind v4
  : "tailwindcss";         // Tailwind v3

module.exports = {
  plugins: {
    [tailwindPlugin]: {},
    autoprefixer: {},
  },
};