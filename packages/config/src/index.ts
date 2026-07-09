/**
 * @baby-bean/config — shared tooling package.
 *
 * The real payload here is the config files consumed via subpath exports:
 *   - `@baby-bean/config/tsconfig.base.json` — strict base TS config
 *   - `@baby-bean/config/eslint`             — shared ESLint flat preset
 *   - `@baby-bean/config/prettier`           — shared Prettier config
 *
 * Design tokens (`tokens.json`) land here in P0-3 and become the single
 * source of truth for the theme system.
 */
export const CONFIG_PACKAGE = '@baby-bean/config' as const;
