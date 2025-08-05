
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from '@/components/providers/QueryProvider';
import { PWAProvider } from '@/components/providers/PWAProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Suspense } from 'react';
import { Preloader } from '@/components/ui/preloader';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import { PT_Sans } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});


export const metadata: Metadata = {
  title: 'SOS App | Ceylon Pharma College',
  description: 'Student Support Hub by Ceylon Pharma College',
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
        {/* PWA Meta Tags */}
        <meta name="application-name" content="SOS App" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SOS App" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#64B5F6" />
        <link rel="apple-touch-icon" href="https://content-provider.pharmacollege.lk/app-icon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="https://content-provider.pharmacollege.lk/app-icon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="https://content-provider.pharmacollege.lk/app-icon/favicon-16x16.png" />
        <link rel="shortcut icon" href="https://content-provider.pharmacollege.lk/app-icon/favicon.ico" />
      </head>
      <body className={cn("font-body antialiased", ptSans.variable)}>
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
