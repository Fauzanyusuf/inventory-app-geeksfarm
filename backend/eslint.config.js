import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  {
    ignores: ["tests/*"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      js,
      // We don't import third-party plugins here (they're referenced by rule IDs).
    },
    rules: {
      "no-console": "warn",
      // Warn on unused variables but allow underscore-prefixed ones as intentional.
      "no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      // Detect imports that are declared but not used anywhere in a module.
      "unused-imports/no-unused-imports": "error",
      // Detect exported but unused modules (helps find orphaned exports).
      "import/no-unused-modules": [
        "warn",
        {
          unusedExports: true,
          missingExports: false,
        },
      ],
      // Prefer named exports for clearer import/export maps and tree-shaking.
      "import/prefer-default-export": "off",
    },
  },
  // Optional: looser rules for test files
  {
    files: ["tests/**/*.js"],
    rules: {
      "no-console": "off",
      "no-unused-vars": "off",
    },
  },
]);
