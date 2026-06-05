import { test, expect } from 'vitest'
import { dateMilestones, horizonOf, observedVelocity, blendVelocity, reDate, isDrifting } from './pacing.js'
import { MILESTONE_STATUS } from './schema.js'

test('dateMilestones lays milestones end to end from the start date', () => {
  const dated = dateMilestones([{ estEffortHours: 10 }, { estEffortHours: 20 }], '2026-06-08', 10)
  expect(dated[0].plannedStart).toBe('2026-06-08')
  expect(dated[0].plannedEnd).toBe('2026-06-15')
  expect(dated[1].plannedStart).toBe('2026-06-15')
  expect(dated[1].plannedEnd).toBe('2026-06-29')
})

test('horizonOf returns the last plannedEnd, or null when empty', () => {
  const dated = dateMilestones([{ estEffortHours: 10 }, { estEffortHours: 20 }], '2026-06-08', 10)
  expect(horizonOf(dated)).toBe('2026-06-29')
  expect(horizonOf([])).toBeNull()
})

test('observedVelocity is effort hours over actual elapsed weeks', () => {
  expect(observedVelocity({ estEffortHours: 10, actualStart: '2026-06-08', actualEnd: '2026-06-22' })).toBe(5)
})

test('observedVelocity guards against zero-length actuals', () => {
  expect(observedVelocity({ estEffortHours: 10, actualStart: '2026-06-08', actualEnd: '2026-06-08' })).toBeNull()
})

test('blendVelocity weights planned and observed, falling back to planned', () => {
  expect(blendVelocity(10, 5, 0.5)).toBe(7.5)
  expect(blendVelocity(10, null)).toBe(10)
})

test('reDate preserves completed milestones and re-lays the rest from the given date', () => {
  const milestones = [
    { status: MILESTONE_STATUS.COMPLETE, estEffortHours: 10, plannedStart: '2026-06-01', plannedEnd: '2026-06-08' },
    { status: MILESTONE_STATUS.LOCKED, estEffortHours: 20 },
  ]
  const out = reDate(milestones, '2026-07-01', 10)
  expect(out[0].plannedEnd).toBe('2026-06-08')
  expect(out[1].plannedStart).toBe('2026-07-01')
  expect(out[1].plannedEnd).toBe('2026-07-15')
})

test('isDrifting is true only for an overdue active milestone', () => {
  const m = { status: MILESTONE_STATUS.ACTIVE, plannedEnd: '2026-06-15' }
  expect(isDrifting(m, '2026-06-20')).toBe(true)
  expect(isDrifting(m, '2026-06-10')).toBe(false)
  expect(isDrifting({ status: MILESTONE_STATUS.LOCKED, plannedEnd: '2026-06-15' }, '2026-06-20')).toBe(false)
})
