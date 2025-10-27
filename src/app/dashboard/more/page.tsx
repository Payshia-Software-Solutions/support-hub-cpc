
"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Ticket,
  Megaphone,
  Award,
  Shield,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { MediMindIcon } from "@/components/icons/module-icons";

export default function MorePage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
    { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
    { href: "/dashboard/certificate-order", label: "Certificate Order", icon: Award },
    { href: "/dashboard/bnf", label: "BNF", icon: BookOpen },
    { href: "/dashboard/medimind", label: "MediMind", icon: MediMindIcon },
  ];

  const adminNavItem = { href: "/admin/dashboard", label: "Admin Panel", icon: Shield };

  if (user?.role === 'staff') {
    navItems.push(adminNavItem);
  }
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
      <header>
        <h1 className="text-3xl font-headline font-semibold">More Options</h1>
        <p className="text-muted-foreground">Manage your account and navigate the app.</p>
      </header>

      {user && (
        <Card className="shadow-lg">
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="h-16 w-16 text-2xl">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardContent className="p-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="block group">
                <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors">
                  <div className="flex items-center gap-4">
                    <item.icon className="h-6 w-6 text-primary" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

       <Card className="shadow-lg">
        <CardContent className="p-2">
            <div className="space-y-1">
                 <button onClick={toggleTheme} className="w-full flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-4">
                    {theme === 'light' ? <Sun className="h-6 w-6 text-primary" /> : <Moon className="h-6 w-6 text-primary" />}
                    <span className="font-medium">Toggle Theme</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>

                 <button onClick={logout} className="w-full flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors group text-destructive">
                  <div className="flex items-center gap-4">
                    <LogOut className="h-6 w-6" />
                    <span className="font-medium">Logout</span>
                  </div>
                   <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
