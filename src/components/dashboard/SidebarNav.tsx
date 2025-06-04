
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Ticket, PlusCircle, Settings, Users, Megaphone } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAnnouncements } from "@/contexts/AnnouncementsContext";

const navItems = [
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/create-ticket", label: "Create Ticket", icon: PlusCircle },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { unreadCount: unreadAnnouncementsCount } = useAnnouncements();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary hidden md:block">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
           <h1 className="text-xl font-headline font-semibold group-data-[collapsible=icon]:hidden hidden md:block">Support Hub</h1>
        </div>
         <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
           <SidebarTrigger />
         </Button>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label, side: "right" }}
                className="justify-start"
                onClick={() => {
                  // This onClick is for the SidebarMenuButton itself if needed,
                  // Link component handles navigation.
                }}
              >
                <Link href={item.href}> {/* Use Link directly for navigation */}
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  {item.href === "/dashboard/announcements" && unreadAnnouncementsCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-auto h-5 px-1.5 text-xs group-data-[collapsible=icon]:hidden"
                    >
                      {unreadAnnouncementsCount}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
        <SidebarMenu>
           <SidebarMenuItem>
             <SidebarMenuButton
                asChild
                tooltip={{children: "Settings", side: "right"}}
                className="justify-start"
              >
                <Link href="#">
                  <Settings className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </Link>
              </SidebarMenuButton>
           </SidebarMenuItem>
           <SidebarMenuItem>
            <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="person avatar" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium">User Name</p>
                <p className="text-xs text-muted-foreground">user@example.com</p>
              </div>
            </div>
           </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
