export default function Loading() {
  const s = {
    shimmer: {
      background: 'rgba(237,232,223,0.05)',
      borderRadius: '5px',
      animation: 'sk-shimmer 1.4s ease-in-out infinite',
    },
  }
  return (
    <div className="admin-page-content" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes sk-shimmer {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }
      `}</style>

      {/* Header skeleton */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ ...s.shimmer, width: '140px', height: '20px' }} />
          <div style={{ ...s.shimmer, width: '80px', height: '16px', borderRadius: '999px' }} />
        </div>
        <div style={{ ...s.shimmer, width: '180px', height: '13px' }} />
      </div>

      {/* Metrics strip skeleton */}
      <div style={{
        display: 'flex', background: 'rgba(237,232,223,0.04)',
        border: '1px solid rgba(237,232,223,0.07)',
        borderRadius: '8px', overflow: 'hidden', marginBottom: '12px',
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, padding: '20px 22px',
            borderRight: i < 3 ? '1px solid rgba(237,232,223,0.06)' : 'none',
            display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <div style={{ ...s.shimmer, width: '55px', height: '10px' }} />
            <div style={{ ...s.shimmer, width: '40px', height: '36px', animationDelay: `${i * 0.1}s` }} />
          </div>
        ))}
      </div>

      {/* Bottom row skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[0,1].map(i => (
          <div key={i} style={{
            background: 'rgba(237,232,223,0.04)',
            border: '1px solid rgba(237,232,223,0.07)',
            borderRadius: '8px', padding: '18px 20px',
          }}>
            <div style={{ ...s.shimmer, width: '120px', height: '10px', marginBottom: '16px' }} />
            {[0,1,2,3,4].map(j => (
              <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: j < 4 ? '1px solid rgba(237,232,223,0.04)' : 'none' }}>
                <div style={{ ...s.shimmer, width: `${45 + (j * 7) % 30}%`, height: '13px', animationDelay: `${j * 0.07}s` }} />
                <div style={{ ...s.shimmer, width: '40px', height: '13px' }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
