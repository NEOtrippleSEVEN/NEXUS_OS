import { useState, useEffect } from 'react'
import { liveEngine } from '../engine/liveEngine.js'
import { pathStore } from '../engine/pathStore.js'

// The judging tool (decision record, 2026-06-06). Not a product surface — a
// bench to run generate_path on a real mission and read the path it returns
// against the four redline questions. Deliberately unstyled. Every place the
// output is wrong becomes a line in prompts.js.

const NEXUS_MISSION =
  'Ship Nexus OS V0: a working path-generation engine, used by 10 solo founders who each generate a path and start their first milestone.'

const DEFAULTS = {
  mission: NEXUS_MISSION,
  hoursPerWeek: 20,
  startingPoint:
    'Engine core built and tested — generate_path, deterministic pacing, persistence, key-proxy. No UI shell yet. Backend not started.',
  resources: 'Solo on frontend + AI engine. Co-founder Alex owns backend (not started). React + Vite + Claude API.',
}

const REDLINES = [
  'Are the effort estimates honest, or flattering?',
  'Are the milestones outcomes, or activities in disguise?',
  'Does every milestone-1 task have a checkable done-criterion?',
  'Would you open this tomorrow and do the top task?',
]

function horizonOf(path) {
  const ms = path?.milestones ?? []
  return ms.length ? ms[ms.length - 1].plannedEnd : null
}

function Tag({ children }) {
  return <span className="border border-black/30 rounded px-1.5 py-0.5 text-xs font-medium">{children}</span>
}

function TaskRow({ task }) {
  return (
    <li className="border-l-2 border-black/15 pl-3 py-1.5">
      <div className="flex items-baseline gap-2">
        <Tag>{task.priority}</Tag>
        <span className="font-medium">{task.title}</span>
        <span className="text-sm opacity-60">{task.estEffortHours}h</span>
      </div>
      <div className="text-sm opacity-75 mt-0.5">Done when: {task.doneCriterion}</div>
    </li>
  )
}

function MilestoneCard({ milestone, index }) {
  const active = milestone.status === 'active'
  return (
    <section className={`border rounded-lg p-4 ${active ? 'border-black/40' : 'border-black/15'}`}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-sm opacity-50">M{index + 1}</span>
        <Tag>{milestone.priority}</Tag>
        <h3 className="font-semibold text-lg">{milestone.title}</h3>
        {active && <span className="text-xs uppercase tracking-wide opacity-60">active</span>}
      </div>
      <p className="mt-1 opacity-80">Outcome: {milestone.outcome}</p>
      <div className="mt-2 text-sm opacity-60 flex gap-4 flex-wrap">
        <span>{milestone.estEffortHours}h</span>
        <span>{milestone.plannedStart} → {milestone.plannedEnd}</span>
      </div>
      {milestone.tasks?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {milestone.tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </ul>
      )}
    </section>
  )
}

export default function PathLab() {
  const [form, setForm] = useState(DEFAULTS)
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [path, setPath] = useState(null)
  const [sharpen, setSharpen] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const saved = pathStore.load()
    if (saved) {
      setPath(saved)
      setStatus('done')
    }
  }, [])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function onGenerate() {
    setStatus('loading')
    setError(null)
    setSharpen(null)
    try {
      const out = await liveEngine.generate({
        mission: form.mission,
        constraints: {
          hoursPerWeek: Number(form.hoursPerWeek),
          startingPoint: form.startingPoint,
          resources: form.resources,
        },
      })
      if (out.status === 'generated') {
        setPath(out.path)
      } else {
        setSharpen({ reason: out.reason, options: out.options })
        setPath(null)
      }
      setStatus('done')
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }

  function onClear() {
    pathStore.clear()
    setPath(null)
    setSharpen(null)
    setStatus('idle')
  }

  const horizon = horizonOf(path)

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Path Lab</h1>
        <p className="opacity-60 text-sm mt-1">
          Run generate_path on a real mission and judge the output. Calls Claude through the local proxy — set
          ANTHROPIC_API_KEY in .env and restart the dev server.
        </p>
      </header>

      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Mission</span>
          <textarea
            className="w-full mt-1 border border-black/20 rounded p-2 bg-white/60"
            rows={2}
            value={form.mission}
            onChange={(e) => set('mission', e.target.value)}
          />
        </label>
        <div className="flex gap-3 flex-wrap">
          <label className="block">
            <span className="text-sm font-medium">Hours / week</span>
            <input
              type="number"
              min="1"
              className="block w-28 mt-1 border border-black/20 rounded p-2 bg-white/60"
              value={form.hoursPerWeek}
              onChange={(e) => set('hoursPerWeek', e.target.value)}
            />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Starting point</span>
          <textarea
            className="w-full mt-1 border border-black/20 rounded p-2 bg-white/60"
            rows={2}
            value={form.startingPoint}
            onChange={(e) => set('startingPoint', e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Resources</span>
          <textarea
            className="w-full mt-1 border border-black/20 rounded p-2 bg-white/60"
            rows={2}
            value={form.resources}
            onChange={(e) => set('resources', e.target.value)}
          />
        </label>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={onGenerate}
          disabled={status === 'loading'}
          className="bg-black text-white rounded px-4 py-2 font-medium disabled:opacity-40"
        >
          {status === 'loading' ? 'Generating…' : 'Generate path'}
        </button>
        {(path || sharpen) && (
          <button onClick={onClear} className="border border-black/30 rounded px-4 py-2">
            Clear
          </button>
        )}
      </div>

      {status === 'error' && (
        <div className="mt-6 border border-red-400 bg-red-50 rounded p-3 text-sm">
          <strong>Generation failed.</strong> {error}
        </div>
      )}

      {sharpen && (
        <div className="mt-6 border border-black/20 rounded-lg p-4">
          <h2 className="font-semibold">Mission needs sharpening</h2>
          <p className="opacity-80 mt-1">{sharpen.reason}</p>
          <p className="text-sm opacity-60 mt-3 mb-1">Pick one to load it into the mission:</p>
          <ul className="space-y-1">
            {sharpen.options.map((opt) => (
              <li key={opt}>
                <button
                  className="text-left underline decoration-black/30 hover:decoration-black"
                  onClick={() => {
                    set('mission', opt)
                    setSharpen(null)
                  }}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {path && (
        <div className="mt-6">
          {horizon && (
            <p className="text-sm opacity-60 mb-3">
              Finish-line horizon: <span className="font-medium opacity-100">{horizon}</span>
            </p>
          )}
          <div className="space-y-3">
            {path.milestones.map((m, i) => (
              <MilestoneCard key={m.id} milestone={m} index={i} />
            ))}
          </div>
        </div>
      )}

      <footer className="mt-10 pt-6 border-t border-black/10">
        <p className="text-sm font-medium opacity-70">Judge the output:</p>
        <ol className="list-decimal list-inside text-sm opacity-60 mt-1 space-y-0.5">
          {REDLINES.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      </footer>
    </div>
  )
}
