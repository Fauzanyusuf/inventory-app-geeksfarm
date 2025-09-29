import js from "@eslint/js";
import globals from "globals";
import eslintPluginUnusedImports from "eslint-plugin-unused-imports"; // import plugin
import eslintPluginImport from "eslint-plugin-import"; // import plugin

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
      "unused-imports": eslintPluginUnusedImports, // Menggunakan import plugin
      import: eslintPluginImport, // Menambahkan plugin import
      js,
    },
    rules: {
      "no-console": "warn",
      "no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "unused-imports/no-unused-imports": "error",
      "import/no-unused-modules": [
        "warn",
        {
          unusedExports: true,
          missingExports: false,
        },
      ],
      "import/prefer-default-export": "off",
    },
  },
  {
    files: ["tests/**/*.js"],
    rules: {
      "no-console": "off",
      "no-unused-vars": "off",
    },
  },
]);
