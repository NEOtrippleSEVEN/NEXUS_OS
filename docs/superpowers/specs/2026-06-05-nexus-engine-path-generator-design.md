# Nexus Engine — Path Generator (V0 Core)

- **Status:** Design locked — pending user review
- **Date:** 2026-06-05
- **Owner:** Kareem (frontend + engine)
- **Topic:** The V0 main engine. Mission in, an honest dated path out, that re-dates itself as you actually move. Everything else in Nexus OS is shell over this.

---

## 1. Essence

A founder states a mission and a few hard constraints. The engine returns a prioritized, realistically dated path: milestones laid end-to-end, the current one broken into concrete tasks, later ones coarse until reached. As the founder completes work, the path re-dates itself against their *real* velocity and surfaces a single living finish-date horizon — 42's black hole, reframed. The engine refuses to fake a path for a goal with no finish line.

This is the substrate beneath the V0 features (Orb chat, calendar, performance review). Build it first; wrap it in the bonsai/Orb shell later.

---

## 2. Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Runtime | Frontend engine, calls Claude through a thin local key-proxy, persists to localStorage, behind a clean interface that lifts into Django `priority_generator` later untouched |
| 2 | Intake | One screen: mission + constraint fields → one-shot generate |
| 3 | Path depth | Rolling-wave: all milestones dated up front, only the current one holds tasks |
| 4 | Re-plan | Auto on pace (Approach C): Claude decomposes, deterministic code re-dates, threshold-gated re-scope offer |
| 5 | Pace surfacing | 42-style: living finish-date horizon + drift + streak + XP + levels |
| 6 | Broad goals | Goal-sharpening gate: classify the mission; if vague, refuse and sharpen before generating |

---

## 3. Vocabulary

- **Path** — one mission and everything under it.
- **Milestone** — a dated, ordered outcome. Status `locked | active | complete`. Only `active` holds tasks (rolling-wave).
- **Task** — a concrete unit of work with a *done-criterion*. Belongs to the active milestone.
- **Horizon** — the single projected finish date, recomputed from real velocity. The thing that breathes.
- **Velocity** — observed effort-hours completed per calendar week, derived from actual completions.

---

## 4. User flow

```
Intake (mission + constraints)
   │
   ▼
generate_path  ──▶  needs_sharpening?  ──yes──▶  Sharpen (pick a concrete reframe) ──▶ generate_path
   │ no
   ▼
Path: milestones dated, M1 expanded into tasks, horizon shown
   │
   ▼
Execute: check off tasks  ──▶  XP accrues, streak ticks, horizon breathes
   │
   ▼
All M-tasks done ──▶ "Mark milestone complete"
   │
   ▼
Re-plan: re-date remaining (real velocity) · promote next M to active · expand_milestone · award XP/level
   │  (if >30% off pace: offer Claude re-scope — opt-in)
   ▼
Repeat until last milestone complete ──▶ Mission complete
```

---

## 5. Goal-sharpening gate

The whole promise is *realistic* paths, and a realistic path needs a concrete finish line. So the engine classifies the mission before it commits to a path.

- **Concrete** — has a measurable, dateable done-state (`ship a paid iOS app with 100 subscribers`, `land a senior PM role`, `$10k MRR`). → generate.
- **Vague / unbounded** — no finish line (`become rich`, `be successful`, `get fit`). → do **not** generate a fake path. Return a sharpening response in Nexus's voice — direct, not cruel, concrete over abstract:

> *"'Become rich' has no finish line I can build toward. Pick the one that's actually yours: $10k/month that replaces your job — $1M invested net worth — a business you could sell for life-changing money. Or give me the real number."*

The user picks a reframe or writes their own, then generation runs. Concrete missions skip the gate entirely — no extra round-trip.

**Implementation:** this is *not* a separate classify call. The `generate_path` tool result is a discriminated union — Claude returns either `{ status: 'generated', path }` or `{ status: 'needs_sharpening', reason, options[] }`. One call, two shapes.

---

## 6. Data model (localStorage, behind `pathStore`)

