// eslint-plugin-react-hooks 5.x ne isporučuje tipove; koristimo samo `configs.recommended.rules`.
declare module "eslint-plugin-react-hooks" {
  import type { ESLint, Linter } from "eslint";
  const plugin: ESLint.Plugin & { configs: { recommended: { rules: Linter.RulesRecord } } };
  export default plugin;
}
