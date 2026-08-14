/**
 * Package-owned invariant companion for `@lanshi17/dsh-client-ui-sidebar`.
 * @module @lanshi17/dsh-client-ui-sidebar/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@lanshi17/cordis'
import type { InvariantInstaller } from '@lanshi17/dsh-invariants'

const PACKAGE_NAME = '@lanshi17/dsh-client-ui-sidebar'

/** Cordis companion plugin name. */
export const name = 'client-ui-sidebar-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: a pure-consumer plugin deriving its rows in-component
 * from the standard useSessions delivery — it emits no cordis events and owns
 * no cross-plugin mutable state; derivation and interaction behavior are
 * asserted directly by this package's tree/component specs.
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
