import { Anybody, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["700"],
});

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
      className={`${anybody.variable} ${manrope.variable} ${spaceMono.variable} h-full antialiased scroll-smooth`}
    >
      <head>
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

