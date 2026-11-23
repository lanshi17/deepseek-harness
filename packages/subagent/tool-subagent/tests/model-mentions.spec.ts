import { describe, expect, it } from 'vitest'
import { readModelMentions, renderModelMentions, resolveModelMention } from '../src/model-mentions.ts'

function sessionWith(text: string[]) {
  return {
    snapshotEvents: () => text.map((value, index) => ({
      type: 'user/message',
      seq: index,
      data: { content: [{ type: 'text', text: value }] },
    })),
  } as never
}

describe('model mention tags', () => {
  it('rebuilds stable aliases from durable user text', () => {
    const session = sessionWith([
      'ask <model agent="m1" name="one" provider="p" model="one"/> and <model agent="m2" name="two" provider="p" model="two" reasoning_effort="high"/>',
      'again <model agent="m1" name="ignored" provider="other" model="other"/>',
    ])
    const mentions = readModelMentions(session)
    expect(mentions).toEqual([
      { agent: 'm1', provider: 'p', model: 'one', name: 'one' },
      { agent: 'm2', provider: 'p', model: 'two', effort: 'high', name: 'two' },
    ])
    expect(resolveModelMention(session, 'm2')?.model).toBe('two')
    expect(renderModelMentions(mentions, 'subagent')).toContain('agent: "m1"')
  })

  it('ignores malformed or unknown tags', () => {
    const session = sessionWith([
      '<model agent="x1" provider="p" model="m"/>',
      '<model agent="m1" name="no route"/>',
      '<model agent="m3" provider="p" model="m3"/>',
    ])
    expect(readModelMentions(session)).toEqual([{ agent: 'm3', provider: 'p', model: 'm3' }])
  })
})
