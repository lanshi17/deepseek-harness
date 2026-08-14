import { describe, expect, it } from 'vitest'
import { Context } from '@lanshi17/cordis'
import * as GeneralInvariant from '@lanshi17/dsh-client-ui-settings-general/invariant'
import InvariantRegistry from '@lanshi17/dsh-invariants'

describe('invariant companion', () => {
  it('registers under the package name with an empty installer', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(GeneralInvariant).await()).resolves.toBeDefined()
  })
})
