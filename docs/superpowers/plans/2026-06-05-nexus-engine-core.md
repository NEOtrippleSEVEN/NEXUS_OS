# Nexus Engine Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic, fully-tested heart of the path engine — the pure modules that date milestones against real pace, compute the living horizon, and award XP / levels / streak — with zero external dependencies.

**Architecture:** Four pure ES modules under `src/engine/` (`dateUtil`, `schema`, `pacing`, `progression`), each a single responsibility, no I/O, unit-tested with Vitest. These are the portable core that later plans wrap with persistence, Claude generation, orchestration, and UI. Because they are pure, they move server-side to Django's `priority_generator` unchanged.

**Tech Stack:** JavaScript (ES modules), Vitest (test runner). No React, no network, no localStorage in this plan.

---

## Scope & Sequencing

This is **Plan 1 of 5** for the engine. It delivers the deterministic core only.

- **Plan 1 (this doc):** `dateUtil`, `schema`, `pacing`, `progression` — pure, tested.
- **Plan 2:** Persistence (`pathStore`, localStorage) + `PathEngine` orchestrator (generate / complete / replan) driven by a **stub** generator, tested with the pure core.
- **Plan 3:** Claude generation — key proxy, `claudeClient`, `prompts`, `generate_path` / `expand_milestone` tool schemas, goal-sharpening gate. Swaps the stub for real Claude.
- **Plan 4:** Minimal UI — intake screen, path view, progression strip, complete action. Verified in the browser.
- **Plan 5:** Conversational adjustment — `adjust_plan`, the Orb chat, diff/undo (spec §10b).

Each plan produces working, testable software on its own. Reference spec: `docs/superpowers/specs/2026-06-05-nexus-engine-path-generator-design.md`.

---

## File Structure (this plan)

| File | Responsibility |
|------|----------------|
| `vitest.config.js` (create) | Test runner config — node env, `src/**/*.test.js` |
| `package.json` (modify) | Add `vitest` dev-dep + `test` / `test:watch` scripts |
| `src/engine/dateUtil.js` (create) | Pure calendar math: `addDays`, `diffDays`, `weeksBetween` |
| `src/engine/dateUtil.test.js` (create) | Tests for `dateUtil` |
| `src/engine/schema.js` (create) | Constants, factories (`makeTask/Milestone/Path`), `validatePath` |
| `src/engine/schema.test.js` (create) | Tests for `schema` |
| `src/engine/pacing.js` (create) | Dating, velocity, horizon, drift — depends on `dateUtil`, `schema` |
| `src/engine/pacing.test.js` (create) | Tests for `pacing` |
| `src/engine/progression.js` (create) | XP, level curve, streak — depends on `dateUtil`, `schema` |
| `src/engine/progression.test.js` (create) | Tests for `progression` |
| `src/engine/smoke.test.js` (create) | One-line sanity test that the harness runs |

All dates are ISO `YYYY-MM-DD` strings. Lexicographic comparison of these equals chronological order, so `today > plannedEnd` is a valid date comparison. All math is done in UTC to avoid timezone drift.

---

## Task 1: Test tooling setup

**Files:**
- Modify: `package.json` (scripts + dev-dependency)
- Create: `vitest.config.js`
- Create: `src/engine/smoke.test.js`

- [ ] **Step 1: Install existing dependencies**

The project has never had its dependencies installed. Run:

```bash
npm install
```

Expected: `node_modules/` is created; exit code 0. (`react`, `vite`, `tailwindcss`, etc. install.)

- [ ] **Step 2: Add Vitest as a dev dependency**

Run:

```bash
npm install -D vitest
```

Expected: `vitest` appears under `devDependencies` in `package.json`; exit code 0.

- [ ] **Step 3: Add test scripts to `package.json`**

In `package.json`, add these two entries to the `"scripts"` object (leave existing `dev`/`build`/`preview` scripts untouched):

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create the Vitest config**

Create `vitest.config.js`:

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
```

- [ ] **Step 5: Write the harness smoke test**

Create `src/engine/smoke.test.js`:

```js
import { test, expect } from 'vitest'

test('vitest harness runs', () => {
  expect(1 + 1).toBe(2)
})
```

- [ ] **Step 6: Run the test suite to verify the harness**

Run: `npm test`
Expected: PASS — `1 passed` (1 test file, 1 test).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.js src/engine/smoke.test.js
git commit -m "chore: set up Vitest test harness"
```

---

## Task 2: `dateUtil` — pure calendar math

