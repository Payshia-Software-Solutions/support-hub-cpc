
"use client";

import Link from "next/link";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";
import { useEffect, useState } from "react";

export function MobileHeader() {
  const { isMobileDetailActive } = useMobileDetailActive();
  const isMobile = useIsMobile();
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const timerId = setInterval(updateClock, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Hide the header if a mobile detail view is active
  if (isMobile && isMobileDetailActive) {
    return null;
  }

  return (
    <div className="md:hidden flex items-center justify-between p-2 h-14 border-b bg-card sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" legacyBehavior passHref>
          <a className="flex items-center gap-2">
            <Image src="https://content-provider.pharmacollege.lk/app-icon/android-chrome-192x192.png" alt="SOS App Logo" width={28} height={28} className="w-7 h-7" />
            <span className="text-lg font-headline font-semibold text-card-foreground">SOS App</span>
          </a>
        </Link>
      </div>
      <div className="text-sm font-medium text-muted-foreground font-mono">
        {time}
      </div>
    </div>
  );
}
