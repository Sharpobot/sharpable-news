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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <div style={{ ...shimmer, width: '130px', height: '20px' }} />
          <div style={{ ...shimmer, width: '55px', height: '14px' }} />
        </div>
        <div style={{ ...shimmer, width: '108px', height: '34px', borderRadius: '7px' }} />
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(237,232,223,0.03)',
        border: '1px solid rgba(237,232,223,0.07)',
        borderRadius: '8px', overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 140px 120px 36px',
          padding: '9px 20px', borderBottom: '1px solid rgba(237,232,223,0.07)',
        }}>
          {['Tajuk','Status','Tarikh',''].map((_, i) => (
            <div key={i} style={i < 3 ? { ...shimmer, width: i === 0 ? '40px' : i === 1 ? '45px' : '50px', height: '9px' } : {}} />
          ))}
        </div>

        {/* Rows */}
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 140px 120px 36px',
            padding: '14px 20px', alignItems: 'center',
            borderBottom: i < 5 ? '1px solid rgba(237,232,223,0.04)' : 'none',
          }}>
            <div>
              <div style={{ ...shimmer, width: `${40 + (i * 13) % 40}%`, height: '14px', marginBottom: '5px', animationDelay: `${i * 0.06}s` }} />
              <div style={{ ...shimmer, width: `${20 + (i * 7) % 20}%`, height: '10px', animationDelay: `${i * 0.06 + 0.05}s` }} />
            </div>
            <div style={{ ...shimmer, width: '65px', height: '22px', borderRadius: '999px', animationDelay: `${i * 0.06}s` }} />
            <div style={{ ...shimmer, width: '75px', height: '13px', animationDelay: `${i * 0.06}s` }} />
            <div />
          </div>
        ))}
      </div>
    </div>
  )
}
