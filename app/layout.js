import "./globals.css";

export const metadata = {
  title: "MindSpace Library | Ambikapur's Premier Study Sanctuary",
  description: "A premium Study Sanctuary designed for deep work and academic excellence in Ambikapur. Founded by Harsh Goyal.",
  verification: {
    google: "5FbJYNE7ParVx7pRiN2mUOvHaXAxrPAmtwAhr9izMIs",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased scroll-smooth"
      style={{ '--font-anybody': '"Anybody", sans-serif', '--font-manrope': '"Manrope", sans-serif', '--font-space-mono': '"Space Mono", monospace' }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anybody:wght@700;800;900&family=Manrope:wght@300;400;700&family=Space+Mono:wght@700&display=swap" rel="stylesheet" />
        <meta name="google-site-verification" content="5FbJYNE7ParVx7pRiN2mUOvHaXAxrPAmtwAhr9izMIs" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#FDFBF7] text-[#151d1a] font-body paper-texture">
        {children}
      </body>
    </html>
  );
}

