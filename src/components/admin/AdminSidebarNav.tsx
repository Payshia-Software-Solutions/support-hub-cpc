
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Ticket, LayoutDashboard, LogOut, Search, Wrench, Megaphone } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { ThemeSwitcher } from "../ui/ThemeSwitcher";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tickets", label: "Manage Tickets", icon: Ticket },
  { href: "/admin/chat", label: "Manage Chats", icon: MessageSquare },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/quick-links", label: "Find", icon: Search },
  { href: "/admin/manage", label: "Manage", icon: Wrench },
];

export function AdminSidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary hidden md:block">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 7h2v2h-2zm0 4h2v6h-2z"/>
          </svg>
           <h1 className="text-xl font-headline font-semibold group-data-[collapsible=icon]:hidden hidden md:block">Admin Panel</h1>
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
                isActive={pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))}
                tooltip={{ children: item.label, side: "right" }}
                className="justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
        <SidebarMenu>
            <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
              <div className="group-data-[collapsible=icon]:hidden">
                <ThemeSwitcher />
              </div>
              <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={logout}
                    tooltip={{children: "Logout", side: "right"}}
                    className="justify-center"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only group-data-[collapsible=icon]:not-sr-only group-data-[collapsible=expanded]:sr-only">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </div>
           {user && (
            <SidebarMenuItem>
                <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person avatar" />
                    <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                </div>
            </SidebarMenuItem>
           )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
