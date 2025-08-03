import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from '@/components/providers/QueryProvider';
import { PWAProvider } from '@/components/providers/PWAProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Suspense } from 'react';
import { Preloader } from '@/components/ui/preloader';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'SOS App',
  description: 'Student Online Support App',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="SOS App" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SOS App" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#25D366" />
        <link rel="apple-touch-icon" href="https://content-provider.pharmacollege.lk/app-icon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="https://content-provider.pharmacollege.lk/app-icon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="https://content-provider.pharmacollege.lk/app-icon/favicon-16x16.png" />
        <link rel="shortcut icon" href="https://content-provider.pharmacollege.lk/app-icon/favicon.ico" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <PWAProvider>
                <Suspense fallback={<Preloader />}>
                  {children}
                </Suspense>
                <Toaster />
              </PWAProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