```jsonc
Path {
  id, mission,
  constraints: {
    targetDate,        // ISO date or null
    hoursPerWeek,      // number — drives all dating
    startingPoint,     // where you are now
    resources          // money, skills, assets on hand
  },
  status,              // 'active' | 'complete'
  createdAt, updatedAt,
  milestones: Milestone[],
  progression: Progression
}

Milestone {
  id, order,
  title,
  outcome,             // the done-state — what is true when this is complete
  priority,            // 'P1' | 'P2' | 'P3'  (red / orange / yellow)
  estEffortHours,      // total effort — drives calendar duration
  plannedStart, plannedEnd,   // ISO — recomputed on every re-plan
  actualStart, actualEnd,     // ISO or null
  status,              // 'locked' | 'active' | 'complete'
  expanded,            // bool — has Claude broken this into tasks yet
  tasks: Task[]        // empty until expanded
}

Task {
  id, title,
  doneCriterion,       // how you know it's finished — no vague filler allowed
  priority,            // 'P1' | 'P2' | 'P3'
  estEffortHours,
  status,              // 'todo' | 'done'
  completedAt          // ISO or null
}

Progression {
  xp,                  // cumulative
  level,               // derived from xp via curve
  streak,              // current active-day streak
  longestStreak,
  lastActiveDate,      // ISO
  log: [{ type, refId, xp, at }]   // award ledger
}
```

---

## 7. Generation mechanism — Claude tool-use

Three tools, strict JSON schemas matching the model:

- **`generate_path`** — input: mission + constraints. Output (union): a full path (all milestones dated with effort + outcome, **tasks for milestone 1 only**) *or* a `needs_sharpening` result.
- **`expand_milestone`** — input: one milestone + path context. Output: that milestone's tasks.
- **`adjust_plan`** — input: current plan + the user's chat message. Output: a routed result — an in-place patch (subtle change), a discussion prompt (ambiguous or bold), or a re-scope trigger (clear, large change). See §10b.

**System prompt** carries the Nexus personality (direct, concrete, no filler, no emoji/exclamation) and a hard realism mandate:

- Every estimate is honest, not flattering.
- Every task is concrete and verifiable — it has a done-criterion. No `research X`, no `think about Y`.
- Milestones are outcomes, not activities.
- Effort estimates reflect a *solo founder* at the stated skill/resource level, not a funded team.

---

## 8. Pacing engine (`pacing.js` — pure functions, no I/O, unit-tested)

This is where "realistic" lives. No LLM does arithmetic here; dates never hallucinate.

**Initial dating.** For each milestone in order: `durationWeeks = estEffortHours / hoursPerWeek`. Lay milestones end-to-end from today → `plannedStart` / `plannedEnd` for all. The last `plannedEnd` is the **horizon**.

**Target-date honesty.** If `targetDate` is set and the horizon lands past it, the engine *says so* rather than compressing: *"At 10 hrs/week this realistically finishes March 12 — six weeks past your target. Add hours or cut scope."* It never silently fakes the math to hit a wish.

**Observed velocity.** When a milestone completes: `actualWeeks = (actualEnd − actualStart) in weeks`; `observedVelocity = milestone.estEffortHours / actualWeeks`. Smooth across completed milestones (running blend, not last-only, to avoid whiplash).

**Re-dating.** Re-project every remaining (`locked` + `active`) milestone using a blend of planned `hoursPerWeek` and `observedVelocity`. Recompute the horizon. Instant, deterministic.

**Drift.** If `today > activeMilestone.plannedEnd` and it isn't complete, mark the milestone `drifting` and slide the horizon forward from today. This is the black hole creeping in — pressure, not expulsion.

---

## 9. Progression layer (`progression.js` — additive, modular, never touches pacing)

XP tracks *real weighted work*, so it can't be farmed by clicking trivial tasks.

- **Task done:** `xp += estEffortHours × priorityWeight × TASK_RATE` where P1=3, P2=2, P3=1.
- **Milestone complete:** bonus `xp += estEffortHours × priorityWeight × MILESTONE_RATE`.
- **Level:** derived from cumulative XP via a tunable escalating curve (each level costs more than the last, 42-style). Displayed as a level number + progress to next. Curve constants live in this module and are pure tuning.
- **Streak:** completing ≥1 task on a calendar day increments the active-day streak; a gap day with no completion resets it. Drift breaks the streak. `longestStreak` retained.

Everything here derives from completion events the engine already emits. It can be retuned or removed without touching the core.

---

## 10. Re-plan logic (Approach C, on `completeMilestone`)

1. Set `actualEnd`, compute `observedVelocity`.
2. `pacing.reDate()` — re-project all remaining milestones, recompute horizon.
3. Promote next `locked` → `active`; call `expand_milestone` to fill its tasks; set its `actualStart`.
4. `progression.award()` — milestone XP, level check, streak update.
5. **Threshold re-scope (opt-in):** if `observedVelocity` deviates from plan by > ~30%, surface a *non-blocking* nudge — *"You're moving ~40% slower than planned. Finish moved from March 12 to April 30. Want me to rethink the remaining milestones?"* Only on accept does a Claude re-scope run. Never silent, never automatic. This is the one piece that could be cut to ship leaner; the deterministic re-dating already satisfies "auto re-plan on pace" without it.

