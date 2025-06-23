
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus, CreditCard, ClipboardList, Truck, GraduationCap, FileAward, Settings } from "lucide-react";
import Link from "next/link";

const managementTasks = [
  {
    title: "Enroll Students",
    description: "Manage student course enrollments and batches.",
    icon: <UserPlus className="w-8 h-8 text-primary" />,
    href: "#", // Placeholder
  },
  {
    title: "Payment Updates",
    description: "Record and verify student payments.",
    icon: <CreditCard className="w-8 h-8 text-primary" />,
    href: "#",
  },
  {
    title: "Assignment Info",
    description: "View and manage assignment submissions and grades.",
    icon: <ClipboardList className="w-8 h-8 text-primary" />,
    href: "#",
  },
  {
    title: "Delivery Orders",
    description: "Track and manage study material deliveries.",
    icon: <Truck className="w-8 h-8 text-primary" />,
    href: "#",
  },
  {
    title: "Convocation",
    description: "Handle registrations for convocation ceremonies.",
    icon: <GraduationCap className="w-8 h-8 text-primary" />,
    href: "#",
  },
  {
    title: "Certificate Orders",
    description: "Process and manage requests for certificates.",
    icon: <FileAward className="w-8 h-8 text-primary" />,
    href: "#",
  },
  {
    title: "General Settings",
    description: "Configure system-wide settings for the admin panel.",
    icon: <Settings className="w-8 h-8 text-primary" />,
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
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {managementTasks.map((task) => (
          <Link key={task.title} href={task.href} passHref>
            <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full cursor-pointer">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                {task.icon}
                <div className="flex-1">
                  <CardTitle>{task.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{task.description}</CardDescription>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                 <Button variant="outline" className="w-full justify-between">
                    Go to {task.title}
                    <ArrowRight className="h-4 w-4" />
                 </Button>
              </div>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
