// postcss.config.cjs — CJS, Netlify-safe
function tryRequire(id) {
  try {
    return require(id);
  } catch {
    return null;
  }
}

const autoprefixer = tryRequire("autoprefixer");
const tailwindPostcss = tryRequire("@tailwindcss/postcss");
const tailwindLegacy = tryRequire("tailwindcss");

module.exports = {
  plugins: [
    ...(tailwindPostcss ? [tailwindPostcss] : tailwindLegacy ? [tailwindLegacy] : []),
    ...(autoprefixer ? [autoprefixer] : []),
  ],
};