import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { stubGenerator } from "../engine/stubGenerator.js";

const STORE_KEY = "nexus.path.v1";

function reviveEng(e) {
  if (!e) return null;
  const D = (s) => (s ? new Date(s) : null);
  return { ...e, simToday: D(e.simToday), baselineHorizon: D(e.baselineHorizon),
    milestones: e.milestones.map((m) => ({ ...m,
      plannedStart: D(m.plannedStart), plannedEnd: D(m.plannedEnd),
      actualStart: D(m.actualStart), actualEnd: D(m.actualEnd) })) };
}

const C = {
  canvas: "#F2F1ED", card: "rgba(250,250,247,0.92)", ink: "#1A1A1A",
  inkSoft: "#6B6B6B", inkFaint: "#9B9B9B", hairline: "#E0DFD9",
  gridDot: "#CFCEC6", P1: "#C0392B", P2: "#D98324", P3: "#B89020", good: "#3C7A3C",
};
const PRI = { P1: C.P1, P2: C.P2, P3: C.P3 };
const MS_WEEK = 7 * 24 * 3600 * 1000;

const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function effVelocity(plannedHPW, log) {
  if (!log.length) return plannedHPW;
  const sumEst = log.reduce((a, b) => a + b.est, 0);
  const sumWk = Math.max(0.1, log.reduce((a, b) => a + b.actualWeeks, 0));
  const agg = sumEst / sumWk;
  const n = log.length, PRIOR = 1;
  return (plannedHPW * PRIOR + agg * n) / (PRIOR + n);
}

function reDate(milestones, from, velocity) {
  let cursor = new Date(from);
  return milestones.map((m) => {
    if (m.status === "complete") return { ...m, plannedStart: m.actualStart, plannedEnd: m.actualEnd, durationWeeks: (m.actualEnd - m.actualStart) / MS_WEEK };
    const weeks = (m.estEffortHours || 0) / Math.max(0.1, velocity);
    const ps = new Date(cursor), pe = new Date(cursor.getTime() + weeks * MS_WEEK);
    cursor = new Date(pe);
    return { ...m, plannedStart: ps, plannedEnd: pe, durationWeeks: weeks };
  });
}
function horizonOf(ms) { const last = ms[ms.length - 1]; return last ? (last.status === "complete" ? last.actualEnd : last.plannedEnd) : new Date(); }
const mkTask = (t) => ({ ...t, done: false, steps: null, decomposing: false, stepsError: false });

const EXAMPLES = [
  "Ship Nexus OS V0: a working path-generator engine plus a bare path-view to use it",
  "Land a senior product manager role at a Series B+ startup",
  "Get fit",
];

