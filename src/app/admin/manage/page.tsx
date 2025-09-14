"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, UserPlus, CreditCard, ClipboardList, Truck, GraduationCap, Award, Settings, KeyRound, FileSignature, Banknote, Video, Search, UserCheck, Megaphone, UserCog, BookOpen, BarChart, Cake, Library, Percent, Briefcase } from "lucide-react";
import Link from "next/link";
import { useMemo } from 'react';
import { cn } from "@/lib/utils";

type ManagementTask = {
    title: string;
    description: string;
    icon: React.ReactElement;
    href: string;
    category: 'Student Management' | 'Financial' | 'Content & System' | 'Certificates & Convocation';
};

const managementTasks: ManagementTask[] = [
  {
    title: "Announcements",
    description: "Create, edit, and publish announcements.",
    icon: <Megaphone className="w-8 h-8 text-white" />,
    href: "/admin/announcements",
    category: "Content & System"
  },
  {
    title: "Find Student",
    description: "Search for a student to get a full overview.",
    icon: <Search className="w-8 h-8 text-white" />,
    href: "/admin/quick-links",
    category: "Student Management"
  },
  {
    title: "Enroll Students",
    description: "Manage student course enrollments and batches.",
    icon: <UserPlus className="w-8 h-8 text-white" />,
    href: "/admin/manage/enroll",
    category: "Student Management"
  },
   {
    title: "Manage Batches",
    description: "View, add, and edit batch information and fees.",
    icon: <BookOpen className="w-8 h-8 text-white" />,
    href: "/admin/manage/batches",
    category: "Content & System"
  },
  {
    title: "Manage Courses",
    description: "Manage parent courses and their details.",
    icon: <Library className="w-8 h-8 text-white" />,
    href: "/admin/manage/courses",
    category: "Content & System"
  },
   {
    title: "Commissions Management",
    description: "Set up staff rates and management commission hierarchies.",
    icon: <Percent className="w-8 h-8 text-white" />,
    href: "/admin/manage/commissions",
    category: "Financial"
  },
  {
    title: "Payment Updates",
    description: "Record and verify student payments.",
    icon: <CreditCard className="w-8 h-8 text-white" />,
    href: "/admin/manage/payment-update",
    category: "Financial"
  },
   {
    title: "Payment Requests",
    description: "View and manage incoming payment requests.",
    icon: <Banknote className="w-8 h-8 text-white" />,
    href: "/admin/manage/payment-requests",
    category: "Financial"
  },
  {
    title: "Assignment Info",
    description: "View and manage assignment submissions.",
    icon: <ClipboardList className="w-8 h-8 text-white" />,
    href: "/admin/manage/assignment-info",
    category: "Student Management"
  },
  {
    title: "Delivery Orders",
    description: "Create and track study material deliveries.",
    icon: <Truck className="w-8 h-8 text-white" />,
    href: "/admin/manage/delivery-orders",
    category: "Content & System"
  },
  {
    title: "Create Delivery Order",
    description: "Create a new delivery order for a student.",
    icon: <Truck className="w-8 h-8 text-white" />,
    href: "/admin/manage/create-delivery-order",
    category: "Content & System"
  },
  {
    title: "Generate Confirmation Letter",
    description: "Generate a proof of registration letter for a student.",
    icon: <FileSignature className="w-8 h-8 text-white" />,
    href: "/admin/manage/generate-confirmation-letter",
    category: "Student Management"
  },
  {
    title: "Convocation",
    description: "Handle registrations for convocation ceremonies.",
    icon: <GraduationCap className="w-8 h-8 text-white" />,
    href: "/admin/manage/convocation",
    category: "Certificates & Convocation"
  },
  {
    title: "Certificate Orders",
    description: "Process and manage requests for certificates.",
    icon: <Award className="w-8 h-8 text-white" />,
    href: "/admin/manage/certificate-orders",
    category: "Certificates & Convocation"
  },
   {
    title: "Bulk Name Update",
    description: "Update student names on certificates in bulk.",
    icon: <FileSignature className="w-8 h-8 text-white" />,
    href: "/admin/manage/bulk-name-update",
    category: "Certificates & Convocation"
  },
  {
    title: "Convocation Name Edits",
    description: "Edit names for convocation certificates.",
    icon: <FileSignature className="w-8 h-8 text-white" />,
    href: "/admin/manage/convocation-name-edits",
    category: "Certificates & Convocation"
  },
  {
    title: "Certificate Order Name Edits",
    description: "Edit names for all certificate orders.",
    icon: <FileSignature className="w-8 h-8 text-white" />,
    href: "/admin/manage/certificate-order-name-edits",
    category: "Certificates & Convocation"
  },
   {
    title: "Convocation Orders",
    description: "View convocation orders by course and session.",
    icon: <ClipboardList className="w-8 h-8 text-white" />,
    href: "/admin/manage/convocation-orders",
    category: "Certificates & Convocation"
  },
  {
    title: "Generate Certificate",
    description: "Manually generate a certificate for an eligible student.",
    icon: <Award className="w-8 h-8 text-white" />,
    href: "/admin/manage/generate-certificate",
    category: "Certificates & Convocation"
  },
   {
    title: "Manage Recordings",
    description: "Add, edit, or delete course video recordings.",
    icon: <Video className="w-8 h-8 text-white" />,
    href: "/admin/recordings",
    category: "Content & System"
  },
  {
    title: "Password Reset",
    description: "Reset a student's account password.",
    icon: <KeyRound className="w-8 h-8 text-white" />,
    href: "/admin/manage/password-reset",
    category: "Student Management"
  },
   {
    title: "Login As Student",
    description: "View the dashboard as a specific student.",
    icon: <UserCheck className="w-8 h-8 text-white" />,
    href: "/admin/manage/login-as",
    category: "Student Management"
  },
  {
    title: "BNF Management",
    description: "Add, edit, and manage BNF content.",
    icon: <BookOpen className="w-8 h-8 text-white" />,
    href: "/admin/manage/bnf",
    category: "Content & System"
  },
  {
    title: "Student Analytics",
    description: "View student data by location and demographics.",
    icon: <BarChart className="w-8 h-8 text-white" />,
    href: "/admin/manage/analytics",
    category: "Student Management"
  },
    {
    title: "Analytics Report",
    description: "Generate and filter detailed student reports.",
    icon: <FileSignature className="w-8 h-8 text-white" />,
    href: "/admin/manage/analytics/report",
    category: "Student Management"
  },
  {
    title: "Birthday Wishes",
    description: "Send birthday greetings to students.",
    icon: <Cake className="w-8 h-8 text-white" />,
    href: "/admin/manage/birthday-wishes",
    category: "Student Management"
  },
  {
    title: "General Settings",
    description: "Configure system-wide settings for the admin panel.",
    icon: <Settings className="w-8 h-8 text-white" />,
    href: "/admin/settings",
    category: "Content & System"
  },
];