**Files:**
- Create: `src/engine/dateUtil.js`
- Test: `src/engine/dateUtil.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/engine/dateUtil.test.js`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/engine/dateUtil.test.js`
Expected: FAIL — cannot resolve `./dateUtil.js` (module does not exist yet).

- [ ] **Step 3: Write the minimal implementation**

Create `src/engine/dateUtil.js`:

```js
const MS_PER_DAY = 86_400_000

function toUTC(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function toISO(ms) {
  return new Date(ms).toISOString().slice(0, 10)
}

export function addDays(iso, days) {
  return toISO(toUTC(iso) + days * MS_PER_DAY)
}

export function diffDays(isoA, isoB) {
  return Math.round((toUTC(isoB) - toUTC(isoA)) / MS_PER_DAY)
}

export function weeksBetween(isoA, isoB) {
  return (toUTC(isoB) - toUTC(isoA)) / (7 * MS_PER_DAY)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/engine/dateUtil.test.js`
Expected: PASS — 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/engine/dateUtil.js src/engine/dateUtil.test.js
git commit -m "feat: add dateUtil pure calendar helpers"
```

---

## Task 3: `schema` — shapes, factories, validation

**Files:**
- Create: `src/engine/schema.js`
- Test: `src/engine/schema.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/engine/schema.test.js`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/engine/schema.test.js`
Expected: FAIL — cannot resolve `./schema.js`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/engine/schema.js`:

```js
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/engine/schema.test.js`
Expected: PASS — 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/engine/schema.js src/engine/schema.test.js
git commit -m "feat: add engine schema constants, factories, and validation"
```

---

## Task 4: `pacing` — dating, velocity, horizon, drift

**Files:**
- Create: `src/engine/pacing.js`
- Test: `src/engine/pacing.test.js`
- Depends on: `dateUtil` (Task 2), `schema` (Task 3)

- [ ] **Step 1: Write the failing test**

Create `src/engine/pacing.test.js`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/engine/pacing.test.js`
Expected: FAIL — cannot resolve `./pacing.js`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/engine/pacing.js`:

```js
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/engine/pacing.test.js`
Expected: PASS — 7 passed.

- [ ] **Step 5: Commit**

```bash
git add src/engine/pacing.js src/engine/pacing.test.js
git commit -m "feat: add pacing engine — dating, velocity, horizon, drift"
```

---

## Task 5: `progression` — XP, levels, streak

**Files:**
- Create: `src/engine/progression.js`
- Test: `src/engine/progression.test.js`
- Depends on: `dateUtil` (Task 2), `schema` (Task 3)

- [ ] **Step 1: Write the failing test**

Create `src/engine/progression.test.js`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/engine/progression.test.js`
Expected: FAIL — cannot resolve `./progression.js`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/engine/progression.js`:

```js
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/engine/progression.test.js`
Expected: PASS — 7 passed.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — all files green (smoke + dateUtil + schema + pacing + progression).

- [ ] **Step 6: Commit**

```bash
git add src/engine/progression.js src/engine/progression.test.js
git commit -m "feat: add progression — XP, level curve, streak"
```

---

## Self-Review

**Spec coverage (this plan's scope — spec §6, §8, §9):**
- §6 data shapes (Path/Milestone/Task + Progression) → Task 3 (`schema.js` factories).
- §8 pacing: end-to-end dating → `dateMilestones`; horizon → `horizonOf`; observed velocity → `observedVelocity`; blended re-dating → `blendVelocity` + `reDate`; drift → `isDrifting` (Task 4).
- §9 progression: XP by effort×priority → `xpForTask`/`xpForMilestone`; escalating level curve → `xpThreshold`/`levelForXp`/`levelProgress`; streak → `updateStreak` (Task 5).
- Deferred to later plans (intentional, noted in Scope & Sequencing): target-date honesty messaging (Plan 2 orchestrator surfaces it), the >30% re-scope threshold (Plan 2/3), generation/sharpening (Plan 3), UI (Plan 4), conversational adjustment §10b (Plan 5).

**Placeholder scan:** none — every step has complete code, exact commands, and expected output.

**Type consistency:** `MILESTONE_STATUS`/`PRIORITY`/`PRIORITY_WEIGHT` are defined once in `schema.js` (Task 3) and imported by `pacing.js` (Task 4) and `progression.js` (Task 5). Date helpers `addDays`/`diffDays`/`weeksBetween` are defined once in `dateUtil.js` (Task 2) and imported where needed. Milestone fields used by pacing (`estEffortHours`, `status`, `plannedStart/End`, `actualStart/End`) match the `makeMilestone` factory.

**Tuning note:** `TASK_RATE`, `MILESTONE_RATE`, and the `xpThreshold` curve constants are deliberate, changeable tuning values per spec §9 — they live in one module so they can be retuned without touching logic elsewhere.
