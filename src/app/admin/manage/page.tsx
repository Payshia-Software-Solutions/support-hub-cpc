
"use client";

import { Card } from "@/components/ui/card";
import { ArrowRight, UserPlus, CreditCard, ClipboardList, Truck, GraduationCap, Award, Settings } from "lucide-react";
import Link from "next/link";

const managementTasks = [
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
    title: "Assignment Info",
    description: "View and manage assignment submissions and grades.",
    icon: <ClipboardList className="w-6 h-6 text-primary" />,
    href: "#",
  },
  {
    title: "Delivery Orders",
    description: "Track and manage study material deliveries.",
    icon: <Truck className="w-6 h-6 text-primary" />,
    href: "#",
  },
  {
    title: "Convocation",
    description: "Handle registrations for convocation ceremonies.",
    icon: <GraduationCap className="w-6 h-6 text-primary" />,
    href: "#",
  },
  {
    title: "Certificate Orders",
    description: "Process and manage requests for certificates.",
    icon: <Award className="w-6 h-6 text-primary" />,
    href: "#",
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {managementTasks.map((task) => (
            <Link key={task.title} href={task.href} className="group">
              <Card className="h-full hover:shadow-xl transition-shadow flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">{task.title}</CardTitle>
                  {task.icon}
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </CardContent>
                <CardFooter className="pt-4">
                  <div className="text-sm font-medium text-primary flex items-center group-hover:underline">
                    Go to {task.title}
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
