/**
 * Package-owned invariant companion for `@lanshi17/dsh-client-ui-input-trigger`.
 * @module @lanshi17/dsh-client-ui-input-trigger/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@lanshi17/cordis'
import type { InvariantInstaller } from '@lanshi17/dsh-invariants'

const PACKAGE_NAME = '@lanshi17/dsh-client-ui-input-trigger'

/** Cordis companion plugin name. */
export const name = 'client-ui-input-trigger-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the trigger pipeline is a browser-side pure core
 * (detect/reduce/match) plus a registry whose disposal is proven by the
 * HMR-safety spec; it emits no cordis events and owns no cross-plugin
 * mutable state.
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
