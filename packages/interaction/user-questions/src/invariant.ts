/**
 * Package-owned invariant companion for `@lanshi17/dsh-user-questions`.
 * @module @lanshi17/dsh-user-questions/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@lanshi17/cordis'
import type { InvariantInstaller } from '@lanshi17/dsh-invariants'

const PACKAGE_NAME = '@lanshi17/dsh-user-questions'

/** Cordis companion plugin name. */
export const name = 'user-questions-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the single provider slot is validated at registration and asks return
 * directly to their caller; the seam publishes no independent request/answer audit stream.
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
