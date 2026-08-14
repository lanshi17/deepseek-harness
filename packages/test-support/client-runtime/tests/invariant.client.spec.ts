import { describe, expect, it } from 'vitest'
import { Context } from '@lanshi17/cordis'
import * as TestRuntimeInvariant from '@lanshi17/dsh-client-test-runtime/invariant'
import InvariantRegistry from '@lanshi17/dsh-invariants'

describe('invariant companion', () => {
  it('registers under the package name with an empty installer', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(TestRuntimeInvariant).await()).resolves.toBeDefined()
  })
})
