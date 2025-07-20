

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
    WordPalletIcon,
    GoldMedalIcon,
    SilverMedalIcon,
    TopMedalIcon,
} from "@/components/icons/module-icons";
import { 
    ChevronRight,
    User,
    LogOut,
    Briefcase,
    FileText,
    Truck,
    ArrowRight,
    Target,
    Award
} from "lucide-react";

// --- Mock Data ---
const dummyCourses = [
    { id: "cpcc", name: "Certificate in Pharmacy Practice" },
    { id: "acpp", name: "Advanced Pharmacy Practice" },
    { id: "dn", name: "Diploma in Nutrition" },
];

const gradeData = [
  { title: "Test 1", value: 87, color: "bg-blue-500" },
  { title: "Test 2", value: 62, color: "bg-purple-500" },
  { title: "Test 3", value: 91, color: "bg-green-500" },
  { title: "Average Mark", value: 80, color: "bg-orange-500" },
];

const moduleData = [
  { title: "Recordings", icon: RecordingsIcon, href: "/dashboard/recordings" },
  { title: "Assignments", icon: AssignmentsIcon, href: "/dashboard/assignments" },
  { title: "Quiz", icon: QuizIcon, href: "/dashboard/quiz" },
  { title: "Exam", icon: ExamIcon, href: "/dashboard/exam" },
  { title: "Payments", icon: PaymentsIcon, href: "/dashboard/payments" },
  { title: "Tickets", icon: TicketsIcon, href: "/dashboard/tickets" },
];

const gameData = [
  { title: "WinPharma", icon: WinPharmaIcon, score: 1250, href: "/dashboard/winpharma" },
  { title: "D-Pad", icon: DPadIcon, score: 850, href: "/dashboard/d-pad" },
  { title: "Ceylon Pharmacy", icon: CeylonPharmacyIcon, score: 2400, href: "/dashboard/ceylon-pharmacy" },
  { title: "Pharma Hunter", icon: PharmaHunterIcon, score: 3100, href: "/dashboard/pharma-hunter" },
  { title: "Hunter Pro", icon: HunterProIcon, score: 1800, href: "/dashboard/hunter-pro" },
  { title: "Pharma Reader", icon: PharmaReaderIcon, score: 950, href: "/dashboard/pharma-reader" },
  { title: "Word Pallet", icon: WordPalletIcon, score: 1500, href: "/dashboard/word-pallet" },
];

const otherTasks = [
    { title: "Profile", icon: User, href: "/dashboard/profile"},
    { title: "Request CV", icon: FileText, href: "/dashboard/request-cv"},
    { title: "Apply Jobs", icon: Briefcase, href: "/dashboard/apply-jobs"},
    { title: "Delivery", icon: Truck, href: "/dashboard/delivery"},
];

const medals = [
  { name: "Silver", grade: 75, icon: SilverMedalIcon },
  { name: "Gold", grade: 85, icon: GoldMedalIcon },
  { name: "Top", grade: 90, icon: TopMedalIcon },
];


