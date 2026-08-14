/**
 * Typed failures shared by subagent service and provider operations.
 *
 * @module @lanshi17/dsh-subagent
 */

import { HarnessError } from '@lanshi17/dsh-llm'

/** Typed failure for the subagent seam. */
export class SubagentError extends HarnessError {
  constructor(message: string, code: string, options?: ErrorOptions) {
    super(message, code, options)
    this.name = 'SubagentError'
  }
}
