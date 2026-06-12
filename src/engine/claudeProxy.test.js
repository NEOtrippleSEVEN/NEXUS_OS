import { test, expect } from 'vitest'
import { proxyClaude, ANTHROPIC_URL } from './claudeProxy.js'

// proxyClaude is the security boundary: it takes the browser's message payload
// plus the server-held key and produces the authenticated upstream call. The
// key goes UP to Anthropic and must never come back DOWN to the client.

function fakeUpstream(responseText, { status = 200 } = {}) {
  const calls = []
  const fetchFn = async (url, init) => {
    calls.push({ url, init })
    return { status, text: async () => responseText }
  }
  return { fetchFn, calls }
}

const body = { model: 'claude-sonnet-4-20250514', messages: [{ role: 'user', content: 'hi' }] }

test('proxyClaude injects the key and anthropic-version into the upstream request', async () => {
  const { fetchFn, calls } = fakeUpstream('{"ok":true}')

  await proxyClaude({ apiKey: 'sk-secret', body, fetchFn })

  expect(calls.length).toBe(1)
  expect(calls[0].url).toBe(ANTHROPIC_URL)
  expect(calls[0].init.method).toBe('POST')
  expect(calls[0].init.headers['x-api-key']).toBe('sk-secret')
  expect(calls[0].init.headers['anthropic-version']).toBeTruthy()
})

test('proxyClaude forwards the upstream status and body back to the caller', async () => {
  const { fetchFn } = fakeUpstream('{"content":[]}', { status: 200 })

  const out = await proxyClaude({ apiKey: 'sk-secret', body, fetchFn })

  expect(out.status).toBe(200)
  expect(out.body).toBe('{"content":[]}')
})

test('proxyClaude forwards an upstream error status unchanged', async () => {
  const { fetchFn } = fakeUpstream('{"error":"overloaded"}', { status: 529 })

  const out = await proxyClaude({ apiKey: 'sk-secret', body, fetchFn })

  expect(out.status).toBe(529)
})

test('proxyClaude never leaks the key back to the client', async () => {
  const { fetchFn } = fakeUpstream('{"content":[]}')

  const out = await proxyClaude({ apiKey: 'sk-supersecret', body, fetchFn })

  expect(JSON.stringify(out)).not.toContain('sk-supersecret')
})

test('proxyClaude returns a clear 500 and does not call upstream when the key is missing', async () => {
  const { fetchFn, calls } = fakeUpstream('{"content":[]}')

  const out = await proxyClaude({ apiKey: '', body, fetchFn })

  expect(out.status).toBe(500)
  expect(JSON.stringify(out.body)).toMatch(/ANTHROPIC_API_KEY/)
  expect(calls.length).toBe(0)
})

test('proxyClaude accepts an already-stringified body and forwards it verbatim', async () => {
  const { fetchFn, calls } = fakeUpstream('{"content":[]}')
  const raw = JSON.stringify(body)

  await proxyClaude({ apiKey: 'sk-secret', body: raw, fetchFn })

  expect(calls[0].init.body).toBe(raw)
})

test('proxyClaude rejects a body that is not a JSON object with 400 and never calls upstream', async () => {
  const { fetchFn, calls } = fakeUpstream('{"content":[]}')

  for (const bad of ['not json at all', '"just a string"', '[1,2,3]', '']) {
    const out = await proxyClaude({ apiKey: 'sk-secret', body: bad, fetchFn })
    expect(out.status).toBe(400)
    expect(JSON.stringify(out.body)).toMatch(/JSON/)
  }
  expect(calls.length).toBe(0)
})
