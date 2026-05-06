import nextVitals from "eslint-config-next/core-web-vitals"

const config = [
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      "node_modules/**",
      "dist/**",
      "out/**",
      "workers/**",
      "open-next.config.ts",
      "tsconfig.tsbuildinfo",
    ],
  },
  ...nextVitals,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/jsx-no-comment-textnodes": "off",
    },
  },
]

export default config
