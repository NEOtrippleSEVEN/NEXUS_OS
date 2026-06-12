// The key-proxy security boundary (spec §12). The browser bundle must never
// contain ANTHROPIC_API_KEY. claudeClient POSTs a plain Messages payload to a
// same-origin /api/claude; this function runs server-side (wired into Vite's
// dev middleware in vite.config.js), injects the server-held key, and forwards
// to Anthropic. The key travels UP to the API and is never returned DOWN.
//
// proxyClaude is the pure, testable core: payload + key -> { status, body }.
// The Node request/response stream plumbing is thin glue in the Vite plugin.

export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
export const ANTHROPIC_VERSION = '2023-06-01'

export async function proxyClaude({
  apiKey,
  body,
  fetchFn = fetch,
  upstreamUrl = ANTHROPIC_URL,
  anthropicVersion = ANTHROPIC_VERSION,
}) {
  if (!apiKey) {
    return {
      status: 500,
      body: { error: 'ANTHROPIC_API_KEY is not set. Add it to .env and restart the dev server.' },
    }
  }

  // Only a JSON object goes upstream. Anything else is garbage or abuse; it
  // must never be signed with the server-held key.
  const raw = typeof body === 'string' ? body : JSON.stringify(body)
  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    return { status: 400, body: { error: 'Request body must be valid JSON.' } }
  }
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { status: 400, body: { error: 'Request body must be a JSON object.' } }
  }

  const upstream = await fetchFn(upstreamUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': anthropicVersion,
    },
    body: raw,
  })

  const text = await upstream.text()
  return { status: upstream.status, body: text }
}
