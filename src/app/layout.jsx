import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-outfit',
});

export const metadata = {
  title: 'ForgeFit — AI Workout & Routine Generator',
  description: 'Generate personalized workouts and training routines. Choose your muscle groups, difficulty, and duration — get a complete program instantly.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ForgeFit" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-[#0a0a0f] text-[#ededed] antialiased min-h-screen selection:bg-orange-500 selection:text-white font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
