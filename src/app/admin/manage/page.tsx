
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
    href: "#",
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
        <Card className="shadow-lg overflow-hidden">
            <ul className="divide-y divide-border">
                {managementTasks.map((task) => (
                    <li key={task.title}>
                        <Link 
                            href={task.href}
                            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                        >
                            <div className="flex items-start sm:items-center gap-4">
                                <div className="mt-1 sm:mt-0 shrink-0">
                                    {task.icon}
                                </div>
                                <div>
                                    <p className="font-semibold text-card-foreground">{task.title}</p>
                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 ml-4" />
                        </Link>
                    </li>
                ))}
            </ul>
        </Card>
      </section>
    </div>
  );
}
