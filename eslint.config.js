import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import globals from "globals";
import jest from "eslint-plugin-jest";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.git/**"],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.test.js"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: ["./tsconfig.json", "./packages/*/tsconfig.json"],
        tsconfigRootDir: ".",
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        React: "readonly",
        JSX: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      jest,
    },
    rules: {
      ...jest.configs.recommended.rules,
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "none",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/method-signature-style": ["error", "method"],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],

      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "no-unused-vars": "off",
      "no-duplicate-imports": "off",
      "no-unused-expressions": "error",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "error",
      "prefer-template": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "no-trailing-spaces": "error",
      "eol-last": "error",
      "comma-dangle": ["error", "always-multiline"],
      semi: ["error", "always"],
      quotes: ["error", "single", { avoidEscape: true }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  prettier,
];
