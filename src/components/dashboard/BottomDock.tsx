
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Ticket, PlusCircle, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAnnouncements } from "@/contexts/AnnouncementsContext";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/announcements", label: "Alerts", icon: Megaphone },
  { href: "/dashboard/create-ticket", label: "New Ticket", icon: PlusCircle },
];

export function BottomDock() {
  const pathname = usePathname();
  const { unreadCount: unreadAnnouncementsCount } = useAnnouncements();
  const isMobile = useIsMobile();

  // Conditions to hide the BottomDock on specific mobile pages
  const isChatPageOnMobile = isMobile && pathname === "/dashboard/chat";
  const isTicketDetailPageOnMobile = isMobile && pathname.startsWith('/dashboard/tickets/') && pathname.split('/').length > 3;

  if (isChatPageOnMobile || isTicketDetailPageOnMobile) {
    return null; // Do not render the dock on these pages in mobile view
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-stretch h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard/chat" && pathname.startsWith(item.href));
          const isCreateTicketActive = item.href === "/dashboard/create-ticket" ? pathname === item.href : isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center text-xs w-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-card rounded-sm relative",
                isCreateTicketActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-0.5", isCreateTicketActive ? "stroke-[2.25px]" : "stroke-[1.75px]")} />
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
