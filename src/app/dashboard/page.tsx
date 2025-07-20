
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  RecordingsIcon, 
  AssignmentsIcon, 
  QuizIcon, 
  ExamIcon, 
  PaymentsIcon, 
  TicketsIcon,
  WinPharmaIcon,
  DPadIcon,
  CeylonPharmacyIcon,
  PharmaHunterIcon,
  HunterProIcon,
  PharmaReaderIcon,
} from "@/components/icons/module-icons";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Gem, Coins } from "lucide-react";


const gradingData = [
  { title: "Test 01", score: 96.10, color: "bg-primary" },
  { title: "Test 02", score: 95.97, color: "bg-primary" },
  { title: "Test 03", score: 98.25, color: "bg-primary" },
  { title: "Average", score: 96.77, color: "bg-blue-progress" },
];


const GradeCard = ({ title, score, color }: { title: string, score: number, color: string }) => (
  <Card className="shadow-lg p-4">
    <CardContent className="p-0 flex flex-col items-center justify-center text-center gap-2">
      <h3 className="text-muted-foreground font-medium">{title}</h3>
      <p className="text-3xl font-bold">{score.toFixed(2)}%</p>
      <div className="w-full px-2">
        <Progress value={score} className="h-2 [&>div]:rounded-full" indicatorClassName={color} />
        <p className="text-xs font-medium text-muted-foreground mt-1.5">{score.toFixed(2)}%</p>
      </div>
    </CardContent>
  </Card>
);

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

const games = [
    {
      title: "Win Pharma",
      icon: <WinPharmaIcon className="h-12 w-12" />,
      href: "#",
      progress: 100,
      scoreText: "100.00%",
    },
    {
      title: "D Pad",
      icon: <DPadIcon className="h-12 w-12" />,
      href: "#",
      progress: 97,
      scoreText: "97%",
    },
    {
      title: "Ceylon Pharmacy",
      icon: <CeylonPharmacyIcon className="h-12 w-12" />,
      href: "#",
      progress: 100,
      scoreText: "50 out of 50",
    },
    {
      title: "Pharma Hunter",
      icon: <PharmaHunterIcon className="h-12 w-12" />,
      href: "#",
      progress: 100,
      gems: 1992,
      coins: 8,
    },
    {
      title: "Hunter Pro",
      icon: <HunterProIcon className="h-12 w-12" />,
      href: "#",
      progress: 0,
      gems: 0,
      coins: 0,
    },
    {
      title: "Pharma Reader",
      icon: <PharmaReaderIcon className="h-12 w-12" />,
      href: "#",
      progress: 0,
      scoreText: "0%",
    },
]

const ModuleCard = ({ title, icon, href, progress }: { title: string, icon: React.ReactNode, href: string, progress: number | null }) => (
  <Link href={href}>
    <Card className="shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center text-center p-4 h-full">
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

const GameCard = ({ title, icon, href, progress, scoreText, gems, coins }: { title: string, icon: React.ReactNode, href: string, progress: number, scoreText?: string, gems?: number, coins?: number }) => (
  <Link href={href}>
    <Card className="shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center text-center p-4 h-full">
        <CardContent className="p-0 flex flex-col items-center justify-center gap-3 flex-grow w-full">
            <div className="flex-shrink-0 mb-2">
              {icon}
            </div>
            <h3 className="text-lg font-bold text-card-foreground">{title}</h3>
            {scoreText && (
                <p className="text-sm text-muted-foreground font-medium">{scoreText}</p>
            )}
            {(gems !== undefined || coins !== undefined) ? (
                <div className="flex items-center justify-center gap-4 w-full">
                    {gems !== undefined && (
                        <div className="flex items-center gap-1 bg-muted/60 px-3 py-1 rounded-full text-sm font-medium text-foreground">
                            <Gem className="w-4 h-4 text-primary" /> {gems}
                        </div>
                    )}
                     {coins !== undefined && (
                        <div className="flex items-center gap-1 bg-muted/60 px-3 py-1 rounded-full text-sm font-medium text-foreground">
                            <Coins className="w-4 h-4 text-yellow-500" /> {coins}
                        </div>
                    )}
                </div>
            ) : null }
             <div className="w-full px-2 pt-1">
                <Progress value={progress} className="h-2 [&>div]:rounded-full" indicatorClassName="bg-blue-progress" />
            </div>
        </CardContent>
    </Card>
  </Link>
);


export default function StudentDashboardPage() {
    return (
        <div className="p-4 md:p-6 space-y-8 pb-20">
             <section>
                <h1 className="text-2xl font-headline font-semibold mb-4">My Grading</h1>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {gradingData.map((grade) => (
                        <GradeCard key={grade.title} {...grade} />
                    ))}
                </div>
            </section>

             <section>
                <h1 className="text-2xl font-headline font-semibold">Let's Play</h1>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-4">
                    {games.map((game) => (
                        <GameCard key={game.title} {...game} />
                    ))}
                </div>
            </section>

            <section>
                <h1 className="text-2xl font-headline font-semibold">Common Modules</h1>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-4">
                    {modules.map((mod) => (
                        <ModuleCard key={mod.title} {...mod} />
                    ))}
                </div>
            </section>
        </div>
    );
}
