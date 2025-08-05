
"use client";

import Link from "next/link";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function MobileHeader() {
  const { isMobileDetailActive } = useMobileDetailActive();
  const isMobile = useIsMobile();
  const { user } = useAuth();

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
      <Link href="/dashboard/more" passHref>
        <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>
    </div>
  );
}
