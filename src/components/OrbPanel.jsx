export default function OrbPanel() {
  return (
    <div
      className="absolute rounded-[18px] text-[#F1F1F4]"
      style={{
        top: '13%',
        right: '1.6%',
        width: '21.5%',
        height: '80%',
        zIndex: 6,
        background:
          'radial-gradient(135% 85% at 15% -12%, rgba(255,255,255,0.13), rgba(255,255,255,0) 56%), rgba(17,17,23,0.33)',
        backdropFilter: 'blur(22px) saturate(136%) brightness(0.94)',
        WebkitBackdropFilter: 'blur(22px) saturate(136%) brightness(0.94)',
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow:
          '0 20px 52px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(255,255,255,0.05)',
        padding: '14px 13px',
      }}
    >
      {/* Pearl sphere */}
      <div
        className="mx-auto mt-1 mb-[10px]"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 36% 30%, #ffffff 0%, #ededf2 24%, #c4c4cf 56%, #74747f 100%)',
          boxShadow: '0 0 30px rgba(255,255,255,0.55), inset 0 -7px 12px rgba(0,0,0,0.22)',
        }}
      />

      {/* Title */}
      <h4 className="text-center text-[13px] font-bold text-white" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.45)' }}>
        The Orb
      </h4>
      <div
        className="text-center text-[8px] mt-[3px] uppercase"
        style={{ color: '#D7D7DE', letterSpacing: '0.12em', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
      >
        Contextually aware AI
      </div>

      {/* Message bubble */}
      <div
        className="rounded-[10px] mt-[14px]"
        style={{
          background: 'rgba(10,10,16,0.30)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          padding: 9,
        }}
      >
        <div className="text-[7.5px] uppercase font-semibold" style={{ color: '#c8c8d0', letterSpacing: '0.13em' }}>
          Nexus
        </div>
        <p className="text-[9px] leading-[1.45] mt-1 m-0" style={{ color: '#F1F1F5' }}>
          Your planning session ran 15 min short &mdash; that matches the forecasting-avoidance pattern. Pre-commit
          tomorrow's deep-work block?
        </p>
      </div>

      {/* Input */}
      <div
        className="rounded-[9px] mt-[11px] flex items-center text-[9px]"
        style={{
          background: 'rgba(10,10,16,0.30)',
          border: '1px solid rgba(255,255,255,0.12)',
          height: 26,
          padding: '0 5px 0 10px',
          color: '#c0c0c8',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        <span>Find a message…</span>
        <span
          className="ml-auto rounded-[6px] px-[9px] py-[3px] font-semibold"
          style={{ background: 'rgba(255,255,255,0.92)', color: '#161616' }}
        >
          Send
        </span>
      </div>
    </div>
  )
}
