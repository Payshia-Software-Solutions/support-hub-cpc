
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  RecordingsIcon, 
  AssignmentsIcon, 
  QuizIcon, 
  ExamIcon, 
  PaymentsIcon, 
  TicketsIcon 
} from "@/components/icons/module-icons";
import Link from "next/link";

const modules = [
  {
    title: "Recordings",
    icon: <RecordingsIcon className="h-10 w-10" />,
    href: "/dashboard/recordings",
    progress: null,
  },
  {
    title: "Assignments",
    icon: <AssignmentsIcon className="h-10 w-10" />,
    href: "/dashboard/assignments",
    progress: null,
  },
  {
    title: "Quiz",
    icon: <QuizIcon className="h-10 w-10" />,
    href: "/dashboard/quiz",
    progress: 79,
  },
  {
    title: "Exam",
    icon: <ExamIcon className="h-10 w-10" />,
    href: "/dashboard/exam",
    progress: null,
  },
  {
    title: "Payments",
    icon: <PaymentsIcon className="h-10 w-10" />,
    href: "/dashboard/payments",
    progress: null,
  },
  {
    title: "Tickets",
    icon: <TicketsIcon className="h-10 w-10" />,
    href: "/dashboard/tickets",
    progress: null,
  },
];

const ModuleCard = ({ title, icon, href, progress }: { title: string, icon: React.ReactNode, href: string, progress: number | null }) => (
  <Link href={href}>
    <Card className="shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center text-center p-4 h-full aspect-square sm:aspect-auto">
      <CardContent className="p-0 flex flex-col items-center justify-center gap-3 flex-grow">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
        {progress !== null ? (
          <div className="w-full px-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs font-medium text-primary mt-1.5">{progress}%</p>
          </div>
        ) : (
           <div className="w-3/4 h-2 bg-muted rounded-full mt-1.5" />
        )}
      </CardContent>
    </Card>
  </Link>
);


export default function StudentDashboardPage() {
    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-2xl font-headline font-semibold">Common Modules</h1>
            </header>

            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {modules.map((mod) => (
                    <ModuleCard key={mod.title} {...mod} />
                ))}
            </section>
        </div>
    );
}
