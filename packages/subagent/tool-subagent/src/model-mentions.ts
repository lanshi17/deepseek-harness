/**
 * Read user-tagged `<model agent="m1" provider="…" model="…"/>` aliases from a
 * Session's durable history. The composer writes the route into the tag so a
 * resumed Session can rebuild the alias map without a side table.
 *
 * @module @deepseek-ai/dsh-tool-subagent/model-mentions
 */

import type { Session } from '@deepseek-ai/dsh-session'

/** One route the user authorized with a `^provider/model` mention. */
export interface ModelMention {
  /** Stable per-conversation pseudonym (`m1`, `m2`, …). */
  readonly agent: string
  readonly provider: string
  readonly model: string
  /** Optional reasoning effort recorded on the mention. */
  readonly effort?: string
  /** Display name written by the composer. */
  readonly name?: string
}

const TAG = /<model\s+([^>]*?)\/>/gu
const ATTRIBUTE = /([A-Za-z_][\w-]*)="([^"]*)"/gu

/** Parse attributes from one `<model …/>` tag. Unknown attributes are ignored for forward compatibility. */
function attributes(source: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const match of source.matchAll(ATTRIBUTE)) out[match[1]!] = match[2]!
  return out
}

/** Every valid model alias in first-occurrence order, deduplicated by agent name. */
export function readModelMentions(session: Session): ModelMention[] {
  const found = new Map<string, ModelMention>()
  for (const event of session.snapshotEvents()) {
    if (event.type !== 'user/message') continue
    for (const block of event.data.content) {
      if (block.type !== 'text') continue
      for (const match of block.text.matchAll(TAG)) {
        const attrs = attributes(match[1]!)
        const agent = attrs.agent
        const provider = attrs.provider
        const model = attrs.model
        if (agent === undefined || !/^m\d+$/u.test(agent) || !provider || !model) continue
        if (found.has(agent)) continue
        found.set(agent, { agent, provider, model, ...attrs.reasoning_effort ? { effort: attrs.reasoning_effort } : {}, ...attrs.name ? { name: attrs.name } : {} })
      }
    }
  }
  return [...found.values()]
}

/** Resolve one agent alias, or undefined when the user never tagged it. */
export function resolveModelMention(session: Session, agent: string): ModelMention | undefined {
  return readModelMentions(session).find(mention => mention.agent === agent)
}

/** The model-facing alias map and the exact tool call shape the kernel accepts. */
export function renderModelMentions(mentions: readonly ModelMention[], toolName: string): string {
  if (mentions.length === 0) return ''
  const rows = mentions.map(mention => {
    const name = mention.name === undefined ? '' : ` name="${mention.name}"`
    const effort = mention.effort === undefined ? '' : `, reasoning_effort="${mention.effort}"`
    return `- ${mention.agent}${name}: provider="${mention.provider}", model="${mention.model}"${effort}`
  })
  return [
    '## User-tagged model mentions',
    'The user authorized these model aliases in this conversation. To delegate to one, call '
      + `\`${toolName}\` with \`agent\` set to its alias (for example \`agent: "m1"\`); do not copy its provider or model fields by hand.`,
    ...rows,
  ].join('\n')
}
