
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home,
  MessageCircle,
  Ticket,
  Megaphone,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';

const navItems = [
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/announcements", label: "Updates", icon: Megaphone },
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/chat", label: "Chat", icon: MessageCircle },
  { href: "/dashboard/profile", label: "Profile", icon: User },
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
      <div className="relative flex justify-around items-end h-16 pt-1">
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none"></div>
        {navItems.map((item) => {
          const currentItemIsActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-start text-xs font-medium w-full p-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-card rounded-md relative",
                currentItemIsActive ? "text-primary -translate-y-2" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center transition-all duration-300 ease-in-out mb-1",
                currentItemIsActive ? "w-12 h-12 bg-primary text-primary-foreground rounded-xl shadow-lg" : "w-8 h-8"
              )}>
                <item.icon className={cn("h-6 w-6 transition-transform", currentItemIsActive && "scale-110")} />
              </div>
              <span className="relative">
                {item.label}
                <div className={cn(
                  "absolute bottom-[-4px] left-0 w-full h-0.5 bg-primary transition-transform duration-300 ease-in-out",
                  currentItemIsActive ? "scale-x-100" : "scale-x-0"
                )}></div>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
