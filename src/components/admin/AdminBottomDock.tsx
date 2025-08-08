
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Ticket, Search, Wrench, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tickets", label: "Tickets", icon: Ticket },
  { href: "/admin/chat", label: "Chats", icon: MessageSquare },
  { href: "/admin/manage", label: "Manage", icon: Wrench },
  { href: "/admin/more", label: "More", icon: MoreHorizontal },
];

export function AdminBottomDock() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { isMobileDetailActive } = useMobileDetailActive();

  // Hide the BottomDock if not on mobile or if a mobile detail view is active
  if (!isMobile || isMobileDetailActive) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const currentItemIsActive = item.href === '/admin/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center text-xs font-medium w-full h-full p-1 transition-colors duration-200",
                currentItemIsActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                 currentItemIsActive && "bg-primary/10"
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className="mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
