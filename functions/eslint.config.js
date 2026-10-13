const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "@typescript-eslint/adjacent-overload-signatures": "error",
      "@typescript-eslint/no-empty-function": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-namespace": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/triple-slash-reference": "error",
      "constructor-super": "error",
      "no-cond-assign": "error",
      "no-duplicate-case": "error",
      "no-duplicate-imports": "error",
      "no-new-wrappers": "error",
      "no-redeclare": "error",
      "no-sequences": "error",
      "no-unsafe-finally": "error",
      "no-unused-labels": "error",
      "no-void": "error",
      "prefer-const": "warn",
    },
  },
];
