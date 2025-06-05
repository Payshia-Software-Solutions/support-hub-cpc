
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Ticket, Settings, Users, CreditCard, LayoutDashboard } from "lucide-react"; // Added CreditCard, Users
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

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tickets", label: "Manage Tickets", icon: Ticket },
  { href: "/admin/chat", label: "Manage Chats", icon: MessageSquare },
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/payments", label: "Payment Info", icon: CreditCard },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

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
           <SidebarMenuItem>
             <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/admin/settings")}
                tooltip={{children: "Settings", side: "right"}}
                className="justify-start"
              >
                <Link href="/admin/settings">
                  <Settings className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </Link>
              </SidebarMenuButton>
           </SidebarMenuItem>
           <SidebarMenuItem>
            <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://placehold.co/40x40.png?text=Adm" alt="Admin User" data-ai-hint="person avatar" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div className="group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@example.com</p>
              </div>
            </div>
           </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
