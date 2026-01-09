
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  MessageSquare, 
  Ticket, 
  PlusCircle, 
  Megaphone, 
  LogOut, 
  Shield, 
  LayoutDashboard, 
  Video,
  FileText,
  ClipboardCheck,
  Award,
  CreditCard,
  MoreHorizontal,
  BookOpen,
  Gamepad2,
  BookText
} from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { ThemeSwitcher } from "../ui/ThemeSwitcher";
import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";
import { MediMindIcon } from "../icons/module-icons";
import { useQuery } from "@tanstack/react-query";
import { getStudentEnrollments } from "@/lib/actions/users";
import { getCourses } from "@/lib/actions/courses";
import type { StudentEnrollmentInfo, Course } from "@/lib/types";
import { useMemo, useState, useEffect } from "react";
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/bnf", label: "BNF", icon: BookOpen },
  { href: "/dashboard/d-pad", label: "D-Pad", icon: Gamepad2 },
  { href: "/dashboard/ceylon-pharmacy", label: "Ceylon Pharmacy", icon: Gamepad2 },
  { href: "/dashboard/medimind", label: "MediMind", icon: MediMindIcon },
  { href: "/dashboard/more", label: "More", icon: MoreHorizontal },
];

const sentenceBuilderItem = { href: "/dashboard/games/sentence-builder", label: "Sentence Builder", icon: BookText, requiredCourses: ["CPCC28", "CPCC27"] };

const adminNavItem = { href: "/admin/dashboard", label: "Admin Panel", icon: Shield };

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);
  const router = useRouter();
  const [dialogContent, setDialogContent] = useState<{ title: string; description: string } | null>(null);

  useEffect(() => {
    const storedCourseCode = localStorage.getItem('selected_course');
    if (storedCourseCode) {
        setSelectedCourseCode(storedCourseCode);
    }
  }, []);
  
  const { data: allCourses } = useQuery<Course[]>({
    queryKey: ['allCourses'],
    queryFn: getCourses,
    staleTime: Infinity,
  });
  
  const navItems = useMemo(() => {
    let items = [...baseNavItems];
    
    // Always add Sentence Builder to the list
    const moreIndex = items.findIndex(item => item.href === '/dashboard/more');
    if (moreIndex !== -1) {
      items.splice(moreIndex, 0, sentenceBuilderItem);
    } else {
      items.push(sentenceBuilderItem);
    }

    return items;
  }, []);

  const currentNavItems = user?.role === 'staff' ? [...navItems, adminNavItem] : navItems;

  const handleLinkClick = (e: React.MouseEvent, item: { href: string; requiredCourses?: string[] }) => {
      if (item.requiredCourses && (!selectedCourseCode || !item.requiredCourses.includes(selectedCourseCode))) {
            e.preventDefault();
             const requiredCourseNames = allCourses
                ?.filter(c => item.requiredCourses!.includes(c.courseCode))
                .map(c => `${c.name} (${c.courseCode})`)
                .join(' or ');
            
            setDialogContent({
                title: "Course Requirement Not Met",
                description: `This game is only available for students enrolled in: ${requiredCourseNames || item.requiredCourses.join(', ')}.`,
            });
      }
  };


  if (isMobile) {
    return null;
  }

  return (
    <>
    <AlertDialog open={!!dialogContent} onOpenChange={() => setDialogContent(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{dialogContent?.title}</AlertDialogTitle>
                <AlertDialogDescription>{dialogContent?.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setDialogContent(null)}>OK</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Image src="https://content-provider.pharmacollege.lk/app-icon/android-chrome-192x192.png" alt="SOS App Logo" width={32} height={32} className="w-8 h-8 hidden md:block" />
           <h1 className="text-xl font-headline font-semibold group-data-[collapsible=icon]:hidden hidden md:block">SOS App</h1>
        </div>
         <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
           <SidebarTrigger />
         </Button>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {currentNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)}
                tooltip={{ children: item.label, side: "right" }}
                className="justify-start"
                 onClick={(e: React.MouseEvent) => handleLinkClick(e, item as any)}
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
    </>
  );
}
