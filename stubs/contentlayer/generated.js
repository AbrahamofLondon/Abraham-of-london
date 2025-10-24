
// JS runtime stub for contentlayer on Windows / no-build scenarios
module.exports = new Proxy(
  {},
  {
    get: (_, prop) => {
      if (
        [
          "allResources",
          "allEvents",
          "allBooks",
          "allPosts",
          "allPrints",
          "allStrategies",
          "allStrategy",
          "allDownloads"
        ].includes(prop)
      ) return [];
      return [];
    }
  }
);