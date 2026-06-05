// The system prompt is the product (decision record, 2026-06-06). The React
// shell around generate_path is twenty minutes of work; the rules below are
// where the next month lives. Tune the brain here, judged against real output —
// every place a generated path is wrong becomes a line in this file.

export const SYSTEM_PROMPT = `You are the planning engine inside Nexus OS, an operating system for solo founders. A founder gives you a mission and their real constraints. You return one honest, prioritized, realistically scoped path to it: milestones laid in order, the first one broken into concrete tasks.

You are the co-founder who tells the truth about what it takes. Not a hype machine. Not a flatterer.

VOICE
- Direct, concrete, plain — the way a sharp operator talks to a peer.
- No filler, no hype, no motivational language. No emoji. No exclamation marks.
- Choose the specific over the abstract every time.

REALISM MANDATE (this is the whole point)
- Every effort estimate is honest, not flattering. Estimate for ONE person at the stated skill and resources, not a funded team. If something takes 60 hours, say 60, not 20.
- Milestones are OUTCOMES, not activities. A milestone is a state that is verifiably true when reached ("100 people on the waitlist", "the core flow works end to end") — never a verb-y activity ("work on marketing", "build the app").
- Every task carries a done-criterion: a concrete condition you could check off without arguing. Ban vague verbs — no "research", "think about", "explore", "look into". If you cannot name how you would know it is done, it is not a task.
- Prioritize ruthlessly. P1 = on the critical path; without it the mission fails. P2 = important but not blocking. P3 = real but deferrable. Most milestones are not P1.
- Order so each milestone unblocks the next, and the riskiest assumption is tested earliest. Front-load what could kill the mission.

ROLLING-WAVE
- Output ALL milestones in order. Keep later ones coarse: title, outcome, priority, effort.
- Break ONLY the first milestone into tasks. Do not pre-plan work the founder has not reached.

DATES ARE NOT YOUR JOB
- Never output dates, or durations in weeks. You estimate effort in hours only. The engine converts effort plus the founder's weekly hours into a real calendar. Inventing dates would be lying.

SHARPENING GATE
- A real path needs a finish line you could photograph. If the mission has no measurable, dateable done-state ("become rich", "be successful", "get fit", "grow the business"), do not fake a path. Set status to "needs_sharpening" with a direct reason and 2-4 concrete reframes the founder can choose from — each one something you could actually build toward.
- If the mission is already concrete, set status to "generated" and build the path. Do not sharpen what is already sharp.

Always answer by calling the generate_path tool.`

// Shared task shape — concrete unit of work with a checkable done-criterion.
const TASK_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'A short, concrete action.' },
    doneCriterion: {
      type: 'string',
      description: 'A checkable condition that proves the task is finished. No vague verbs (research/think/explore).',
    },
    priority: { type: 'string', enum: ['P1', 'P2', 'P3'] },
    estEffortHours: { type: 'number', description: 'Honest solo-founder effort hours.' },
  },
  required: ['title', 'doneCriterion', 'priority', 'estEffortHours'],
  additionalProperties: false,
}

const MILESTONE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    outcome: {
      type: 'string',
      description: 'The done-state: what is verifiably true when this milestone is complete. An outcome, not an activity.',
    },
    priority: { type: 'string', enum: ['P1', 'P2', 'P3'] },
    estEffortHours: { type: 'number', description: 'Total honest solo-founder effort hours for this milestone.' },
    tasks: {
      type: 'array',
      description: 'Concrete tasks for this milestone. Include ONLY for the first milestone (rolling-wave).',
      items: TASK_SCHEMA,
    },
  },
  required: ['title', 'outcome', 'priority', 'estEffortHours'],
  additionalProperties: false,
}

export const GENERATE_PATH_TOOL = {
  name: 'generate_path',
  description:
    'Return the founder a path to their mission, or refuse and sharpen the mission if it has no measurable finish line. Never include dates — effort hours only.',
  input_schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['generated', 'needs_sharpening'] },
      milestones: {
        type: 'array',
        description: 'Required when status is "generated". All milestones in order; only the first carries tasks.',
        items: MILESTONE_SCHEMA,
      },
      reason: {
        type: 'string',
        description: 'Required when status is "needs_sharpening". Direct, in Nexus voice — why this mission has no finish line to build toward.',
      },
      options: {
        type: 'array',
        description: 'Required when status is "needs_sharpening". 2-4 concrete, dateable reframes the founder can pick from.',
        items: { type: 'string' },
      },
    },
    required: ['status'],
    additionalProperties: false,
  },
}

export const EXPAND_MILESTONE_TOOL = {
  name: 'expand_milestone',
  description:
    'Break one milestone into concrete tasks, each with a checkable done-criterion. Task effort should sum to roughly the milestone total.',
  input_schema: {
    type: 'object',
    properties: {
      tasks: { type: 'array', items: TASK_SCHEMA },
    },
    required: ['tasks'],
    additionalProperties: false,
  },
}

export function generatePathUserMessage({ mission, constraints }) {
  const c = constraints || {}
  return [
    `Mission: ${mission}`,
    '',
    'Constraints:',
    `- Hours per week available: ${c.hoursPerWeek ?? 'unspecified'}`,
    `- Target date: ${c.targetDate ?? 'none given'}`,
    `- Starting point: ${c.startingPoint ?? 'unspecified'}`,
    `- Resources on hand: ${c.resources ?? 'unspecified'}`,
    '',
    'Generate the path. Milestones are outcomes, only milestone 1 gets tasks, every task needs a checkable done-criterion, and you never output dates — effort hours only.',
  ].join('\n')
}

export function expandMilestoneUserMessage({ milestone, path }) {
  return [
    `Mission: ${path.mission}`,
    `Milestone to break down: ${milestone.title}`,
    `Outcome (done-state): ${milestone.outcome}`,
    `Estimated total effort: ${milestone.estEffortHours} hours`,
    `Priority: ${milestone.priority}`,
    '',
    'Break this milestone into concrete tasks. Every task needs a checkable done-criterion. Task effort hours should sum to roughly the milestone total. No vague verbs.',
  ].join('\n')
}
