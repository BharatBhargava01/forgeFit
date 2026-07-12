import './globals.css';

export const metadata = {
  title: 'ForgeFit — AI Workout & Routine Generator',
  description: 'Generate personalized workouts and training routines. Choose your muscle groups, difficulty, and duration — get a complete program instantly.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ForgeFit" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#15161b] text-[#1e1f22] antialiased min-h-screen selection:bg-[#a389f4] selection:text-white font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
