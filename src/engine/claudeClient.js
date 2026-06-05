// The real generator (spec §7, §12). Drop-in swap for stubGenerator: same
// async contract, so PathEngine never knows whether a deterministic stub or
// Claude produced the payload. It returns only the *creative* payload —
// titles, outcomes, priorities, effort, M1 tasks — never ids, dates, or
// statuses. The engine assembles and dates the path (spec §8).
//
// The browser never holds the API key. fetchFn POSTs to a same-origin proxy
// (/api/claude) that injects ANTHROPIC_API_KEY and the anthropic-version
// header server-side, then forwards to api.anthropic.com. The request body
// here is a plain Claude Messages payload with a forced tool call.
//
// Contract (identical to stubGenerator):
//   generatePath({ mission, constraints })
//     -> { status: 'generated', milestones }
//     |  { status: 'needs_sharpening', reason, options }
//   expandMilestone({ milestone, path }) -> { tasks }

import {
  SYSTEM_PROMPT,
  GENERATE_PATH_TOOL,
  EXPAND_MILESTONE_TOOL,
  generatePathUserMessage,
  expandMilestoneUserMessage,
} from './prompts.js'

// Configurable. For the validation run we want the model whose judgment we
// most trust on honest-vs-flattering estimates; override via makeClaudeClient.
export const DEFAULT_MODEL = 'claude-sonnet-4-20250514'
export const MAX_TOKENS = 4096

export function makeClaudeClient({
  fetchFn = fetch,
  endpoint = '/api/claude',
  model = DEFAULT_MODEL,
  maxTokens = MAX_TOKENS,
} = {}) {
  // One forced-tool call. tool_choice pins the tool so Claude must answer
  // through the schema — no prose, no ambiguity to parse.
  async function call({ tool, toolName, userMessage }) {
    const res = await fetchFn(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: SYSTEM_PROMPT,
        tools: [tool],
        tool_choice: { type: 'tool', name: toolName },
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Claude proxy error ${res.status}: ${text}`)
    }

    const data = await res.json()
    const block = (data.content || []).find(
      (b) => b.type === 'tool_use' && b.name === toolName,
    )
    if (!block) throw new Error(`No ${toolName} tool_use in Claude response`)
    return block.input
  }

  return {
    async generatePath({ mission, constraints }) {
      return call({
        tool: GENERATE_PATH_TOOL,
        toolName: 'generate_path',
        userMessage: generatePathUserMessage({ mission, constraints }),
      })
    },
    async expandMilestone({ milestone, path }) {
      return call({
        tool: EXPAND_MILESTONE_TOOL,
        toolName: 'expand_milestone',
        userMessage: expandMilestoneUserMessage({ milestone, path }),
      })
    },
  }
}

export const claudeClient = makeClaudeClient()
