
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Ticket, PlusCircle, Megaphone, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAnnouncements } from "@/contexts/AnnouncementsContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useAuth } from "@/contexts/AuthContext";

const baseNavItems = [
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/announcements", label: "Alerts", icon: Megaphone },
  { href: "/dashboard/create-ticket", label: "New Ticket", icon: PlusCircle },
];

const adminNavItem = { href: "/admin/dashboard", label: "Admin", icon: Shield };

export function BottomDock() {
  const pathname = usePathname();
  const { unreadCount: unreadAnnouncementsCount } = useAnnouncements();
  const isMobile = useIsMobile();
  const { isMobileDetailActive } = useMobileDetailActive();
  const { user } = useAuth();

  // Hide the BottomDock if a mobile detail view is active
  if (isMobile && isMobileDetailActive) {
    return null;
  }
  
  const navItems = user?.role === 'staff' ? [...baseNavItems, adminNavItem] : baseNavItems;


  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-stretch h-16">
        {navItems.map((item) => {
          let currentItemIsActive = false;
          if (item.href === "/dashboard/create-ticket" || item.href === "/admin/dashboard") {
            currentItemIsActive = pathname.startsWith(item.href);
          } else if (item.href === "/dashboard/chat") {
            currentItemIsActive = pathname === item.href; // Active only for chat list
          } else {
             // For tickets and announcements, active if path starts with their href
            currentItemIsActive = pathname.startsWith(item.href);
          }


          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center text-xs w-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-card rounded-sm relative",
                currentItemIsActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-0.5", currentItemIsActive ? "stroke-[2.25px]" : "stroke-[1.75px]")} />
              <span>{item.label}</span>
              {item.href === "/dashboard/announcements" && unreadAnnouncementsCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute top-1 right-1/2 translate-x-[20px] h-4 min-w-[1rem] px-1 flex items-center justify-center text-[10px] rounded-full"
                >
                  {unreadAnnouncementsCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
