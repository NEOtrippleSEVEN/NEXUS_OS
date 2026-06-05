import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    // Vitest v4's default `forks` pool times out starting workers in this
    // sandbox (worker-start timeout + a ~10s teardown hang). A single worker
    // thread runs these pure-JS modules reliably and exits cleanly.
    pool: 'threads',
    maxWorkers: 1,
    minWorkers: 1,
  },
})
