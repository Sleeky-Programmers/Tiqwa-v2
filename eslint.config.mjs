import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

/**
 * The quality gate is `npm run check`: lint with zero warnings, a type check and a formatting check.
 * Every rule below is an error; there are no warnings to ignore.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Correctness
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "no-console": ["error", { allow: ["info", "warn", "error"] }],
      "no-debugger": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-throw-literal": "error",
      "no-self-compare": "error",
      "no-template-curly-in-string": "error",
      "no-unused-expressions": "error",
      "no-else-return": ["error", { allowElseIf: false }],
      "object-shorthand": ["error", "always"],
      "prefer-template": "error",
      curly: ["error", "multi-line"],

      // TypeScript
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-expect-error": "allow-with-description", "ts-ignore": true, "ts-nocheck": true }],

      // React
      "react/jsx-no-useless-fragment": "error",
      "react/self-closing-comp": "error",
      "react/jsx-curly-brace-presence": ["error", { props: "never", children: "never" }],
      "react/no-array-index-key": "off",
    },
  },
  // Must stay last: turns off every stylistic rule that Prettier already owns.
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts", "docs/**", "public/**"]),
]);

export default eslintConfig;
