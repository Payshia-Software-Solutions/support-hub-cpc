
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
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
        <SidebarTrigger />
        <Link href="/dashboard/chat" legacyBehavior passHref>
          <a className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-primary">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
            <span className="text-lg font-headline font-semibold text-card-foreground">Support Hub</span>
          </a>
        </Link>
      </div>
      {/* Future mobile-specific actions could go here */}
    </div>
  );
}