const categoryColors: Record<ManagementTask['category'], string> = {
    'Student Management': 'from-blue-400 to-indigo-500',
    'Certificates & Convocation': 'from-purple-400 to-pink-500',
    'Financial': 'from-green-400 to-teal-500',
    'Content & System': 'from-orange-400 to-rose-500',
}

const TaskCard = ({ task }: { task: ManagementTask }) => (
    <Link href={task.href} className="group block h-full">
        <Card className="shadow-lg hover:shadow-xl transition-all duration-200 h-full border-0">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-3 rounded-lg bg-gradient-to-br", categoryColors[task.category])}>
                    {task.icon}
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
            </CardContent>
        </Card>
    </Link>
);


export default function AdminManagePage() {
    const groupedTasks = useMemo(() => {
        return managementTasks.reduce((acc, task) => {
            if (!acc[task.category]) {
                acc[task.category] = [];
            }
            acc[task.category].push(task);
            return acc;
        }, {} as Record<string, ManagementTask[]>);
    }, []);

    const categoryOrder: (keyof typeof groupedTasks)[] = [
        'Student Management',
        'Certificates & Convocation',
        'Financial',
        'Content & System'
    ];


  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Management Tasks</h1>
        <p className="text-muted-foreground">Access various administrative tools and actions.</p>
      </header>
      
      <div className="space-y-10">
        {categoryOrder.map(category => (
            <section key={category}>
                <div className="flex items-center gap-3 mb-4">
                    <UserCog className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-semibold font-headline">{category}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedTasks[category].sort((a,b) => a.title.localeCompare(b.title)).map(task => (
                        <TaskCard key={task.href} task={task} />
                    ))}
                </div>
            </section>
        ))}
      </div>
    </div>
  );
}
