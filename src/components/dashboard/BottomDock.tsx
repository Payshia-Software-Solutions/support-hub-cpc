
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard,
  Ticket,
  Megaphone, 
  MoreHorizontal,
  Gamepad2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/ceylon-pharmacy", label: "Games", icon: Gamepad2 },
  { href: "/dashboard/more", label: "More", icon: MoreHorizontal },
];

export function BottomDock() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { isMobileDetailActive } = useMobileDetailActive();

  if (!isMobile || isMobileDetailActive) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t">
      <div className="relative flex justify-around items-center h-16">
        {navItems.map((item) => {
          const currentItemIsActive = item.href === '/dashboard' 
              ? pathname === item.href 
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center text-xs font-medium w-full p-1 transition-all duration-300 ease-in-out focus:outline-none h-full",
                currentItemIsActive ? "text-primary -translate-y-3" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center transition-all duration-300 ease-in-out mb-1",
                 currentItemIsActive ? "w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-lg" : "w-8 h-8"
              )}>
                <item.icon className="h-6 w-6" />
              </div>
              <span className={cn(
                  "relative text-[11px]",
                  currentItemIsActive && "font-bold"
              )}>
                {item.label}
                 {currentItemIsActive && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-[3px] bg-primary rounded-full" />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
