/**
 * Remote namespaces the Session cluster calls. One parameter for one concept:
 * the generated surface a Session and its manager reach the Host through.
 *
 * @module @lanshi17/dsh-client-runtime/client/sessions/remotes
 */

import type { Context } from '@lanshi17/cordis'
import type {} from '@lanshi17/dsh-api-remotes/client'

/** The generated Remote namespaces a Session and its manager call. */
export type SessionRemotes = Pick<Context['remote'], 'commands'>
