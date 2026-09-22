import { useRef, useEffect } from 'react'
import bonsaiData from '../data/bonsaiDots.json'

const TREE_TOP = 82
const TREE_H = 475
const TREE_W = 364
const TREE_CX = 420
const BLOOM_R = 150
const BLOOM_AMP = 3.8
const EASE = 0.20
const AUTO_DEMO_MS = 5400
const CANVAS_W = 1000
const CANVAS_H = 625

// Seed 70 ambient motes behind the Orb region
const motes = Array.from({ length: 70 }, (_, i) => ({
  x: 770 + Math.random() * 210,
  y: 100 + Math.random() * 452,
  r: 1.2 + Math.random() * 2.5,
  op: 0.12 + Math.random() * 0.22,
  key: `mote-${i}`,
}))

// Pre-compute static dot data
const dots = bonsaiData.dots.map((d, i) => {
  const x = TREE_CX + (d.x - 0.5) * TREE_W
  const y = TREE_TOP + d.y * TREE_H
  const baseR = 1.3 + d.v * 2.4
  const op = 0.40 + d.v * 0.5
  return { x, y, baseR, op, key: `d-${i}` }
})

export default function BonsaiField() {
  const svgRef = useRef(null)
  const circlesRef = useRef([])
  const cursorRef = useRef(null)
  const autoDemoRef = useRef(true)
  const startTimeRef = useRef(null)
  const rafRef = useRef(null)
  const currentR = useRef(dots.map((d) => d.baseR))

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    // Collect circle DOM refs
    const circles = svg.querySelectorAll('.tree circle')
    circlesRef.current = Array.from(circles)

    // Check reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion = motionQuery.matches

    function onMotionChange(e) {
      reducedMotion = e.matches
    }
    motionQuery.addEventListener('change', onMotionChange)

    // Visibility pause
    let hidden = false
    function onVisibility() {
      hidden = document.hidden
    }
    document.addEventListener('visibilitychange', onVisibility)

    // Pointer → canvas coordinate mapping
    function pointerToCanvas(clientX, clientY) {
      const rect = svg.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return null
      const s = Math.min(rect.width / CANVAS_W, rect.height / CANVAS_H)
      const ox = (rect.width - CANVAS_W * s) / 2
      const oy = (rect.height - CANVAS_H * s) / 2
      return {
        x: (clientX - rect.left - ox) / s,
        y: (clientY - rect.top - oy) / s,
      }
    }

    function onPointerMove(e) {
      autoDemoRef.current = false
      cursorRef.current = pointerToCanvas(e.clientX, e.clientY)
    }

    function onPointerLeave() {
      cursorRef.current = null
    }

    svg.addEventListener('pointermove', onPointerMove)
    svg.addEventListener('mousemove', onPointerMove)
    svg.addEventListener('pointerleave', onPointerLeave)
    svg.addEventListener('mouseleave', onPointerLeave)

    // Animation loop
    function tick(timestamp) {
      if (hidden) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const time = elapsed / 1000

      // Auto-demo virtual cursor
      let cursor = cursorRef.current
      if (autoDemoRef.current && elapsed < AUTO_DEMO_MS) {
        const p = elapsed / AUTO_DEMO_MS
        cursor = {
          x: 250 + p * 330,
          y: 296 + Math.sin(p * Math.PI * 3) * 150,
        }
      }

      const elArr = circlesRef.current
      const curR = currentR.current

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        let target = dot.baseR

        // Breathing
        if (!reducedMotion) {
          target += 0.45 * Math.sin(time * 1.2 + dot.x * 0.05 + dot.y * 0.035)
        }

        // Proximity bloom
        if (cursor) {
          const dx = dot.x - cursor.x
          const dy = dot.y - cursor.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < BLOOM_R) {
            const t = 1 - d / BLOOM_R
            target += t * t * BLOOM_AMP * (1 + dot.baseR * 0.5)
          }
        }

        // Ease
        curR[i] += (target - curR[i]) * EASE
        const r = Math.max(0.3, curR[i])

        if (elArr[i]) {
          elArr[i].setAttribute('r', r)
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      svg.removeEventListener('pointermove', onPointerMove)
      svg.removeEventListener('mousemove', onPointerMove)
      svg.removeEventListener('pointerleave', onPointerLeave)
      svg.removeEventListener('mouseleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener('change', onMotionChange)
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full"
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ zIndex: 1 }}
    >
      {/* Ambient motes behind Orb */}
      <g className="motes">
        {motes.map((m) => (
          <circle key={m.key} cx={m.x} cy={m.y} r={m.r} fill="#F7F4EC" opacity={m.op} />
        ))}
      </g>

      {/* Tree dots */}
      <g className="tree">
        {dots.map((d) => (
          <circle key={d.key} cx={d.x} cy={d.y} r={d.baseR} fill="#1A1A1A" opacity={d.op} />
        ))}
      </g>
    </svg>
  )
}
