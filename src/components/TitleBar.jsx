export default function TitleBar() {
  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center px-[15px]"
      style={{
        height: '9%',
        zIndex: 8,
        background: 'rgba(244,243,239,0.72)',
        backdropFilter: 'blur(10px) saturate(120%)',
        WebkitBackdropFilter: 'blur(10px) saturate(120%)',
        borderBottom: '1px solid #E5E4DE',
      }}
    >
      {/* Traffic lights */}
      <div className="flex gap-[7px]">
        <i className="block w-[11px] h-[11px] rounded-full bg-mac-red" />
        <i className="block w-[11px] h-[11px] rounded-full bg-mac-yellow" />
        <i className="block w-[11px] h-[11px] rounded-full bg-mac-green" />
      </div>

      {/* Centered brand */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center leading-none">
        <div className="flex items-center gap-2">
          {/* Small bonsai glyph */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
          <span className="font-[800] text-[22px] tracking-wordmark text-text-primary">
            Nexus OS
          </span>
        </div>
        <span className="text-[8.5px] text-text-muted mt-1 uppercase" style={{ letterSpacing: '0.18em' }}>
          The Founder's Operating System
        </span>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-[9px]">
        <span
          className="text-[9.5px] rounded-[7px] px-[9px] py-1"
          style={{ color: '#8B8B8B', background: '#EFEEE9', border: '1px solid #E0DFD9' }}
        >
          &#8984;K Search
        </span>
        <div
          className="w-5 h-5 rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #fff, #d7d7df 60%, #9a9aa4)',
            border: '1px solid #d8d8d8',
          }}
        />
      </div>
    </div>
  )
}
