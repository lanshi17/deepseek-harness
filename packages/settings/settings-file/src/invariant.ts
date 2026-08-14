/**
 * Package-owned invariant companion for `@lanshi17/dsh-settings-file`.
 * @module @lanshi17/dsh-settings-file/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@lanshi17/cordis'
import type { InvariantInstaller } from '@lanshi17/dsh-invariants'

const PACKAGE_NAME = '@lanshi17/dsh-settings-file'

/** Cordis companion plugin name. */
export const name = 'settings-file-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: this provider's contracts are file round-trip,
 * watcher timing, and atomic-write behavior — IO effects proven by package
 * tests; the in-process commit relation is owned by `@lanshi17/dsh-settings`.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
