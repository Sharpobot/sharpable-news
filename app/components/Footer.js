export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              Sharpable<span className="logo-dot" style={{ marginBottom: '3px' }}></span>
            </div>
            <p className="footer-desc">Kewartawanan AI bebas untuk penyelidik, pembangun, dan pembuat keputusan. Meliput sempadan baharu sejak 2024.</p>
            <div className="footer-social">
              <a href="#" className="soc-link" title="X / Twitter">𝕏</a>
              <a href="#" className="soc-link" title="LinkedIn">in</a>
              <a href="#" className="soc-link" title="RSS Feed">
                <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20 4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <div className="fc-title">Liputan</div>
            <div className="fc-links">
              <a href="#" className="fc-link">Penyelidikan</a>
              <a href="#" className="fc-link">Permulaan</a>
              <a href="#" className="fc-link">Alatan &amp; Produk</a>
              <a href="#" className="fc-link">Dasar</a>
              <a href="#" className="fc-link">Analisis</a>
              <a href="#" className="fc-link">Industri</a>
            </div>
          </div>

          <div>
            <div className="fc-title">Syarikat</div>
            <div className="fc-links">
              <a href="#" className="fc-link">Tentang Kami</a>
              <a href="#" className="fc-link">Lembaga Redaksi</a>
              <a href="#" className="fc-link">Iklan</a>
              <a href="#" className="fc-link">Kerjaya</a>
              <a href="#" className="fc-link">Hubungi</a>
            </div>
          </div>

          <div>
            <div className="fc-title">Surat Berita</div>
            <div className="fc-links">
              <a href="#" className="fc-link">Ringkasan Harian</a>
              <a href="#" className="fc-link">Digest Penyelidikan</a>
              <a href="#" className="fc-link">Pantau Permulaan</a>
              <a href="#" className="fc-link">Monitor Dasar</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="fb-text">© 2026 Sharpable News. Hak cipta terpelihara.</span>
          <div className="fb-links">
            <a href="#" className="fb-link">Privasi</a>
            <a href="#" className="fb-link">Syarat</a>
            <a href="#" className="fb-link">Dasar Kuki</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
