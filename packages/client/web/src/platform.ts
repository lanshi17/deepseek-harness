/**
 * Shared browser platform modules. Seeding, bundling externals, and Vite
 * aliases consume this list so their module identities cannot drift.
 * @module @lanshi17/dsh-client-web/src/platform
 */

/** The module specifiers the shell shares into the frozen module table. */
export const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@lanshi17/cordis',
  '@lanshi17/dsh-client-ui-slots',
  '@lanshi17/dsh-client-web-react',
  '@lanshi17/dsh-client-ui-primitives',
  '@lanshi17/dsh-client-ui-attachment',
  '@lanshi17/dsh-client-schema-form',
] as const

/** One platform module specifier (a seed-table key). */
export type PlatformModule = (typeof PLATFORM_MODULES)[number]
