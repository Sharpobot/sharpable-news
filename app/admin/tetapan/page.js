export const dynamic = 'force-dynamic'

export default function TetapanPage() {
  return (
    <div style={{ padding: '32px', fontFamily: "'DM Sans', sans-serif", color: '#f0f0f0' }}>
      <h1 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700 }}>Tetapan</h1>
      <p style={{ margin: '0 0 32px', fontSize: '13px', color: '#56514d' }}>
        Konfigurasi panel admin Sharpable News.
      </p>

      <div style={{
        background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px',
        padding: '32px', textAlign: 'center', color: '#444',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>⚙</div>
        <div style={{ fontSize: '14px' }}>Halaman tetapan akan datang.</div>
      </div>
    </div>
  )
}
