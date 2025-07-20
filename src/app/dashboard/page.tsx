
"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { 
    User, 
    LogOut, 
    ArrowRight, 
    GraduationCap, 
    MessageSquare,
    Ticket,
    Video,
    FileText,
    ClipboardCheck,
    Trophy,
    Gem,
    Coins,
} from "lucide-react";


const CircularProgress = ({ value, size = 60, strokeWidth = 5 }: { value: number; size?: number; strokeWidth?: number; }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="absolute top-0 left-0 w-full h-full -rotate-90" width={size} height={size}>
                <circle
                    className="text-muted/30"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className="text-primary"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                />
            </svg>
            <div className="absolute top-0 left-0 flex items-center justify-center w-full h-full">
                <span className="text-sm font-semibold text-foreground">{`${Math.round(value)}%`}</span>
            </div>
        </div>
    );
};


const dummyCoursesData = [
    { id: "cpcc", name: "Certificate in Pharmacy Practice", progress: 78, thumbnail: "/images/course-pharmacy.jpg", dataAiHint: "pharmacy lab" },
    { id: "acpp", name: "Advanced Pharmacy Practice", progress: 45, thumbnail: "/images/course-advanced.jpg", dataAiHint: "modern classroom" },
    { id: "dn", name: "Diploma in Nutrition", progress: 15, thumbnail: "/images/course-nutrition.jpg", dataAiHint: "healthy food" },
];

const dummyGameStats = [
    { name: "Pharma Hunter", icon: Trophy, value: "Level 12", color: "text-amber-500" },
    { name: "Gems", icon: Gem, value: "1,992", color: "text-blue-500" },
    { name: "Coins", icon: Coins, value: "8", color: "text-yellow-500" },
];

const supportServices = [
    { title: "Live Chat", description: "Get instant help from our support team.", icon: MessageSquare, href: "/dashboard/chat" },
    { title: "Support Tickets", description: "Create and track support requests.", icon: Ticket, href: "/dashboard/tickets" },
];

const learningModules = [
    { title: "Recordings", icon: Video, href: "/dashboard/recordings" },
    { title: "Assignments", icon: FileText, href: "/dashboard/assignments" },
    { title: "Quizzes", icon: ClipboardCheck, href: "/dashboard/quiz" },
]


export default function StudentDashboardPage() {
    const { user, logout } = useAuth();
    
    return (
        <div className="min-h-screen bg-muted/30">
            <div className="p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pb-20">
                
                {/* Main Content */}
                <main className="lg:col-span-2 space-y-8">
                    <header>
                        <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">
                            Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
                        </h1>
                        <p className="text-muted-foreground mt-1">Let's continue your learning journey.</p>
                    </header>

                    <section>
                        <h2 className="text-2xl font-semibold font-headline mb-4">My Courses</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {dummyCoursesData.map((course) => (
                                <Card key={course.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-primary/10 rounded-lg">
                                                <GraduationCap className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-bold leading-tight">{course.name}</CardTitle>
                                            </div>
                                        </div>
                                         <div className="flex-shrink-0">
                                            <CircularProgress value={course.progress} />
                                        </div>
                                    </CardHeader>
                                    <CardFooter className="mt-auto">
                                        <Button asChild className="w-full">
                                            <Link href="#">
                                                Continue Learning <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <section>
                         <h2 className="text-2xl font-semibold font-headline mb-4">Learning Modules</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {learningModules.map((service) => (
                                <Card key={service.title} className="shadow-lg hover:shadow-xl transition-shadow text-center">
                                    <CardContent className="p-6">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-4">
                                            <service.icon className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="font-semibold">{service.title}</h3>
                                        <Button variant="link" asChild className="mt-2">
                                            <Link href={service.href}>Go to section</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                     <section>
                         <h2 className="text-2xl font-semibold font-headline mb-4">Support & Services</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {supportServices.map((service) => (
                                <Card key={service.title} className="shadow-lg hover:shadow-xl transition-shadow">
                                     <CardContent className="p-6 flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <service.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{service.title}</h3>
                                            <p className="text-sm text-muted-foreground">{service.description}</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:text-primary transition-colors"/>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                </main>

                {/* Right Sidebar */}
                <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
                    <Card className="shadow-lg">
                        <CardContent className="p-4 text-center">
                            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/50" data-ai-hint="student avatar">
                                <AvatarImage src={user?.avatar} alt={user?.name} />
                                <AvatarFallback className="text-3xl">{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <h3 className="text-xl font-bold font-headline">{user?.name}</h3>
                            <p className="text-sm text-muted-foreground">{user?.username}</p>
                            <div className="mt-4 flex justify-center gap-2">
                                <Button variant="secondary" size="sm">
                                    <Link href="/dashboard/profile">View Profile</Link>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={logout}>
                                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Overall Progress</CardTitle>
                        </CardHeader>
                         <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Course Completion</span>
                                    <span className="font-semibold">62%</span>
                                </div>
                                <Progress value={62} className="h-2"/>
                            </div>
                             <div className="space-y-4 mt-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Average Grade</span>
                                    <span className="font-semibold">A- (91%)</span>
                                </div>
                                <Progress value={91} indicatorClassName="bg-green-500" className="h-2" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Game Stats</CardTitle>
                        </CardHeader>
                         <CardContent className="space-y-3">
                            {dummyGameStats.map(stat => (
                                <div key={stat.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <stat.icon className={cn("w-4 h-4", stat.color)} />
                                        <span>{stat.name}</span>
                                    </div>
                                    <span className="font-semibold text-foreground">{stat.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
}

