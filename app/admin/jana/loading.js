export default function Loading() {
  const shimmer = {
    background: 'rgba(237,232,223,0.05)',
    borderRadius: '5px',
    animation: 'sk-shimmer 1.4s ease-in-out infinite',
  }
  return (
    <div className="admin-page-content" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes sk-shimmer {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ ...shimmer, width: '110px', height: '20px', marginBottom: '6px' }} />
          <div style={{ ...shimmer, width: '220px', height: '13px' }} />
        </div>
        <div style={{ ...shimmer, width: '140px', height: '36px', borderRadius: '7px' }} />
      </div>

      {/* Pipeline panel */}
      <div style={{
        background: 'rgba(237,232,223,0.03)',
        border: '1px solid rgba(237,232,223,0.07)',
        borderRadius: '8px', padding: '16px 20px', marginBottom: '24px',
      }}>
        <div style={{ ...shimmer, width: '70px', height: '9px', marginBottom: '12px' }} />
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {[90,80,68,95,75,65,100,70].map((w, i) => (
            <div key={i} style={{
              ...shimmer,
              width: `${w}px`, height: '26px', borderRadius: '5px',
              animationDelay: `${i * 0.05}s`,
            }} />
          ))}
        </div>
      </div>

      {/* Empty state placeholder */}
      <div style={{
        padding: '48px 20px', textAlign: 'center',
        background: 'rgba(237,232,223,0.03)',
        border: '1px solid rgba(237,232,223,0.07)',
        borderRadius: '8px',
      }}>
        <div style={{ ...shimmer, width: '200px', height: '14px', margin: '0 auto 8px' }} />
        <div style={{ ...shimmer, width: '150px', height: '14px', margin: '0 auto' }} />
      </div>
    </div>
  )
}
