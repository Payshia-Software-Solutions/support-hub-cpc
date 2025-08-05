
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, UserPlus, CreditCard, ClipboardList, Truck, GraduationCap, Award, Settings, KeyRound, FileSignature, Banknote, Video, Search, UserCheck, Megaphone } from "lucide-react";
import Link from "next/link";

const managementTasks = [
  {
    title: "Announcements",
    description: "Create, edit, and publish announcements.",
    icon: <Megaphone className="w-6 h-6 text-primary" />,
    href: "/admin/announcements",
  },
  {
    title: "Find Student",
    description: "Search for a student to get a full overview.",
    icon: <Search className="w-6 h-6 text-primary" />,
    href: "/admin/quick-links",
  },
  {
    title: "Enroll Students",
    description: "Manage student course enrollments and batches.",
    icon: <UserPlus className="w-6 h-6 text-primary" />,
    href: "/admin/manage/enroll",
  },
  {
    title: "Payment Updates",
    description: "Record and verify student payments.",
    icon: <CreditCard className="w-6 h-6 text-primary" />,
    href: "/admin/manage/payment-update",
  },
   {
    title: "Payment Requests",
    description: "View and manage incoming payment requests.",
    icon: <Banknote className="w-6 h-6 text-primary" />,
    href: "/admin/manage/payment-requests",
  },
  {
    title: "Assignment Info",
    description: "View and manage assignment submissions and grades.",
    icon: <ClipboardList className="w-6 h-6 text-primary" />,
    href: "/admin/manage/assignment-info",
  },
  {
    title: "Delivery Orders",
    description: "Create and track study material deliveries.",
    icon: <Truck className="w-6 h-6 text-primary" />,
    href: "/admin/manage/delivery-orders",
  },
  {
    title: "Create Delivery Order",
    description: "Create a new delivery order for a student.",
    icon: <Truck className="w-6 h-6 text-primary" />,
    href: "/admin/manage/create-delivery-order",
  },
  {
    title: "Convocation",
    description: "Handle registrations for convocation ceremonies.",
    icon: <GraduationCap className="w-6 h-6 text-primary" />,
    href: "/admin/manage/convocation",
  },
  {
    title: "Certificate Orders",
    description: "Process and manage requests for certificates.",
    icon: <Award className="w-6 h-6 text-primary" />,
    href: "/admin/manage/certificate-orders",
  },
   {
    title: "Bulk Name Update",
    description: "Update student names on certificates in bulk.",
    icon: <FileSignature className="w-6 h-6 text-primary" />,
    href: "/admin/manage/bulk-name-update",
  },
  {
    title: "Convocation Name Edits",
    description: "Edit names for convocation certificates.",
    icon: <FileSignature className="w-6 h-6 text-primary" />,
    href: "/admin/manage/convocation-name-edits",
  },
  {
    title: "Certificate Order Name Edits",
    description: "Edit names for all certificate orders.",
    icon: <FileSignature className="w-6 h-6 text-primary" />,
    href: "/admin/manage/certificate-order-name-edits",
  },
   {
    title: "Convocation Orders",
    description: "View convocation orders by course and session.",
    icon: <ClipboardList className="w-6 h-6 text-primary" />,
    href: "/admin/manage/convocation-orders",
  },
   {
    title: "Manage Recordings",
    description: "Add, edit, or delete course video recordings.",
    icon: <Video className="w-6 h-6 text-primary" />,
    href: "/admin/recordings",
  },
  {
    title: "Password Reset",
    description: "Reset a student's account password.",
    icon: <KeyRound className="w-6 h-6 text-primary" />,
    href: "/admin/manage/password-reset",
  },
   {
    title: "Login As Student",
    description: "View the dashboard as a specific student.",
    icon: <UserCheck className="w-6 h-6 text-primary" />,
    href: "/admin/manage/login-as",
  },
  {
    title: "General Settings",
    description: "Configure system-wide settings for the admin panel.",
    icon: <Settings className="w-6 h-6 text-primary" />,
    href: "/admin/settings",
  },
];

export default function AdminManagePage() {
  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Management Tasks</h1>
        <p className="text-muted-foreground">Access various administrative tools and actions.</p>
      </header>
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {managementTasks.sort((a, b) => a.title.localeCompare(b.title)).map((task) => (
            <Link key={task.title} href={task.href} className="group block">
              <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 h-full">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
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
          ))}
        </div>
      </section>
    </div>
  );
}
