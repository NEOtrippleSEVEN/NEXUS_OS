// Persistence boundary (spec §11). Swapped for a Django API later; everything
// above it (PathEngine, pacing, progression) stays unchanged. V0 holds a single
// active path under one key — "one mission, one path" (spec §14).

const STORAGE_KEY = 'nexus.path'

// In-memory backend: the test/node fallback, and a drop-in for localStorage's
// getItem/setItem/removeItem surface.
export function createMemoryStorage() {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)) },
    removeItem: (key) => { map.delete(key) },
  }
}

function defaultStorage() {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage
  }
  return createMemoryStorage()
}

export function makePathStore(storage = defaultStorage(), key = STORAGE_KEY) {
  return {
    save(path) {
      storage.setItem(key, JSON.stringify(path))
      return path
    },
    load() {
      const raw = storage.getItem(key)
      if (raw == null) return null
      // Corrupt storage (interrupted write, manual edit) reads as "no path" —
      // the founder regenerates instead of hitting a white screen.
      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    },
    clear() {
      storage.removeItem(key)
    },
  }
}

// Default singleton bound to the ambient storage (localStorage in the browser,
// memory under test). The app imports this; tests build their own with an
// injected backend.
export const pathStore = makePathStore()
