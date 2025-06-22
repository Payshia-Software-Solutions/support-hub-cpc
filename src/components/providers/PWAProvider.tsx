'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// This interface is needed because BeforeInstallPromptEvent is not in the default TS libs.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
          },
          (error) => {
            console.error('Service Worker registration failed:', error);
          }
        );
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Do not show the install prompt if the app is already installed
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
          return false;
      }
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
        setInstallPrompt(null);
        toast({ title: 'Success', description: 'App installed successfully!' });
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = () => {
    if (!installPrompt) {
      return;
    }
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
    });
  };
  
  return (
    <>
      {children}
      {installPrompt && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in-50">
          <Alert>
            <AlertTitle className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Install App
            </AlertTitle>
            <AlertDescription>
              Install this app for a better offline experience.
            </AlertDescription>
            <Button onClick={handleInstallClick} className="mt-4 w-full">
              Install
            </Button>
          </Alert>
        </div>
      )}
    </>
  );
}
