
"use client";

import Link from "next/link";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Shield, LogOut, Home } from "lucide-react";

export function MobileHeader() {
  const { isMobileDetailActive } = useMobileDetailActive();
  const isMobile = useIsMobile();
  const { user, logout, isImpersonating } = useAuth();

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
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 w-10 rounded-full">
            <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Open user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
           <DropdownMenuItem asChild>
            <Link href="/dashboard/more">
              <MoreHorizontal className="mr-2 h-4 w-4" />
              <span>More Options</span>
            </Link>
          </DropdownMenuItem>
          {user?.role === 'staff' && !isImpersonating && (
             <DropdownMenuItem asChild>
                <Link href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Student View</span>
                </Link>
            </DropdownMenuItem>
          )}
          {user?.role === 'staff' && (
            <DropdownMenuItem asChild>
                <Link href="/admin/dashboard">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
           <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </div>
  );
}
