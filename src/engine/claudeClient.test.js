import { test, expect } from 'vitest'
import { makeClaudeClient } from './claudeClient.js'

// A fake fetch that records the request and returns a canned Claude response.
// Claude's Messages API returns { content: [ { type, ... } ] }; a forced tool
// call surfaces as a content block { type: 'tool_use', name, input }.
function fakeFetch(responseBody, { ok = true, status = 200 } = {}) {
  const calls = []
  const fetchFn = async (url, init) => {
    calls.push({ url, init })
    return {
      ok,
      status,
      json: async () => responseBody,
      text: async () => JSON.stringify(responseBody),
    }
  }
  return { fetchFn, calls }
}

function toolUse(name, input) {
  return { content: [{ type: 'text', text: 'thinking...' }, { type: 'tool_use', name, input }] }
}

const constraints = { hoursPerWeek: 10, startingPoint: 'idea only' }

test('generatePath returns the parsed tool_use input for a generated path', async () => {
  const path = {
    status: 'generated',
    milestones: [{ title: 'Validate', outcome: 'Evidence it is worth building', priority: 'P1', estEffortHours: 20 }],
  }
  const { fetchFn } = fakeFetch(toolUse('generate_path', path))
  const client = makeClaudeClient({ fetchFn })

  const out = await client.generatePath({ mission: 'Reach $10k MRR', constraints })

  expect(out).toEqual(path)
})

test('generatePath parses a needs_sharpening union', async () => {
  const sharpen = {
    status: 'needs_sharpening',
    reason: 'no finish line',
    options: ['$10k/month', '$1M net worth'],
  }
  const { fetchFn } = fakeFetch(toolUse('generate_path', sharpen))
  const client = makeClaudeClient({ fetchFn })

  const out = await client.generatePath({ mission: 'become rich', constraints })

  expect(out.status).toBe('needs_sharpening')
  expect(out.options.length).toBe(2)
})

test('generatePath forces the generate_path tool and sends the system prompt', async () => {
  const { fetchFn, calls } = fakeFetch(toolUse('generate_path', { status: 'generated', milestones: [] }))
  const client = makeClaudeClient({ fetchFn })

  await client.generatePath({ mission: 'Reach $10k MRR', constraints })

  expect(calls.length).toBe(1)
  const body = JSON.parse(calls[0].init.body)
  expect(calls[0].init.method).toBe('POST')
  expect(body.tool_choice).toEqual({ type: 'tool', name: 'generate_path' })
  expect(body.tools.some((t) => t.name === 'generate_path')).toBe(true)
  expect(typeof body.system).toBe('string')
  expect(body.system.length).toBeGreaterThan(0)
  expect(body.messages[0].role).toBe('user')
  expect(body.messages[0].content).toContain('Reach $10k MRR')
})

test('generatePath throws when the response has no matching tool_use block', async () => {
  const { fetchFn } = fakeFetch({ content: [{ type: 'text', text: 'no tool here' }] })
  const client = makeClaudeClient({ fetchFn })

  await expect(client.generatePath({ mission: 'Reach $10k MRR', constraints })).rejects.toThrow(/generate_path/)
})

test('generatePath throws on a non-ok proxy response', async () => {
  const { fetchFn } = fakeFetch({ error: 'bad key' }, { ok: false, status: 500 })
  const client = makeClaudeClient({ fetchFn })

  await expect(client.generatePath({ mission: 'Reach $10k MRR', constraints })).rejects.toThrow(/500/)
})

test('expandMilestone forces the expand_milestone tool and returns parsed tasks', async () => {
  const tasks = { tasks: [{ title: 'Scope it', doneCriterion: 'checklist written', priority: 'P1', estEffortHours: 4 }] }
  const { fetchFn, calls } = fakeFetch(toolUse('expand_milestone', tasks))
  const client = makeClaudeClient({ fetchFn })

  const out = await client.expandMilestone({
    milestone: { title: 'Build the core', outcome: 'a working version', priority: 'P1', estEffortHours: 60 },
    path: { mission: 'Reach $10k MRR' },
  })

  expect(out.tasks.length).toBe(1)
  const body = JSON.parse(calls[0].init.body)
  expect(body.tool_choice).toEqual({ type: 'tool', name: 'expand_milestone' })
})
