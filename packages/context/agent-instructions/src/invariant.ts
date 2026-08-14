/**
 * Package-owned invariant companion for `@lanshi17/dsh-agent-instructions`.
 * @module @lanshi17/dsh-agent-instructions/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@lanshi17/cordis'
import type { InvariantInstaller } from '@lanshi17/dsh-invariants'

const PACKAGE_NAME = '@lanshi17/dsh-agent-instructions'

/** Cordis companion plugin name. */
export const name = 'workspace-context-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: replay intentionally tolerates unknown or malformed workspace sources,
 * while focused pipeline tests own its private pending/cache state transitions.
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
