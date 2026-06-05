import { test, expect } from 'vitest'
import { xpForTask, xpForMilestone, xpThreshold, levelForXp, levelProgress, updateStreak } from './progression.js'
import { PRIORITY } from './schema.js'

test('xpForTask weights effort hours by priority', () => {
  expect(xpForTask({ estEffortHours: 2, priority: PRIORITY.P1 })).toBe(60)
  expect(xpForTask({ estEffortHours: 3, priority: PRIORITY.P3 })).toBe(30)
})

test('xpForMilestone uses the milestone rate', () => {
  expect(xpForMilestone({ estEffortHours: 5, priority: PRIORITY.P2 })).toBe(200)
})

test('xpThreshold escalates with each level and starts at zero', () => {
  expect(xpThreshold(1)).toBe(0)
  expect(xpThreshold(2)).toBe(100)
  expect(xpThreshold(3)).toBe(282)
})

test('levelForXp maps cumulative xp to the highest reached level', () => {
  expect(levelForXp(0)).toBe(1)
  expect(levelForXp(99)).toBe(1)
  expect(levelForXp(100)).toBe(2)
  expect(levelForXp(281)).toBe(2)
  expect(levelForXp(282)).toBe(3)
})

test('levelProgress reports progress within the current level', () => {
  const p = levelProgress(100)
  expect(p.level).toBe(2)
  expect(p.intoLevel).toBe(0)
  expect(p.levelSpan).toBe(182)
  expect(p.pct).toBe(0)
})

test('updateStreak increments on consecutive days, holds same-day, resets on a gap', () => {
  const base = { streak: 3, longestStreak: 5, lastActiveDate: '2026-06-08' }
  expect(updateStreak(base, '2026-06-09')).toEqual({ streak: 4, longestStreak: 5, lastActiveDate: '2026-06-09' })
  expect(updateStreak(base, '2026-06-11')).toEqual({ streak: 1, longestStreak: 5, lastActiveDate: '2026-06-11' })
  expect(updateStreak(base, '2026-06-08')).toEqual({ streak: 3, longestStreak: 5, lastActiveDate: '2026-06-08' })
})

test('updateStreak starts a fresh streak from a null lastActiveDate', () => {
  expect(updateStreak({ streak: 0, longestStreak: 0, lastActiveDate: null }, '2026-06-08'))
    .toEqual({ streak: 1, longestStreak: 1, lastActiveDate: '2026-06-08' })
})
