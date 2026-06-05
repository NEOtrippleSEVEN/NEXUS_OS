import { diffDays } from './dateUtil.js'
import { PRIORITY_WEIGHT } from './schema.js'

export const TASK_RATE = 10
export const MILESTONE_RATE = 20

export function xpForTask(task) {
  return task.estEffortHours * PRIORITY_WEIGHT[task.priority] * TASK_RATE
}

export function xpForMilestone(milestone) {
  return milestone.estEffortHours * PRIORITY_WEIGHT[milestone.priority] * MILESTONE_RATE
}

export function xpThreshold(level) {
  if (level <= 1) return 0
  return Math.floor(100 * Math.pow(level - 1, 1.5))
}

export function levelForXp(xp) {
  let level = 1
  while (xpThreshold(level + 1) <= xp) level += 1
  return level
}

export function levelProgress(xp) {
  const level = levelForXp(xp)
  const base = xpThreshold(level)
  const next = xpThreshold(level + 1)
  const levelSpan = next - base
  return { level, intoLevel: xp - base, levelSpan, pct: levelSpan === 0 ? 0 : (xp - base) / levelSpan }
}

export function updateStreak(progression, completionDateIso) {
  const { streak, longestStreak, lastActiveDate } = progression
  if (lastActiveDate == null) {
    return { streak: 1, longestStreak: Math.max(1, longestStreak), lastActiveDate: completionDateIso }
  }
  const gap = diffDays(lastActiveDate, completionDateIso)
  let nextStreak
  if (gap === 0) nextStreak = streak
  else if (gap === 1) nextStreak = streak + 1
  else nextStreak = 1
  return {
    streak: nextStreak,
    longestStreak: Math.max(longestStreak, nextStreak),
    lastActiveDate: gap === 0 ? lastActiveDate : completionDateIso,
  }
}
