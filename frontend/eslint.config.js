import eslint from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import configPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import globals from "globals";

export default [
	{
		ignores: [
			"dist/**",
			"vite.**",
			".vite/**",
			"node_modules/**",
			"build/**",
			"coverage/**",
		],
		files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021,
			},
			parserOptions: {
				ecmaFeatures: { jsx: true },
				ecmaVersion: "latest",
				sourceType: "module",
			},
		},
		plugins: {
			react: reactPlugin,
			"react-hooks": reactHooksPlugin,
			import: importPlugin,
			"unused-imports": unusedImportsPlugin,
		},
		rules: {
			...eslint.configs.recommended.rules,
			...reactPlugin.configs.recommended.rules,
			...reactHooksPlugin.configs.recommended.rules,
			...importPlugin.configs.recommended.rules,
			"no-unused-vars": [
				"error",
				{
					vars: "all",
					args: "after-used",
					ignoreRestSiblings: false,
					varsIgnorePattern: "^_",
					argsIgnorePattern: "^_",
				},
			],
			"no-unused-expressions": "error",
			"unused-imports/no-unused-imports": "error",
			"unused-imports/no-unused-vars": [
				"warn",
				{
					vars: "all",
					varsIgnorePattern: "^_",
					args: "after-used",
					argsIgnorePattern: "^_",
				},
			],
			"import/no-unresolved": [
				"error",
				{
					ignore: ["^@/"],
				},
			],
			"import/named": "error",
			"import/namespace": "error",
			"import/default": "error",
			"import/export": "error",
			"react/prop-types": "off",
			"react/react-in-jsx-scope": "off",
		},
		settings: {
			react: {
				version: "detect",
			},
			"import/resolver": {
				node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
			},
		},
	},
	configPrettier,
];
