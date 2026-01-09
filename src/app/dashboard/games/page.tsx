
"use client";

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getStudentEnrollments } from '@/lib/actions/users';
import type { StudentEnrollmentInfo, Course } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, Gamepad2, BookText } from 'lucide-react';
import { CeylonPharmacyIcon, DPadIcon, HunterProIcon, LuckyWheelIcon, MediMindIcon, PharmaHunterIcon, PharmaReaderIcon, WinPharmaIcon, WordPalletIcon } from '@/components/icons/module-icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { getCourses } from '@/lib/actions/courses';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Game = {
    title: string;
    description: string;
    href: string;
    icon: React.ReactElement;
    colorClass: string;
    requiredCourses?: string[];
};

const allGames: Game[] = [
    {
        title: "Ceylon Pharmacy",
        description: "Patient simulation game.",
        href: "/dashboard/ceylon-pharmacy",
        icon: <CeylonPharmacyIcon className="w-8 h-8 text-white"/>,
        colorClass: "from-cyan-400 to-sky-500",
    },
    {
        title: "D-Pad Challenge",
        description: "Dispensing accuracy test.",
        href: "/dashboard/d-pad",
        icon: <DPadIcon className="w-8 h-8 text-white" />,
        colorClass: "from-rose-400 to-red-500",
    },
    {
        title: "Sentence Builder",
        description: "English language practice.",
        href: "/dashboard/games/sentence-builder",
        icon: <BookText className="w-8 h-8 text-white" />,
        colorClass: "from-amber-400 to-orange-500",
        requiredCourses: ["CPCC28", "CPCC27"],
    },
    {
        title: "MediMind",
        description: "Test your pharmacology knowledge.",
        href: "/dashboard/medimind",
        icon: <MediMindIcon className="w-8 h-8 text-white" />,
        colorClass: "from-purple-400 to-violet-500",
    },
];

const GameCard = ({ game, selectedCourseCode, allCourses, setDialogContent }: { 
    game: Game, 
    selectedCourseCode: string | null, 
    allCourses: Course[] | undefined,
    setDialogContent: (content: { title: string; description: string } | null) => void;
}) => {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        if (game.requiredCourses && (!selectedCourseCode || !game.requiredCourses.includes(selectedCourseCode))) {
            e.preventDefault();
            const requiredCourseNames = allCourses
                ?.filter(c => game.requiredCourses!.includes(c.courseCode))
                .map(c => `${c.name} (${c.courseCode})`)
                .join(' or ');
            
            setDialogContent({
                title: "Course Requirement Not Met",
                description: `This game is only available for students enrolled in: ${requiredCourseNames || game.requiredCourses.join(', ')}.`,
            });
        } else {
            router.push(game.href);
        }
    };

    return (
        <a href={game.href} onClick={handleClick} className="group block cursor-pointer">
            <Card className="shadow-lg hover:shadow-xl transition-all duration-200 h-full border-0">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${game.colorClass}`}>
                        {game.icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{game.title}</h3>
                        <p className="text-sm text-muted-foreground">{game.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                </CardContent>
            </Card>
        </a>
    );
};


export default function AllGamesPage() {
    const { user } = useAuth();
    const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);
    const [dialogContent, setDialogContent] = useState<{ title: string; description: string } | null>(null);

     useEffect(() => {
        const storedCourseCode = localStorage.getItem('selected_course');
        if (storedCourseCode) {
            setSelectedCourseCode(storedCourseCode);
        }
    }, []);
    
    const { data: allCourses, isLoading: isLoadingCourses } = useQuery<Course[]>({
        queryKey: ['allCourses'],
        queryFn: getCourses,
        staleTime: Infinity,
    });
    
    const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery<StudentEnrollmentInfo[]>({
        queryKey: ['studentEnrollmentsForGames', user?.username],
        queryFn: () => getStudentEnrollments(user!.username!),
        enabled: !!user?.username,
    });

    const isLoading = isLoadingEnrollments || isLoadingCourses;

    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
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
            <header className="flex items-center gap-4">
                 <div className="bg-primary/10 p-3 rounded-full">
                   <Gamepad2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-headline font-semibold">Games & Challenges</h1>
                    <p className="text-muted-foreground">Test your skills and knowledge with our interactive games.</p>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                    <>
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </>
                ) : (
                    allGames.map(game => <GameCard key={game.href} game={game} selectedCourseCode={selectedCourseCode} allCourses={allCourses} setDialogContent={setDialogContent} />)
                )}
            </div>
        </div>
    );
}
