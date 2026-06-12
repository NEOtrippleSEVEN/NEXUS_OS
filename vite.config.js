import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { proxyClaude } from './src/engine/claudeProxy.js'

// Dev-only key proxy (spec §12). Reads the server-held ANTHROPIC_API_KEY from
// .env (loadEnv keeps it out of the client bundle — only VITE_* reach the
// browser), collects the POSTed Messages payload, and hands it to the pure
// proxyClaude. The key never leaves the Node process.
const MAX_BODY_BYTES = 1_000_000 // a generate_path payload is ~10KB; 1MB is already generous
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

function claudeProxyPlugin(env) {
  return {
    name: 'nexus-claude-proxy',
    configureServer(server) {
      server.middlewares.use('/api/claude', async (req, res) => {
        const reply = (status, payload, headers = {}) => {
          res.statusCode = status
          res.setHeader('content-type', 'application/json')
          for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
          res.end(typeof payload === 'string' ? payload : JSON.stringify(payload))
        }

        if (req.method !== 'POST') {
          return reply(405, { error: 'Method not allowed.' }, { allow: 'POST' })
        }
        // A browser attaches Origin to cross-site POSTs; a foreign one means a
        // web page is trying to spend the server-held key. Same-machine tools
        // (curl, node) send no Origin and pass.
        const origin = req.headers.origin
        if (origin && !LOCAL_ORIGIN.test(origin)) {
          return reply(403, { error: 'Cross-origin requests are not allowed.' })
        }
        // Requiring JSON forces cross-origin callers into a CORS preflight,
        // which this server never approves — no-cors drive-by POSTs die here.
        const contentType = req.headers['content-type'] || ''
        if (!contentType.includes('application/json')) {
          return reply(415, { error: 'Content-Type must be application/json.' })
        }

        try {
          const chunks = []
          let size = 0
          for await (const chunk of req) {
            size += chunk.length
            if (size > MAX_BODY_BYTES) {
              reply(413, { error: 'Request body too large.' })
              req.destroy()
              return
            }
            chunks.push(chunk)
          }
          const raw = Buffer.concat(chunks).toString('utf8')
          const { status, body } = await proxyClaude({ apiKey: env.ANTHROPIC_API_KEY, body: raw })
          reply(status, body)
        } catch (err) {
          reply(502, { error: `Claude proxy failed: ${err.message}` })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), claudeProxyPlugin(env)],
  }
})