export default function PathLab() {
  const [mission, setMission] = useState(EXAMPLES[0]);
  const [hoursPerWeek, setHours] = useState(12);
  const [targetDate, setTarget] = useState("");
  const [startingPoint, setStart] = useState("Solo founder. Comfortable with C and Python from 42; learning React and frontend as I go; have used the Claude API a little. Vite+Tailwind scaffold exists, no engine code yet.");
  const [resources, setRes] = useState("Claude API, ~12 hrs/week, 42 studies are priority 1");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sharpen, setSharpen] = useState(null);
  const [lastMission, setLastMission] = useState(null);
  const [eng, setEng] = useState(() => {
    try { const raw = localStorage.getItem(STORE_KEY); return raw ? reviveEng(JSON.parse(raw)) : null; }
    catch { return null; }
  });
  const [weeksInput, setWeeksInput] = useState("");
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    try { eng ? localStorage.setItem(STORE_KEY, JSON.stringify(eng)) : localStorage.removeItem(STORE_KEY); }
    catch {}
  }, [eng]);

  function updTask(e, mi, ti, fn) {
    return { ...e, milestones: e.milestones.map((m, i) => i !== mi ? m : { ...m, tasks: m.tasks.map((t, j) => j !== ti ? t : fn(t)) }) };
  }

  async function generate(missionOverride) {
    const m = missionOverride ?? mission;
    setLastMission(m); setLoading(true); setError(null); setSharpen(null); setEng(null);
    try {
      // Use the stub generator (swap to claudeClient when API credits exist)
      const result = await stubGenerator.generatePath({ mission: m });

      if (result.status === "needs_sharpening") {
        setSharpen(result);
      } else if (result.status === "generated") {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const hpw = Number(hoursPerWeek);
        let ms = (result.milestones || []).map((m2, i) => ({ ...m2, status: i === 0 ? "active" : "locked", tasks: (m2.tasks || []).map(mkTask), actualStart: i === 0 ? today : null, actualEnd: null }));
        ms = reDate(ms, today, hpw);
        setEng({ milestones: ms, plannedHPW: hpw, simToday: today, baselineHorizon: horizonOf(ms), log: [], targetDate, status: "running" });
        const active = ms.find((x) => x.status === "active");
        setWeeksInput(active ? active.durationWeeks.toFixed(1) : "");
      } else setError("Engine returned an unexpected shape. Try again.");
    } catch (e) {
      setError((e && e.message ? e.message : "Generation failed") + " — your inputs are kept; press Try again.");
    } finally { setLoading(false); }
  }

  function toggleTask(mi, ti) { setEng((e) => updTask(e, mi, ti, (t) => ({ ...t, done: !t.done }))); }
  function toggleStep(mi, ti, si) { setEng((e) => updTask(e, mi, ti, (t) => ({ ...t, steps: t.steps.map((s, k) => k !== si ? s : { ...s, done: !s.done }) }))); }

  async function decomposeTask(mi, ti) {
    const m = eng.milestones[mi]; const task = m.tasks[ti];
    if (task.steps) { setEng((e) => updTask(e, mi, ti, (t) => ({ ...t, steps: null }))); return; }
    // Use stub: generate simple decomposition steps offline
    setEng((e) => updTask(e, mi, ti, (t) => ({ ...t, decomposing: true, stepsError: false })));
    try {
      // Stub decomposition — produces 3 concrete micro-steps from the task
      await new Promise((r) => setTimeout(r, 400));
      const steps = [
        { title: `Research what "${task.title}" requires`, doneCriterion: "Written list of requirements", done: false },
        { title: `Execute the core of "${task.title}"`, doneCriterion: task.doneCriterion, done: false },
        { title: `Verify "${task.title}" is complete`, doneCriterion: "A second check confirms the outcome", done: false },
      ];
      setEng((e) => updTask(e, mi, ti, (t) => ({ ...t, decomposing: false, steps })));
    } catch (e) {
      setEng((e2) => updTask(e2, mi, ti, (t) => ({ ...t, decomposing: false, stepsError: true })));
    }
  }

  async function completeActive() {
    if (!eng || promoting) return;
    const idx = eng.milestones.findIndex((m) => m.status === "active");
    if (idx === -1) return;
    const active = eng.milestones[idx];
    const wk = Math.max(0.1, Number(weeksInput || active.durationWeeks));
    const actualStart = active.actualStart || eng.simToday;
    const actualEnd = new Date(actualStart.getTime() + wk * MS_WEEK);
    const newLog = [...eng.log, { est: active.estEffortHours, actualWeeks: wk }];
    const vel = effVelocity(eng.plannedHPW, newLog);
    let ms = eng.milestones.map((m, i) => i !== idx ? m : { ...m, status: "complete", actualStart, actualEnd });
    const nextIdx = ms.findIndex((m) => m.status === "locked");
    const simToday = actualEnd;
    if (nextIdx !== -1) ms[nextIdx] = { ...ms[nextIdx], status: "active", actualStart: simToday };
    ms = reDate(ms, simToday, vel);
    setEng({ ...eng, milestones: ms, log: newLog, simToday, status: nextIdx === -1 ? "complete" : "running" });

    // Expand the next milestone using stub
    if (nextIdx !== -1) {
      setPromoting(true);
      try {
        const result = await stubGenerator.expandMilestone({ milestone: ms[nextIdx] });
        setEng((e) => ({ ...e, milestones: e.milestones.map((m, i) => i !== nextIdx ? m : { ...m, tasks: (result.tasks || []).map(mkTask) }) }));
        setWeeksInput(ms[nextIdx].durationWeeks.toFixed(1));
      } catch (e) {
        setEng((e2) => ({ ...e2, milestones: e2.milestones.map((m, i) => i !== nextIdx ? m : { ...m, expandError: true }) }));
      } finally { setPromoting(false); }
    }
  }

  const dotGrid = { backgroundImage: `radial-gradient(${C.gridDot} 1.1px, transparent 1.1px)`, backgroundSize: "14px 14px" };
  const horizon = eng ? horizonOf(eng.milestones) : null;
  const vel = eng ? effVelocity(eng.plannedHPW, eng.log) : null;
  const moved = eng && eng.log.length && horizon && Math.abs(horizon - eng.baselineHorizon) > MS_WEEK / 7;
  const activeIdx = eng ? eng.milestones.findIndex((m) => m.status === "active") : -1;
  const active = activeIdx !== -1 ? eng.milestones[activeIdx] : null;
  const allDone = active && active.tasks.length > 0 && active.tasks.every((t) => t.done);

  const inputCls = "w-full mt-1 p-2 text-sm outline-none";
  const inputSt = { background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 10, color: C.ink };

  return (
    <div style={{ background: C.canvas, color: C.ink, fontFamily: "Inter, system-ui, sans-serif", ...dotGrid }} className="min-h-screen w-full p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" style={{ color: C.inkFaint, letterSpacing: "0.18em", fontSize: 10 }} className="uppercase mb-1 inline-block hover:text-text-secondary transition-colors">← Home</Link>
          <div className="flex items-center gap-3 mt-2">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="5" r="1.2" fill="#1A1A1A" opacity="0.7" />
              <circle cx="7" cy="6.5" r="1" fill="#1A1A1A" opacity="0.5" />
              <circle cx="11" cy="6.5" r="1" fill="#1A1A1A" opacity="0.5" />
              <circle cx="6" cy="8" r="0.9" fill="#1A1A1A" opacity="0.4" />
              <circle cx="8.5" cy="7.5" r="1.1" fill="#1A1A1A" opacity="0.6" />
              <circle cx="10.5" cy="8" r="0.9" fill="#1A1A1A" opacity="0.4" />
              <circle cx="12" cy="7" r="0.8" fill="#1A1A1A" opacity="0.45" />
              <rect x="8.5" y="9" width="1" height="4" rx="0.5" fill="#1A1A1A" opacity="0.5" />
              <rect x="6" y="13" width="6" height="1.5" rx="0.75" fill="#1A1A1A" opacity="0.35" />
            </svg>
            <h1 style={{ letterSpacing: "-0.03em", fontWeight: 800 }} className="text-2xl">Mission in, an honest dated path out.</h1>
          </div>
          <p style={{ color: C.inkSoft }} className="text-sm mt-1">Tasks sized to one sitting. Stuck on one? Break it down. Pace re-dates the horizon.</p>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.hairline}`, borderRadius: 14 }} className="p-5 mb-5">
          <label style={{ color: C.inkSoft }} className="text-xs font-medium">What's your mission?</label>
          <textarea value={mission} onChange={(e) => setMission(e.target.value)} rows={2} style={inputSt} className="w-full mt-1 mb-3 p-3 text-sm resize-none outline-none" />
          <div className="flex flex-wrap gap-2 mb-4">{EXAMPLES.map((ex) => (<button key={ex} onClick={() => setMission(ex)} style={{ border: `1px solid ${C.hairline}`, color: C.inkSoft, borderRadius: 999 }} className="text-xs px-3 py-1 hover:bg-white transition">{ex.length > 38 ? ex.slice(0, 38) + "…" : ex}</button>))}</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label style={{ color: C.inkSoft }} className="text-xs font-medium">Hours / week</label><input type="number" value={hoursPerWeek} onChange={(e) => setHours(e.target.value)} style={inputSt} className={inputCls} /></div>
            <div><label style={{ color: C.inkSoft }} className="text-xs font-medium">Target date (optional)</label><input type="date" value={targetDate} onChange={(e) => setTarget(e.target.value)} style={inputSt} className={inputCls} /></div>
          </div>
          <div className="mb-3"><label style={{ color: C.inkSoft }} className="text-xs font-medium">Starting point & skill level <span style={{ color: C.inkFaint }}>(the engine calibrates tasks to this)</span></label><textarea value={startingPoint} onChange={(e) => setStart(e.target.value)} rows={2} style={inputSt} className="w-full mt-1 p-2 text-sm resize-none outline-none" /></div>
          <div className="mb-4"><label style={{ color: C.inkSoft }} className="text-xs font-medium">Resources on hand</label><input value={resources} onChange={(e) => setRes(e.target.value)} style={inputSt} className={inputCls} /></div>
          <button onClick={() => generate()} disabled={loading} style={{ background: C.ink, color: C.canvas, borderRadius: 10, opacity: loading ? 0.5 : 1 }} className="px-5 py-2.5 text-sm font-medium transition">{loading ? "Generating path…" : "Generate path"}</button>
        </div>

        {sharpen && (
          <div style={{ background: C.card, border: `1px solid ${C.hairline}`, borderLeft: `3px solid ${C.P2}`, borderRadius: 12 }} className="p-5 mb-5">
            <div style={{ color: C.inkFaint, letterSpacing: "0.14em" }} className="uppercase text-xs mb-2">Needs sharpening</div>
            <p className="text-sm mb-4" style={{ color: C.ink }}>{sharpen.reason}</p>
            <div className="flex flex-col gap-2">{(sharpen.options || []).map((opt, i) => (<button key={i} onClick={() => generate(opt)} style={{ border: `1px solid ${C.hairline}`, borderRadius: 10, color: C.ink }} className="text-left text-sm px-3 py-2 hover:bg-white transition">{opt}</button>))}</div>
          </div>
        )}

        {eng && (
          <div>
            {eng.status === "complete" && (<div style={{ background: C.good, color: "#fff", borderRadius: 12 }} className="p-4 mb-4"><div style={{ letterSpacing: "0.14em" }} className="uppercase text-xs opacity-80">Mission complete</div><div className="text-sm mt-1">Finished {fmt(horizon)} · planned for {fmt(eng.baselineHorizon)}. Real pace ran {vel.toFixed(1)} effective h/wk vs {eng.plannedHPW} planned.</div></div>)}

            <div style={{ background: C.ink, color: C.canvas, borderRadius: 12 }} className="p-4 mb-4 flex items-baseline justify-between">
              <span style={{ letterSpacing: "0.14em", color: C.inkFaint }} className="uppercase text-xs">Horizon</span>
              <span className="text-right"><span style={{ letterSpacing: "-0.02em" }} className="text-lg font-semibold">{fmt(horizon)}</span>{moved && (<span style={{ color: C.inkFaint }} className="block text-xs">was {fmt(eng.baselineHorizon)}</span>)}</span>
            </div>

            {eng.log.length > 0 && (<div style={{ color: vel < eng.plannedHPW ? C.P2 : C.good }} className="text-xs mb-4">Pace: {vel.toFixed(1)} effective h/wk vs {eng.plannedHPW} planned — {vel < eng.plannedHPW ? "behind plan, horizon pushed out" : "on or ahead, horizon holding"}.</div>)}

            <div className="flex flex-col gap-3">
              {eng.milestones.map((m, idx) => {
                const isActive = m.status === "active", done = m.status === "complete";
                return (
                  <div key={idx} style={{ background: isActive ? C.card : "rgba(250,250,247,0.5)", border: `1px solid ${C.hairline}`, borderLeft: `3px solid ${done ? C.good : (PRI[m.priority] || C.inkFaint)}`, borderRadius: 12, opacity: done ? 0.7 : isActive ? 1 : 0.85 }} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2"><span style={{ background: done ? C.good : (PRI[m.priority] || C.inkFaint), color: "#fff", borderRadius: 5, fontSize: 10 }} className="px-1.5 py-0.5 font-semibold">{m.priority}</span><span style={{ color: done ? C.good : C.inkFaint, fontSize: 11 }}>{done ? "COMPLETE" : isActive ? "ACTIVE" : "LOCKED"}</span></div>
                        <h3 className="text-base font-semibold mt-1.5" style={{ letterSpacing: "-0.01em", textDecoration: done ? "line-through" : "none" }}>{m.title}</h3>
                        <p style={{ color: C.inkSoft }} className="text-sm mt-0.5">{m.outcome}</p>
                      </div>
                      <div className="text-right shrink-0"><div style={{ color: C.ink }} className="text-xs font-medium">{fmt(m.plannedStart)}</div><div style={{ color: C.inkFaint }} className="text-xs">→ {fmt(m.plannedEnd)}</div><div style={{ color: C.inkFaint }} className="text-xs mt-1">{m.estEffortHours}h · {m.durationWeeks.toFixed(1)}w{done ? " actual" : ""}</div></div>
                    </div>

                    {isActive && (
                      <div style={{ borderTop: `1px solid ${C.hairline}` }} className="mt-3 pt-3 flex flex-col gap-3">
                        {promoting && m.tasks.length === 0 && (<div style={{ color: C.inkFaint }} className="text-xs">Expanding this milestone…</div>)}
                        {m.tasks.map((t, ti) => (
                          <div key={ti}>
                            <div className="flex items-start gap-2.5">
                              <span onClick={() => toggleTask(idx, ti)} style={{ border: `1.5px solid ${t.done ? C.good : C.inkFaint}`, background: t.done ? C.good : "transparent", color: "#fff", borderRadius: 5, width: 16, height: 16, fontSize: 11, lineHeight: "14px", textAlign: "center", cursor: "pointer" }} className="mt-0.5 shrink-0 inline-block">{t.done ? "✓" : ""}</span>
                              <div className="flex-1">
                                <div className="text-sm" style={{ color: C.ink, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.6 : 1 }}>{t.title}<span style={{ color: C.inkFaint }} className="ml-2 text-xs">{t.estEffortHours}h</span></div>
                                <div style={{ color: C.inkFaint }} className="text-xs mt-0.5">Done when: {t.doneCriterion}</div>
                                <button onClick={() => decomposeTask(idx, ti)} style={{ color: C.inkSoft }} className="text-xs mt-1 underline decoration-dotted">{t.decomposing ? "Breaking down…" : t.steps ? "Hide steps" : "Break it down"}</button>
                                {t.stepsError && (<span style={{ color: C.P1 }} className="text-xs ml-2">failed — tap again</span>)}
                                {t.steps && (
                                  <div className="mt-2 flex flex-col gap-1.5" style={{ borderLeft: `1px dashed ${C.hairline}`, paddingLeft: 10 }}>
                                    {t.steps.map((s, si) => (
                                      <div key={si} className="flex items-start gap-2">
                                        <span onClick={() => toggleStep(idx, ti, si)} style={{ border: `1.5px solid ${s.done ? C.good : C.inkFaint}`, background: s.done ? C.good : "transparent", color: "#fff", borderRadius: 4, width: 13, height: 13, fontSize: 9, lineHeight: "11px", textAlign: "center", cursor: "pointer" }} className="mt-0.5 shrink-0 inline-block">{s.done ? "✓" : ""}</span>
                                        <div><div className="text-xs" style={{ color: C.inkSoft, textDecoration: s.done ? "line-through" : "none" }}>{s.title}</div><div style={{ color: C.inkFaint }} className="text-[11px]">Done when: {s.doneCriterion}</div>{s.why && (<div style={{ color: C.inkFaint }} className="text-[11px] italic">Why: {s.why}</div>)}{s.source && (<div style={{ color: C.inkSoft }} className="text-[11px]">Source: {s.source}</div>)}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div style={{ borderTop: `1px dashed ${C.hairline}` }} className="pt-3 flex items-center gap-2 flex-wrap">
                          <span style={{ color: C.inkSoft }} className="text-xs">Actually took</span>
                          <input type="number" step="0.5" value={weeksInput} onChange={(e) => setWeeksInput(e.target.value)} style={{ ...inputSt, width: 64 }} className="p-1 text-sm outline-none" />
                          <span style={{ color: C.inkSoft }} className="text-xs">weeks</span>
                          <button onClick={completeActive} disabled={!allDone || promoting} title={allDone ? "" : "Check off all tasks first"} style={{ background: allDone && !promoting ? C.ink : C.hairline, color: allDone && !promoting ? C.canvas : C.inkFaint, borderRadius: 8 }} className="ml-auto px-3 py-1.5 text-sm font-medium transition">Mark milestone complete</button>
                        </div>
                      </div>
                    )}

                    {m.status === "locked" && (
                      <div className="mt-3">
                        <span style={{ color: C.inkFaint }} className="text-xs">Tasks generated when you reach this milestone</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={() => generate()} style={{ border: `1px solid ${C.hairline}`, color: C.inkSoft, borderRadius: 10 }} className="mt-4 px-4 py-2 text-sm hover:bg-white transition">Regenerate from scratch</button>
          </div>
        )}

        {error && (<div className="mt-4"><div style={{ color: C.P1 }} className="text-sm mb-2">{error}</div><button onClick={() => generate(lastMission ?? mission)} style={{ background: C.ink, color: C.canvas, borderRadius: 10 }} className="px-4 py-2 text-sm font-medium">Try again</button></div>)}
      </div>
    </div>
  );
}
