import './globals.css'

export const metadata = {
  title: 'Sharpable News — Kecerdasan Buatan',
  description: 'Kewartawanan AI bebas meliput penyelidikan, syarikat permulaan, alatan, dan industri. Untuk penyelidik, pembangun, dan pembuat keputusan.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ms">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        {/* Blocking theme init — prevents flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('sn-theme')||'light';document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