// --- Sub Components ---
const AchievementTracker = () => {
    const averageGrade = useMemo(() => {
        const averageItem = gradeData.find(g => g.title === "Average Mark");
        return averageItem ? averageItem.value : 0;
    }, []);

    const currentMedal = useMemo(() => {
        return [...medals].reverse().find(medal => averageGrade >= medal.grade);
    }, [averageGrade]);

    const nextMedal = useMemo(() => {
        return medals.find(medal => averageGrade < medal.grade);
    }, [averageGrade]);

    return (
        <Card className="shadow-lg hover:shadow-xl transition-all border-2 bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-4 sm:p-6">
                 <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                     <div className="shrink-0">
                        {currentMedal ? (
                            <currentMedal.icon className="w-20 h-20" />
                        ) : (
                            <div className="w-20 h-20 flex items-center justify-center bg-muted rounded-full">
                                <Award className="w-10 h-10 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-card-foreground">
                            {currentMedal ? `You've earned the ${currentMedal.name} Medal!` : "Your Next Achievement"}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            {nextMedal
                                ? `Reach an average of ${nextMedal.grade}% to unlock the ${nextMedal.name} Medal.`
                                : "Congratulations! You've unlocked all medals!"}
                        </p>
                    </div>
                    <div className="w-full sm:w-auto text-center sm:text-right">
                        <p className="text-xs text-muted-foreground">Current Average</p>
                        <p className="text-2xl font-bold text-primary">{averageGrade}%</p>
                    </div>
                </div>

                <div className="relative w-full h-10 mt-6">
                    <Progress value={averageGrade} className="h-3 absolute top-1/2 -translate-y-1/2 w-full bg-card" indicatorClassName="bg-blue-progress" />
                    {medals.map(medal => (
                        <div key={medal.name} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${medal.grade}%`, transform: 'translateX(-50%)' }}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                         <div className={cn("h-6 w-6 rounded-full flex items-center justify-center transition-all duration-300",
                                            averageGrade >= medal.grade ? "bg-primary" : "bg-muted-foreground/30"
                                         )}>
                                            <medal.icon className={cn("w-4 h-4 text-white transition-all", averageGrade >= medal.grade ? "opacity-100" : "opacity-50 grayscale")}/>
                                         </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{medal.name} Medal ({medal.grade}%)</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};


// --- Main Page Component ---
export default function StudentDashboardPage() {
    const { user, logout } = useAuth();
    const [defaultCourse, setDefaultCourse] = useState(dummyCourses[0].name);

    return (
        <div className="space-y-8 p-4 md:p-8 bg-background">

            {/* --- Profile Header --- */}
            <Card className="shadow-lg overflow-hidden">
                <div className="bg-card p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <Avatar className="w-20 h-20 text-3xl border-4 border-primary/50 shrink-0" data-ai-hint="student avatar">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <h1 className="text-2xl font-bold font-headline">{user?.name}</h1>
                        <p className="text-muted-foreground">{user?.username}</p>
                    </div>
                    <div className="sm:text-right shrink-0">
                        <p className="text-xs text-muted-foreground">Default Course</p>
                        <p className="font-semibold">{defaultCourse}</p>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="link" className="h-auto p-0 text-sm">Change</Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Change Default Course</DialogTitle>
                                    <DialogDescription>Select one of your enrolled courses to be your default.</DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-2">
                                    {dummyCourses.map((course) => (
                                        <DialogClose asChild key={course.id}>
                                            <Button
                                                variant={defaultCourse === course.name ? "default" : "outline"}
                                                onClick={() => setDefaultCourse(course.name)}
                                                className="w-full justify-start"
                                            >
                                                {course.name}
                                            </Button>
                                        </DialogClose>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </Card>
            
            {/* --- My Achievements --- */}
            <section>
                <h2 className="text-2xl font-semibold font-headline mb-4">My Achievements</h2>
                <AchievementTracker />
            </section>
            

            {/* --- My Grading --- */}
            <section>
                <h2 className="text-2xl font-semibold font-headline mb-4">My Grading</h2>
                <Card className="shadow-lg">
                    <CardContent className="p-4 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {gradeData.map((grade) => (
                            <div key={grade.title} className="bg-muted/50 p-4 rounded-lg text-center">
                                <p className="text-2xl md:text-3xl font-bold text-primary">{grade.value}%</p>
                                <p className="text-sm font-medium text-card-foreground mt-1">{grade.title}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            {/* --- Common Modules --- */}
            <section>
                <h2 className="text-2xl font-semibold font-headline mb-4">Common Modules</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {moduleData.map((mod) => (
                        <Link href={mod.href} key={mod.title} className="group">
                           <Card className="text-center p-4 h-full flex flex-col items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                               <mod.icon className="w-12 h-12 text-primary mb-2 transition-transform group-hover:scale-110" />
                               <p className="font-semibold text-sm text-card-foreground mt-1">{mod.title}</p>
                           </Card>
                        </Link>
                    ))}
                </div>
            </section>

             {/* --- Let's Play --- */}
            <section>
                <h2 className="text-2xl font-semibold font-headline mb-4">Let's Play!</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {gameData.map((game) => (
                        <Link href={game.href} key={game.title} className="group">
                            <Card className="relative p-3 h-full flex flex-col items-center justify-center shadow-lg hover:shadow-xl hover:border-primary/50 transition-all text-center">
                                <game.icon className="w-16 h-16 transition-transform group-hover:scale-110" />
                                <p className="font-bold text-lg text-card-foreground mt-2">{game.score}</p>
                                <p className="text-xs text-muted-foreground">{game.title}</p>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>


            {/* --- Other Tasks --- */}
            <section>
                 <h2 className="text-2xl font-semibold font-headline mb-4">Other Tasks</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {otherTasks.map((task) => (
                         <Link href={task.href} key={task.title} className="group">
                            <Card className="shadow-lg hover:shadow-xl hover:bg-muted/50 transition-all">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <task.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-semibold text-card-foreground group-hover:text-primary">{task.title}</h3>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                                </CardContent>
                            </Card>
                         </Link>
                     ))}
                     <Card className="shadow-lg hover:shadow-xl hover:bg-muted/50 transition-all group cursor-pointer" onClick={logout}>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-destructive/10 rounded-lg">
                                <LogOut className="w-6 h-6 text-destructive" />
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-semibold text-card-foreground group-hover:text-destructive">Sign Out</h3>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-destructive group-hover:translate-x-1 transition-transform" />
                        </CardContent>
                     </Card>
                 </div>
            </section>
        </div>
    );
}