---

## 10b. Conversational adjustment — the Orb

The user shapes the plan by *talking to it*, not by editing fields or reaching for a "regenerate" button. The Orb chat is a thinking partner about the *current* plan — *"what if I dropped this milestone?"*, *"this deadline feels unrealistic"*, *"can I do X before Y?"*. Regenerate/re-scope is **not** the user-facing lever; it's one of the backends this layer routes to.

The **`adjust_plan`** tool takes the current plan + the user's message and routes by change magnitude:

- **Exploratory** (*"what if…"*) → answer in conversation, mutate nothing until the user commits.
- **Subtle** (reorder tasks, nudge a date, swap a priority, add or remove a task, reword an outcome) → apply a surgical in-place patch; `pacing` recomputes dates; show the diff. Done.
- **Bold** (drop or replace a milestone, move the mission target, restructure the back half) → do **not** silently patch. Either open a short discussion to reason it through, or — when the change is clear and large — route to the full re-scope, because regenerating is more honest and efficient than stitching a major change into the existing tree.

The classifier errs toward discussion: when magnitude is ambiguous, it asks rather than guesses. Every applied change is shown as an undoable diff. This puts "the user has control" behind one conversational surface, with surgical-patch and re-scope as *routed backends*, not buttons.

This layer sits on top of the working deterministic engine — generation, dating, and re-plan all function without it — so it's a later build phase, not a blocker for a usable path.

---

## 11. Module boundary (so it lifts into Django later)

```
src/engine/
  PathEngine.js    orchestrator: generate · expandMilestone · completeMilestone · replan · adjustPlan
  claudeClient.js  talks to the key-proxy        → swap for Django endpoint
  pathStore.js     localStorage read/write        → swap for API
  pacing.js        pure dating + velocity math     (portable, testable)
  progression.js   pure XP / level / streak        (portable, testable)
  prompts.js       system prompt + tool schemas
  schema.js        shapes + runtime validation
```

When Alex's backend exists, only `claudeClient` and `pathStore` change. `PathEngine`, `pacing`, `progression`, `prompts`, and `schema` move server-side unchanged.

---

## 12. Key proxy (throwaway)

A tiny local server (Vite middleware or a small Express process) holds `ANTHROPIC_API_KEY` and forwards `/api/claude` to Anthropic. Keeps the key out of the browser bundle. Explicitly disposable — deleted once Django fronts the API. Not committed with a real key.

---

## 13. Minimal V0 UI (functional, unstyled — shell comes later)

- **Intake screen** — a prominent "What's your mission?" box + constraint fields (target date, hours/week, starting point, resources) → Generate.
- **Sharpen state** — when `needs_sharpening`, show the reason + reframe options + a free-text field.
- **Path view** — a vertical timeline of milestones (P-colored, dated), the **horizon** pinned at top. Active milestone expanded with task checkboxes + done-criteria; locked ones collapsed/greyed. A progression strip (level, XP bar, streak).
- **Complete action** — when all active-milestone tasks are done, "Mark milestone complete" triggers the re-plan and the next milestone expands.

Bare but real. The bonsai dot-field and Orb wrap this afterward.

---

## 14. Out of scope for V0

- Direct field/grid editing of milestones/tasks — all adjustment flows through the Orb conversation (§10b), not editable form fields.
- Multiple concurrent paths — one mission, one path.
- The bonsai/Orb visual shell (separate, already-specced, deferred).
- Peer/social, sharing, accounts — none.
- Server persistence — localStorage only until Django exists.

---

## 15. Open questions / risks

- **Estimate quality.** The realism promise rests on Claude's effort estimates for a solo founder. Mitigation: the prompt's realism mandate + the velocity loop self-corrects dates after the first completed milestone. Watch the first generations closely and tune the prompt.
- **Re-scope instability.** Full re-generation can feel like the ground shifting. Mitigation: it's threshold-gated and opt-in; deterministic re-dating is the default.
- **localStorage limits.** One path is tiny; no concern at V0. The `pathStore` interface absorbs the move to a real store later.
- **Throwaway proxy.** Fine for solo dev; never ship a build with the key exposed. Document the disposal step.
