export default function Loading() {
  return (
    <div className="admin-page-content" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ width: '120px', height: '24px', background: '#1a1816', borderRadius: '4px' }} />
        <div style={{ width: '140px', height: '38px', background: '#1a1816', borderRadius: '6px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ background: '#111010', border: '1px solid rgba(237,232,223,0.07)', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#1a1816', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '60%', height: '15px', background: '#1a1816', borderRadius: '3px', marginBottom: '8px' }} />
                <div style={{ width: '80%', height: '12px', background: '#1a1816', borderRadius: '3px' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
