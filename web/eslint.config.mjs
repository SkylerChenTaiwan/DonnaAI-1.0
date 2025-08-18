import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 一般 JavaScript 規則
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
      
      // React 特定規則
      "react/jsx-key": "error",
      "react-hooks/exhaustive-deps": "error",
      
      // Next.js 特定規則
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "error",
      
      // 可選但推薦的規則（警告級別）
      "complexity": ["warn", { max: 15 }],
      "max-depth": ["warn", 4],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      // 測試檔案可以放寬一些規則
      "no-console": "off",
    },
  },
];

export default eslintConfig;
