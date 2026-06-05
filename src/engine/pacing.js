import { addDays, weeksBetween } from './dateUtil.js'
import { MILESTONE_STATUS } from './schema.js'

function durationDays(estEffortHours, hoursPerWeek) {
  return Math.ceil((estEffortHours / hoursPerWeek) * 7)
}

export function dateMilestones(milestones, startIso, hoursPerWeek) {
  let cursor = startIso
  return milestones.map((m) => {
    const plannedStart = cursor
    const plannedEnd = addDays(cursor, durationDays(m.estEffortHours, hoursPerWeek))
    cursor = plannedEnd
    return { ...m, plannedStart, plannedEnd }
  })
}

export function horizonOf(milestones) {
  if (milestones.length === 0) return null
  return milestones[milestones.length - 1].plannedEnd
}

export function observedVelocity(milestone) {
  const weeks = weeksBetween(milestone.actualStart, milestone.actualEnd)
  if (weeks <= 0) return null
  return milestone.estEffortHours / weeks
}

export function blendVelocity(plannedHoursPerWeek, observed, observedWeight = 0.5) {
  if (observed == null) return plannedHoursPerWeek
  return plannedHoursPerWeek * (1 - observedWeight) + observed * observedWeight
}

export function reDate(milestones, fromIso, effectiveHoursPerWeek) {
  let cursor = fromIso
  return milestones.map((m) => {
    if (m.status === MILESTONE_STATUS.COMPLETE) return m
    const plannedStart = cursor
    const plannedEnd = addDays(cursor, durationDays(m.estEffortHours, effectiveHoursPerWeek))
    cursor = plannedEnd
    return { ...m, plannedStart, plannedEnd }
  })
}

export function isDrifting(milestone, todayIso) {
  return (
    milestone.status === MILESTONE_STATUS.ACTIVE &&
    milestone.plannedEnd != null &&
    todayIso > milestone.plannedEnd
  )
}
