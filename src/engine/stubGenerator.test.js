import { test, expect } from 'vitest'
import { stubGenerator } from './stubGenerator.js'

const constraints = { hoursPerWeek: 10, startingPoint: 'idea only', resources: 'nights and weekends' }

test('generatePath refuses a vague mission with a sharpening result', () => {
  const out = stubGenerator.generatePath({ mission: 'become rich', constraints })
  expect(out.status).toBe('needs_sharpening')
  expect(typeof out.reason).toBe('string')
  expect(out.reason.length).toBeGreaterThan(0)
  expect(out.options.length).toBeGreaterThanOrEqual(2)
})

test('generatePath treats a concrete numeric mission as buildable', () => {
  const out = stubGenerator.generatePath({ mission: 'Ship a paid iOS app with 100 subscribers', constraints })
  expect(out.status).toBe('generated')
  expect(out.milestones.length).toBeGreaterThanOrEqual(2)
})

test('a role-shaped mission with no vague word is buildable, not sharpened', () => {
  const out = stubGenerator.generatePath({ mission: 'Land a senior PM role', constraints })
  expect(out.status).toBe('generated')
})

test('generated milestones carry outcome/priority/effort and only the first holds tasks', () => {
  const { milestones } = stubGenerator.generatePath({ mission: 'Reach $10k MRR', constraints })
  for (const m of milestones) {
    expect(m.title).toBeTruthy()
    expect(m.outcome).toBeTruthy()
    expect(['P1', 'P2', 'P3']).toContain(m.priority)
    expect(m.estEffortHours).toBeGreaterThan(0)
  }
  expect(milestones[0].tasks.length).toBeGreaterThan(0)
  expect(milestones[1].tasks).toBeUndefined()
})

test('milestone-1 tasks each carry a done-criterion — no vague filler', () => {
  const { milestones } = stubGenerator.generatePath({ mission: 'Reach $10k MRR', constraints })
  for (const t of milestones[0].tasks) {
    expect(t.title).toBeTruthy()
    expect(t.doneCriterion).toBeTruthy()
    expect(['P1', 'P2', 'P3']).toContain(t.priority)
    expect(t.estEffortHours).toBeGreaterThan(0)
  }
})

test('expandMilestone returns tasks that sum to the milestone effort, each with a done-criterion', () => {
  const milestone = { title: 'Build the core', outcome: 'a working version', priority: 'P1', estEffortHours: 60 }
  const { tasks } = stubGenerator.expandMilestone({ milestone, path: { mission: 'Reach $10k MRR' } })
  expect(tasks.length).toBeGreaterThan(0)
  const sum = tasks.reduce((acc, t) => acc + t.estEffortHours, 0)
  expect(sum).toBe(60)
  for (const t of tasks) {
    expect(t.doneCriterion).toBeTruthy()
    expect(t.estEffortHours).toBeGreaterThan(0)
  }
})
