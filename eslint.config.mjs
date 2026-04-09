import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
    },
  },
  {
    ignores: [".next/", ".source/", "node_modules/", ".omc/", ".sisyphus/", "dist/"],
  },
];
