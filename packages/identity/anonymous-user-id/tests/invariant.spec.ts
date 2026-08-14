import { describe, expect, it } from 'vitest'
import { Context } from '@lanshi17/cordis'
import InvariantRegistry from '@lanshi17/dsh-invariants'
import * as UserIdInvariant from '@lanshi17/dsh-anonymous-user-id/invariant'

describe('invariant companion', () => {
  it('registers the package ownership with an empty installer', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(UserIdInvariant).await()).resolves.toBeDefined()
  })
})
