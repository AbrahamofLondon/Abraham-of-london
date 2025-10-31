// eslint.config.mjs (flat config)
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "eslint-config-next";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map(c => ({ ...c, files: ["**/*.ts","**/*.tsx"] })),
  {
    files: ["**/*.ts","**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"]
      }
    }
  },
  next
];
