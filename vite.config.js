import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { proxyClaude } from './src/engine/claudeProxy.js'

// Dev-only key proxy (spec §12). Reads the server-held ANTHROPIC_API_KEY from
// .env (loadEnv keeps it out of the client bundle — only VITE_* reach the
// browser), collects the POSTed Messages payload, and hands it to the pure
// proxyClaude. The key never leaves the Node process.
function claudeProxyPlugin(env) {
  return {
    name: 'nexus-claude-proxy',
    configureServer(server) {
      server.middlewares.use('/api/claude', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const raw = Buffer.concat(chunks).toString('utf8')
          const { status, body } = await proxyClaude({ apiKey: env.ANTHROPIC_API_KEY, body: raw })
          res.statusCode = status
          res.setHeader('content-type', 'application/json')
          res.end(typeof body === 'string' ? body : JSON.stringify(body))
        } catch (err) {
          res.statusCode = 502
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: `Claude proxy failed: ${err.message}` }))
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
