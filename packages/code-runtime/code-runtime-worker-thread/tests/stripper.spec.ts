import { describe, expect, it } from 'vitest'
import { resolveStripper } from '@lanshi17/dsh-code-runtime-worker-thread'

describe('resolveStripper — type-strip implementation selection', () => {
  it('prefers the node:module builtin when exported', () => {
    const builtin = (code: string): string => `builtin:${code}`
    const strip = resolveStripper(
      { stripTypeScriptTypes: builtin },
      // The fallback must never be consulted (or even required) when the
      // builtin exists — that is what keeps Node boot free of amaro.
      { transformSync: () => { throw new Error('amaro must not be used when the builtin exists') } },
    )
    expect(strip('const x: number = 1')).toBe('builtin:const x: number = 1')
  })

  it('falls back to amaro strip-only mode when node:module exports no stripper (bun)', () => {
    const calls: Array<{ source: string; options: unknown }> = []
    const strip = resolveStripper({}, {
      transformSync(source, options) {
        calls.push({ source, options })
        return { code: source.replace(': number', '        ') }
      },
    })
    expect(strip('const x: number = 1')).toBe('const x         = 1')
    expect(calls).toEqual([{ source: 'const x: number = 1', options: { mode: 'strip-only' } }])
  })

  it('normalizes amaro plain-diagnostic throws into an Error', () => {
    const strip = resolveStripper({}, {
      transformSync() {
        // amaro rejects non-erasable syntax with a plain object, not an Error.
        throw { code: 'UnsupportedSyntax', message: 'TypeScript enum is not supported in strip-only mode', snippet: 'enum E { A }' }
      },
    })
    expect(() => strip('enum E { A }')).toThrow(/TypeScript enum is not supported in strip-only mode/)
  })

  it('passes Error throws from the fallback through unchanged', () => {
    const strip = resolveStripper({}, {
      transformSync() {
        throw new Error('diagnostic as an Error')
      },
    })
    expect(() => strip('x')).toThrow('diagnostic as an Error')
  })

  it('renders a diagnostic without a message through String()', () => {
    const strip = resolveStripper({}, {
      transformSync() {
        throw { code: 'UnsupportedSyntax' }
      },
    })
    expect(() => strip('x')).toThrow('[object Object]')
  })

  it('rejects a runtime with neither stripper', () => {
    expect(() => resolveStripper({}, {})).toThrow(/no usable TypeScript stripper/)
  })
})
