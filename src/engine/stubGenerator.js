// Deterministic stand-in for Claude (spec §7). It satisfies the generator
// contract the PathEngine depends on, so Plan 3's claudeClient is a drop-in
// swap. It returns only the *creative* payload — titles, outcomes, priorities,
// effort, and milestone-1 tasks — never ids, dates, or statuses. The engine
// assembles and dates the path so the model never does arithmetic (spec §8).
//
// Contract:
//   generatePath({ mission, constraints })
//     -> { status: 'generated', milestones: RawMilestone[] }
//     |  { status: 'needs_sharpening', reason, options: string[] }
//   expandMilestone({ milestone, path }) -> { tasks: RawTask[] }
//
// RawMilestone: { title, outcome, priority, estEffortHours, tasks? }  (tasks on M1 only)
// RawTask:      { title, doneCriterion, priority, estEffortHours }

const VAGUE = /\b(rich|wealthy|wealth|success|successful|happy|happiness|fit|fitness|famous|fame|better|great|productive|free|freedom)\b/i

// A concrete mission names a number or a dollar figure — something dateable.
function hasConcreteAnchor(mission) {
  return /\d/.test(mission) || /\$/.test(mission)
}

function isVague(mission) {
  return VAGUE.test(mission) && !hasConcreteAnchor(mission)
}

// Split a milestone's effort into three tasks that sum back to it exactly, so
// the velocity math downstream stays honest.
function splitEffort(total) {
  const plan = Math.round(total * 0.2)
  const build = Math.round(total * 0.5)
  const finish = total - plan - build
  return [plan, build, finish]
}

function generatePath({ mission }) {
  if (isVague(mission)) {
    return {
      status: 'needs_sharpening',
      reason: `"${mission}" has no finish line I can build toward. Pick the one that's actually yours, or give me the real number.`,
      options: [
        '$10k/month that replaces your day job',
        '$1M invested net worth',
        'A business you could sell for life-changing money',
      ],
    }
  }

  return {
    status: 'generated',
    milestones: [
      {
        title: 'Validate the idea',
        outcome: `Evidence that "${mission}" is worth building`,
        priority: 'P1',
        estEffortHours: 20,
        tasks: [
          { title: 'Write a one-page brief', doneCriterion: 'Brief states the problem, the user, and one success metric', priority: 'P1', estEffortHours: 4 },
          { title: 'Interview 5 prospective users', doneCriterion: 'Five interview notes captured in one doc', priority: 'P1', estEffortHours: 8 },
          { title: 'Pick the single success metric', doneCriterion: 'One measurable target written down', priority: 'P2', estEffortHours: 2 },
          { title: 'Decide go / no-go', doneCriterion: 'A written decision with the reason', priority: 'P2', estEffortHours: 6 },
        ],
      },
      {
        title: 'Build the core',
        outcome: 'A working version a user can finish the main job with',
        priority: 'P1',
        estEffortHours: 60,
      },
      {
        title: 'Launch to real users',
        outcome: 'Live, with the first real users on it',
        priority: 'P2',
        estEffortHours: 30,
      },
    ],
  }
}

function expandMilestone({ milestone }) {
  const [plan, build, finish] = splitEffort(milestone.estEffortHours)
  return {
    tasks: [
      { title: `Scope "${milestone.title}"`, doneCriterion: 'Scope written as a checklist of done-states', priority: milestone.priority, estEffortHours: plan },
      { title: `Build "${milestone.title}"`, doneCriterion: milestone.outcome ? `Outcome reached: ${milestone.outcome}` : 'The core of this milestone works end to end', priority: milestone.priority, estEffortHours: build },
      { title: `Verify "${milestone.title}"`, doneCriterion: 'A second person can confirm the outcome is true', priority: 'P2', estEffortHours: finish },
    ],
  }
}

export const stubGenerator = { generatePath, expandMilestone }
