import { test, expect } from 'vitest'
import { makePathStore, createMemoryStorage } from './pathStore.js'

test('save then load round-trips the path', () => {
  const store = makePathStore(createMemoryStorage())
  const path = { id: 'p1', mission: 'Ship V0', milestones: [] }
  store.save(path)
  expect(store.load()).toEqual(path)
})

test('load returns null when nothing has been saved', () => {
  const store = makePathStore(createMemoryStorage())
  expect(store.load()).toBeNull()
})

test('save overwrites the previously stored path', () => {
  const store = makePathStore(createMemoryStorage())
  store.save({ id: 'p1', mission: 'first' })
  store.save({ id: 'p1', mission: 'second' })
  expect(store.load().mission).toBe('second')
})

test('clear removes the stored path', () => {
  const store = makePathStore(createMemoryStorage())
  store.save({ id: 'p1' })
  store.clear()
  expect(store.load()).toBeNull()
})

test('load returns a detached copy, not a live reference into storage', () => {
  const store = makePathStore(createMemoryStorage())
  store.save({ id: 'p1', milestones: [] })
  const first = store.load()
  first.milestones.push('mutated')
  expect(store.load().milestones).toEqual([])
})

test('load returns null instead of throwing when storage holds corrupt JSON', () => {
  const storage = createMemoryStorage()
  storage.setItem('nexus.path', '{not valid json')
  const store = makePathStore(storage)
  expect(store.load()).toBeNull()
})
