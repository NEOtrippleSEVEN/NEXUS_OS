import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TitleBar from '../components/TitleBar.jsx'
import BonsaiField from '../components/BonsaiField.jsx'
import ModuleCard from '../components/ModuleCard.jsx'
import OrbPanel from '../components/OrbPanel.jsx'
import GroundBar from '../components/GroundBar.jsx'

// Module card positions — derived from pad anchors (normalized in bonsai bbox)
// mapped into the 1000×625 reference canvas, then expressed as %.
// Formula: x_px = 420 + (anchor.x - 0.5) * 364 + offset.x
//          y_px = 82  + anchor.y * 475 + offset.y
const modules = [
  {
    name: 'Main Goal',
    subtitle: 'Your north star',
    footer: 'Reach $10k MRR by Q3',
    left: ((420 + (0.553 - 0.5) * 364 + 2) / 1000) * 100,
    top: ((82 + 0.117 * 475 - 42) / 625) * 100,
  },
  {
    name: 'Journey',
    subtitle: 'Holygraph · Planner · To-dos',
    footer: '3 tasks queued today',
    left: ((420 + (0.288 - 0.5) * 364 - 46) / 1000) * 100,
    top: ((82 + 0.230 * 475 - 20) / 625) * 100,
  },
  {
    name: 'Performance',
    subtitle: 'Work · Sleep · Habits',
    footer: 'Sleep debt · 1.2h',
    left: ((420 + (0.781 - 0.5) * 364 + 84) / 1000) * 100,
    top: ((82 + 0.318 * 475 - 10) / 625) * 100,
  },
  {
    name: 'Psychology',
    subtitle: 'Patterns · biases · archetypes',
    footer: 'Forecasting avoidance',
    left: ((420 + (0.233 - 0.5) * 364 - 40) / 1000) * 100,
    top: ((82 + 0.422 * 475 + 34) / 625) * 100,
  },
]

export default function Home() {
  const [hintVisible, setHintVisible] = useState(true)
  const navigate = useNavigate()

  function handleSubmit(text) {
    navigate('/path')
  }

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{
        aspectRatio: '1000 / 625',
        background: '#F2F1ED',
        backgroundImage: 'radial-gradient(#CFCEC6 1.1px, transparent 1.1px)',
        backgroundSize: '14px 14px',
        borderRadius: 16,
        border: '1px solid #E0DFD9',
        boxShadow: '0 12px 44px rgba(0,0,0,0.08)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#1A1A1A',
      }}
      onPointerMove={() => {
        if (hintVisible) setHintVisible(false)
      }}
    >
      <BonsaiField />

      {/* Module cards on foliage pads */}
      {modules.map((m) => (
        <ModuleCard
          key={m.name}
          name={m.name}
          subtitle={m.subtitle}
          footer={m.footer}
          style={{ left: `${m.left}%`, top: `${m.top}%` }}
        />
      ))}

      <OrbPanel />
      <GroundBar onSubmit={handleSubmit} />
      <TitleBar />

      {/* Bloom hint chip — fades on first cursor move */}
      {hintVisible && (
        <div
          className="absolute flex items-center gap-[7px] text-[10px] rounded-full"
          style={{
            left: 16,
            bottom: 14,
            zIndex: 9,
            color: '#7A7A82',
            background: 'rgba(255,255,255,0.82)',
            border: '1px solid #E5E4DE',
            padding: '5px 11px 5px 9px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            transition: 'opacity 0.4s',
          }}
        >
          <span style={{ fontSize: 14 }}>✦</span>
          Move your cursor over the tree
        </div>
      )}
    </div>
  )
}
