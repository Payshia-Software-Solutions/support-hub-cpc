
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
  BookText,
  Gamepad2,
  GraduationCap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { MediMindIcon } from "@/components/icons/module-icons";
import { useQuery } from "@tanstack/react-query";
import { getStudentEnrollments } from "@/lib/actions/users";
import { getCourses } from "@/lib/actions/courses";
import type { StudentEnrollmentInfo, Course } from "@/lib/types";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function MorePage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
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
    const baseItems = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
      { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
      { href: "/dashboard/certificate-order", label: "Certificate Order", icon: Award },
      { href: "/dashboard/convocation-booking", label: "Convocation Booking", icon: GraduationCap },
      { href: "/dashboard/bnf", label: "BNF", icon: BookOpen },
      { href: "/dashboard/games", label: "All Games", icon: Gamepad2 }
    ];

    if (user?.role === 'staff') {
      baseItems.push({ href: "/admin/dashboard", label: "Admin Panel", icon: Shield });
    }
    
    return baseItems;
  }, [user?.role]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

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
      } else {
          router.push(item.href);
      }
  };


  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
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
              <a key={item.href} href={item.href} onClick={(e) => handleLinkClick(e, item as any)} className="block group cursor-pointer">
                <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors">
                  <div className="flex items-center gap-4">
                    <item.icon className="h-6 w-6 text-primary" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
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
