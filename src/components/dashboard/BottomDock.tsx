
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard,
  Ticket,
  Megaphone, 
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/announcements", label: "Updates", icon: Megaphone },
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t">
      <div className="relative flex justify-around items-end h-14 pt-1">
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none"></div>
        {navItems.map((item) => {
          const currentItemIsActive = item.href === '/dashboard' 
              ? pathname === item.href 
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center text-xs font-medium w-full p-1 transition-all duration-300 ease-in-out focus:outline-none rounded-md relative h-full",
                currentItemIsActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center transition-all duration-300 ease-in-out mb-0.5",
                 currentItemIsActive ? "w-10 h-10 bg-primary text-primary-foreground rounded-lg shadow-lg" : "w-8 h-8"
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className="relative text-[11px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
