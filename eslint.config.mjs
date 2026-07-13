import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import pluginSecurity from "eslint-plugin-security";
import noSecrets from "eslint-plugin-no-secrets";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    plugins: {
      security: pluginSecurity,
      "no-secrets": noSecrets,
    },
    rules: {
      ...pluginSecurity.configs["recommended-legacy"].rules,
      "no-secrets/no-secrets": ["error", { tolerance: 4.5 }],
      "security/detect-object-injection": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
