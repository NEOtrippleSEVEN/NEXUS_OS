export const PRIORITY = { P1: 'P1', P2: 'P2', P3: 'P3' }
export const PRIORITY_WEIGHT = { P1: 3, P2: 2, P3: 1 }
export const MILESTONE_STATUS = { LOCKED: 'locked', ACTIVE: 'active', COMPLETE: 'complete' }
export const TASK_STATUS = { TODO: 'todo', DONE: 'done' }

export function makeTask({ id, title, doneCriterion, priority, estEffortHours }) {
  return { id, title, doneCriterion, priority, estEffortHours, status: TASK_STATUS.TODO, completedAt: null }
}

export function makeMilestone({ id, order, title, outcome, priority, estEffortHours }) {
  return {
    id, order, title, outcome, priority, estEffortHours,
    plannedStart: null, plannedEnd: null, actualStart: null, actualEnd: null,
    status: MILESTONE_STATUS.LOCKED, expanded: false, tasks: [],
  }
}

export function makePath({ id, mission, constraints }) {
  const now = new Date().toISOString()
  return {
    id, mission, constraints,
    status: 'active', createdAt: now, updatedAt: now,
    milestones: [],
    progression: { xp: 0, level: 1, streak: 0, longestStreak: 0, lastActiveDate: null, log: [] },
  }
}

export function validatePath(path) {
  const errors = []
  if (!path.mission || !path.mission.trim()) errors.push('mission is required')
  const c = path.constraints || {}
  if (!(c.hoursPerWeek > 0)) errors.push('hoursPerWeek must be > 0')
  for (const [i, m] of (path.milestones || []).entries()) {
    if (!m.title) errors.push(`milestone[${i}] missing title`)
    if (!(m.estEffortHours > 0)) errors.push(`milestone[${i}] estEffortHours must be > 0`)
    if (!Object.values(PRIORITY).includes(m.priority)) errors.push(`milestone[${i}] invalid priority`)
  }
  return errors
}
