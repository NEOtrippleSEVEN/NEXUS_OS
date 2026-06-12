// The orchestrator (spec §10, trimmed to V0 core). It takes the generator's
// raw creative payload — titles, outcomes, priorities, effort, M1 tasks — and
// does the arithmetic the model must never do: assigns ids, sets milestone
// status (M1 active+expanded, the rest locked), dates every milestone off the
// founder's weekly hours, validates, and persists. The model decomposes; the
// engine assembles and dates (spec §8).
//
// Async because the real generator (claudeClient) is a network call; the
// deterministic stub is a drop-in under the same await. Returns a discriminated
// union mirroring the generator: generated (with the dated path + horizon) or
// needs_sharpening (passed straight through, nothing persisted).
//
// Deferred per the V0 decision record: XP/progression award, completeMilestone
// re-dating, threshold re-scope, conversational adjust_plan. This file does one
// thing — turn a mission into a dated path you can read and judge.

import { makePath, makeMilestone, makeTask, validatePath, MILESTONE_STATUS } from './schema.js'
import { dateMilestones, horizonOf } from './pacing.js'

function defaultIdGen() {
  let n = 0
  return () => `id-${++n}`
}

function defaultClock() {
  return new Date().toISOString().slice(0, 10)
}

export function makePathEngine({ store, generator, clock = defaultClock, idGen = defaultIdGen() } = {}) {
  async function generate({ mission, constraints }) {
    // Pre-flight: reject unusable input before the generator runs. The real
    // generator is a paid network call; failing after it is money for nothing.
    if (!mission || !mission.trim()) throw new Error('mission is required')
    const hours = constraints?.hoursPerWeek
    if (!(Number.isFinite(hours) && hours > 0)) {
      throw new Error('constraints.hoursPerWeek must be a positive number')
    }

    const result = await generator.generatePath({ mission, constraints })

    if (result.status === 'needs_sharpening') {
      return { status: 'needs_sharpening', reason: result.reason, options: result.options }
    }

    // Assemble: first milestone is active and carries its tasks (rolling-wave);
    // every later milestone stays locked until reached.
    const milestones = (result.milestones || []).map((rm, i) => {
      const m = makeMilestone({
        id: idGen(),
        order: i,
        title: rm.title,
        outcome: rm.outcome,
        priority: rm.priority,
        estEffortHours: rm.estEffortHours,
      })
      if (i === 0) {
        m.status = MILESTONE_STATUS.ACTIVE
        m.expanded = true
        m.tasks = (rm.tasks || []).map((rt) =>
          makeTask({
            id: idGen(),
            title: rt.title,
            doneCriterion: rt.doneCriterion,
            priority: rt.priority,
            estEffortHours: rt.estEffortHours,
          }),
        )
      }
      return m
    })

    // Date everything off today and the founder's weekly hours.
    const dated = dateMilestones(milestones, clock(), constraints.hoursPerWeek)

    const path = makePath({ id: idGen(), mission, constraints })
    path.milestones = dated

    const errors = validatePath(path)
    if (errors.length) throw new Error(`Invalid generated path: ${errors.join('; ')}`)

    store.save(path)
    return { status: 'generated', path, horizon: horizonOf(dated) }
  }

  function getPath() {
    return store.load()
  }

  return { generate, getPath }
}
