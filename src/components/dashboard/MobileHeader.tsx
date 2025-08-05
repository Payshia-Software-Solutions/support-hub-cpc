
"use client";

import Link from "next/link";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useIsMobile } from "@/hooks/use-mobile";

export function MobileHeader() {
  const { isMobileDetailActive } = useMobileDetailActive();
  const isMobile = useIsMobile();

  // Hide the header if a mobile detail view is active
  if (isMobile && isMobileDetailActive) {
    return null;
  }

  return (
    <div className="md:hidden flex items-center justify-between p-2 h-14 border-b bg-card sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" legacyBehavior passHref>
          <a className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-7 h-7 text-primary">
              <circle cx="12" cy="12" r="10" fill="currentColor"/>
              <path d="M12 17V15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 7V12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-lg font-headline font-semibold text-card-foreground">SOS App</span>
          </a>
        </Link>
      </div>
      {/* Future mobile-specific actions could go here */}
    </div>
  );
}
