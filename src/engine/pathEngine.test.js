import { test, expect } from 'vitest'
import { makePathEngine } from './pathEngine.js'
import { makePathStore, createMemoryStorage } from './pathStore.js'
import { MILESTONE_STATUS, TASK_STATUS } from './schema.js'

// A generator stand-in we fully control, so assembly/dating is asserted exactly.
function fakeGenerator(result) {
  return { generatePath: async () => result, expandMilestone: async () => ({ tasks: [] }) }
}

function counterIdGen() {
  let n = 0
  return () => `id-${++n}`
}

const constraints = { hoursPerWeek: 10, startingPoint: 'idea only' }

const generated = {
  status: 'generated',
  milestones: [
    {
      title: 'Validate the idea',
      outcome: 'Evidence it is worth building',
      priority: 'P1',
      estEffortHours: 20,
      tasks: [
        { title: 'Interview 5 users', doneCriterion: 'Five notes in one doc', priority: 'P1', estEffortHours: 8 },
      ],
    },
    { title: 'Build the core', outcome: 'A working version', priority: 'P1', estEffortHours: 60 },
    { title: 'Launch', outcome: 'First real users on it', priority: 'P2', estEffortHours: 30 },
  ],
}

function makeEngine(result, overrides = {}) {
  const store = makePathStore(createMemoryStorage())
  const engine = makePathEngine({
    store,
    generator: fakeGenerator(result),
    clock: () => '2026-06-06',
    idGen: counterIdGen(),
    ...overrides,
  })
  return { engine, store }
}

test('generate returns a generated path with all milestones in order', async () => {
  const { engine } = makeEngine(generated)
  const out = await engine.generate({ mission: 'Reach $10k MRR', constraints })

  expect(out.status).toBe('generated')
  expect(out.path.milestones.length).toBe(3)
  expect(out.path.milestones.map((m) => m.order)).toEqual([0, 1, 2])
  expect(out.path.mission).toBe('Reach $10k MRR')
})

test('generate makes milestone 1 active and expanded with tasks, the rest locked', async () => {
  const { engine } = makeEngine(generated)
  const { path } = await engine.generate({ mission: 'Reach $10k MRR', constraints })

  const [m1, m2, m3] = path.milestones
  expect(m1.status).toBe(MILESTONE_STATUS.ACTIVE)
  expect(m1.expanded).toBe(true)
  expect(m1.tasks.length).toBe(1)
  expect(m1.tasks[0].doneCriterion).toBe('Five notes in one doc')
  expect(m1.tasks[0].status).toBe(TASK_STATUS.TODO)
  expect(m2.status).toBe(MILESTONE_STATUS.LOCKED)
  expect(m2.tasks).toEqual([])
  expect(m3.status).toBe(MILESTONE_STATUS.LOCKED)
})

test('generate dates milestones from the clock using weekly hours, end to end', async () => {
  const { engine } = makeEngine(generated)
  const { path, horizon } = await engine.generate({ mission: 'Reach $10k MRR', constraints })

  // 20h / 10h-per-week = 2 weeks = 14 days from 2026-06-06.
  expect(path.milestones[0].plannedStart).toBe('2026-06-06')
  expect(path.milestones[0].plannedEnd).toBe('2026-06-20')
  // next milestone starts where the previous ended
  expect(path.milestones[1].plannedStart).toBe('2026-06-20')
  // horizon is the last milestone's planned end
  expect(horizon).toBe(path.milestones[2].plannedEnd)
})

test('generate assigns ids to milestones and tasks', async () => {
  const { engine } = makeEngine(generated)
  const { path } = await engine.generate({ mission: 'Reach $10k MRR', constraints })

  for (const m of path.milestones) expect(m.id).toBeTruthy()
  expect(path.milestones[0].tasks[0].id).toBeTruthy()
  expect(path.id).toBeTruthy()
})

test('generate persists the path so getPath returns it', async () => {
  const { engine, store } = makeEngine(generated)
  const { path } = await engine.generate({ mission: 'Reach $10k MRR', constraints })

  expect(engine.getPath()).toEqual(path)
  expect(store.load()).toEqual(path)
})

test('generate passes a needs_sharpening result through and does not persist', async () => {
  const sharpen = { status: 'needs_sharpening', reason: 'no finish line', options: ['$10k/mo', '$1M net worth'] }
  const { engine } = makeEngine(sharpen)

  const out = await engine.generate({ mission: 'become rich', constraints })

  expect(out.status).toBe('needs_sharpening')
  expect(out.reason).toBe('no finish line')
  expect(out.options.length).toBe(2)
  expect(engine.getPath()).toBeNull()
})

test('generate rejects bad input before calling the generator (no wasted API call)', async () => {
  let calls = 0
  const gen = { generatePath: async () => { calls++; return generated }, expandMilestone: async () => ({ tasks: [] }) }
  const engine = makePathEngine({
    store: makePathStore(createMemoryStorage()),
    generator: gen,
    clock: () => '2026-06-06',
    idGen: counterIdGen(),
  })

  await expect(engine.generate({ mission: '   ', constraints })).rejects.toThrow(/mission/i)
  await expect(engine.generate({ mission: 'Reach $10k MRR', constraints: { hoursPerWeek: 0 } })).rejects.toThrow(/hoursPerWeek/)
  await expect(engine.generate({ mission: 'Reach $10k MRR', constraints: { hoursPerWeek: NaN } })).rejects.toThrow(/hoursPerWeek/)
  expect(calls).toBe(0)
})

test('generate throws when the assembled path fails validation', async () => {
  const bad = {
    status: 'generated',
    milestones: [{ title: 'No effort', outcome: 'x', priority: 'P1', estEffortHours: 0 }],
  }
  const { engine } = makeEngine(bad)

  await expect(engine.generate({ mission: 'Reach $10k MRR', constraints })).rejects.toThrow(/estEffortHours/)
})
