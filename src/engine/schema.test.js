import { test, expect } from 'vitest'
import {
  PRIORITY, MILESTONE_STATUS, TASK_STATUS,
  makeTask, makeMilestone, makePath, validatePath,
} from './schema.js'

test('makeTask defaults to todo and uncompleted', () => {
  const t = makeTask({ id: 't1', title: 'Ship landing page', doneCriterion: 'page live at /', priority: PRIORITY.P1, estEffortHours: 4 })
  expect(t.status).toBe(TASK_STATUS.TODO)
  expect(t.completedAt).toBeNull()
  expect(t.estEffortHours).toBe(4)
})

test('makeMilestone defaults to locked, unexpanded, no tasks', () => {
  const m = makeMilestone({ id: 'm1', order: 0, title: 'Launch MVP', outcome: '10 paying users', priority: PRIORITY.P1, estEffortHours: 40 })
  expect(m.status).toBe(MILESTONE_STATUS.LOCKED)
  expect(m.expanded).toBe(false)
  expect(m.tasks).toEqual([])
  expect(m.plannedStart).toBeNull()
})

test('makePath starts active with fresh progression', () => {
  const p = makePath({ id: 'p1', mission: '$10k MRR SaaS', constraints: { hoursPerWeek: 10 } })
  expect(p.status).toBe('active')
  expect(p.progression.xp).toBe(0)
  expect(p.progression.level).toBe(1)
  expect(p.milestones).toEqual([])
})

test('validatePath flags missing mission and bad constraints', () => {
  const p = makePath({ id: 'p1', mission: '', constraints: { hoursPerWeek: 0 } })
  const errors = validatePath(p)
  expect(errors).toContain('mission is required')
  expect(errors).toContain('hoursPerWeek must be > 0')
})

test('validatePath passes a well-formed path', () => {
  const p = makePath({ id: 'p1', mission: 'Land a senior PM role', constraints: { hoursPerWeek: 8 } })
  p.milestones.push(makeMilestone({ id: 'm1', order: 0, title: 'Portfolio', outcome: '3 case studies', priority: PRIORITY.P1, estEffortHours: 20 }))
  expect(validatePath(p)).toEqual([])
})
