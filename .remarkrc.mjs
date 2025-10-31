export default {
  plugins: [
    ["remark-frontmatter", ["yaml"]],
    "remark-gfm",
    [
      "remark-lint-frontmatter-schema",
      {
        schema: {
          required: ["title", "date", "coverImage", "summary", "slug"],
          properties: {
            date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}T" },
          },
        },
      },
    ],
  ],
};
