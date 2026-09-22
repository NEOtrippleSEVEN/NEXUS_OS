export default function ModuleCard({ name, subtitle, footer, style }) {
  return (
    <div
      className="absolute cursor-pointer transition-[transform,box-shadow] duration-[180ms]"
      style={{
        ...style,
        transform: 'translate(-50%, -50%)',
        width: 150,
        background: 'rgba(250,250,247,0.90)',
        border: '1px solid #E0DFD9',
        borderRadius: 12,
        padding: '9px 11px',
        boxShadow: '0 5px 18px rgba(0,0,0,0.08)',
        zIndex: 4,
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translate(-50%, -50%) translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 9px 24px rgba(0,0,0,0.13)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translate(-50%, -50%)'
        e.currentTarget.style.boxShadow = '0 5px 18px rgba(0,0,0,0.08)'
      }}
    >
      <div className="font-semibold text-[13px] text-text-primary">{name}</div>
      <div className="text-[9px] text-text-secondary mt-0.5 leading-snug">{subtitle}</div>
      {footer && (
        <div
          className="flex items-center gap-1.5 mt-[7px] pt-1.5 text-[9px] text-text-muted"
          style={{ borderTop: '1px solid #ECEBE5' }}
        >
          <span className="inline-block w-[5px] h-[5px] rounded-full bg-border-hover" />
          {footer}
        </div>
      )}
    </div>
  )
}
