import { test, expect } from 'vitest'
import { addDays, diffDays, weeksBetween } from './dateUtil.js'

test('addDays advances the date by whole days, crossing month boundaries', () => {
  expect(addDays('2026-06-08', 7)).toBe('2026-06-15')
  expect(addDays('2026-06-08', 0)).toBe('2026-06-08')
  expect(addDays('2026-06-30', 1)).toBe('2026-07-01')
})

test('diffDays returns signed calendar days between two dates', () => {
  expect(diffDays('2026-06-08', '2026-06-11')).toBe(3)
  expect(diffDays('2026-06-11', '2026-06-08')).toBe(-3)
})

test('weeksBetween returns fractional weeks', () => {
  expect(weeksBetween('2026-06-08', '2026-06-22')).toBe(2)
  expect(weeksBetween('2026-06-08', '2026-06-15')).toBe(1)
})
