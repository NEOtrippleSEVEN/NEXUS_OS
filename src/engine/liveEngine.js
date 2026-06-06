// Composition root for the browser. Wires the real generator (Claude via the
// key-proxy) to the localStorage-backed store and the orchestrator. The view
// imports this one instance and never touches transport or assembly itself.
//
// Swap claudeClient -> stubGenerator here to develop the view offline without
// burning tokens; the contract is identical under await.

import { makePathEngine } from './pathEngine.js'
import { pathStore } from './pathStore.js'
import { claudeClient } from './claudeClient.js'

export const liveEngine = makePathEngine({ store: pathStore, generator: claudeClient })
