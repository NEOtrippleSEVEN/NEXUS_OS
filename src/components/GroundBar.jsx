import { useState, useRef } from 'react'

const chips = [
  { verb: 'Plan', rest: ' my day' },
  { verb: 'Review', rest: ' goals' },
  { verb: "What's", rest: ' off today?' },
]

export default function GroundBar({ onSubmit }) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed) return
    if (onSubmit) onSubmit(trimmed)
    setValue('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      {/* Suggestion chips */}
      <div
        className="absolute flex gap-[7px]"
        style={{ bottom: 'calc(6% + 50px)', left: '42%', transform: 'translateX(-50%)', zIndex: 7 }}
      >
        {chips.map((c) => (
          <span
            key={c.verb}
            className="text-[9.5px] text-text-secondary rounded-full cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.86)',
              border: '1px solid #E5E4DE',
              padding: '5px 11px',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <b className="text-text-primary font-semibold">{c.verb}</b>
            {c.rest}
          </span>
        ))}
      </div>

      {/* Chat bar */}
      <div
        className="absolute flex items-center gap-[9px] text-[12px] text-text-muted"
        style={{
          bottom: '6%',
          left: '42%',
          transform: 'translateX(-50%)',
          width: '42%',
          minWidth: 300,
          height: 42,
          background: '#fff',
          border: '1px solid #E5E4DE',
          borderRadius: 13,
          padding: '0 8px 0 9px',
          zIndex: 7,
          boxShadow: '0 10px 26px rgba(0,0,0,0.08), 0 0 0 4px rgba(26,26,26,0.022)',
        }}
      >
        {/* AI pearl icon */}
        <div
          className="flex-none"
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            background: 'radial-gradient(circle at 36% 32%, #fff, #e6e6ec 45%, #aeaeb8)',
            border: '1px solid #e2e2e2',
          }}
        />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-muted"
          placeholder="Ask Nexus anything…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Model selector chip */}
        <span
          className="text-[9.5px] text-text-secondary rounded-[7px] px-[9px] py-1 flex-none"
          style={{ background: '#F2F1ED', border: '1px solid #E5E4DE' }}
        >
          Orb ▾
        </span>

        {/* Send button */}
        <button
          className="flex-none flex items-center justify-center text-[13px] text-white font-bold"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: '#1A1A1A',
            cursor: 'pointer',
            border: 'none',
          }}
          onClick={handleSubmit}
        >
          ↑
        </button>
      </div>
    </>
  )
}
