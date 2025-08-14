
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Search, Cake, Send, Loader2, PartyPopper, AlertTriangle } from 'lucide-react';
import { getAllUserFullDetails } from '@/lib/actions/users';
import type { UserFullDetails } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isToday, parseISO, isValid, getDayOfYear, addDays, subDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const BirthdayStudentRow = ({ student, showAction = false, onSendWish, isSent }: {
    student: UserFullDetails;
    showAction?: boolean;
    onSendWish?: (id: string) => void;
    isSent?: boolean;
}) => (
     <TableRow key={student.id}>
        <TableCell className="font-medium flex items-center gap-3">
            <Avatar className="h-9 w-9">
                <AvatarImage src={`https://placehold.co/40x40.png?text=${student.full_name[0]}`} alt={student.full_name} data-ai-hint="student avatar" />
                <AvatarFallback>{student.full_name[0]}</AvatarFallback>
            </Avatar>
            <span>{student.full_name}</span>
        </TableCell>
        <TableCell>{student.username}</TableCell>
        <TableCell>{format(parseISO(student.birth_day), 'MMMM do')}</TableCell>
        {showAction && onSendWish && (
            <TableCell className="text-right">
                <Button size="sm" onClick={() => onSendWish(student.id)} disabled={isSent}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSent ? 'Sent' : 'Send Wish'}
                </Button>
            </TableCell>
        )}
    </TableRow>
);


export default function BirthdayWishesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSendingAll, setIsSendingAll] = useState(false);
    const [sentWishes, setSentWishes] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState('today');

    const { data: students, isLoading, isError, error } = useQuery<UserFullDetails[]>({
        queryKey: ['allStudentDetailsForBirthday'],
        queryFn: getAllUserFullDetails,
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
    });

    const { today, recent, upcoming } = useMemo(() => {
        if (!students) return { today: [], recent: [], upcoming: [] };

        const allBirthdays: { student: UserFullDetails, date: Date, dayOfYear: number }[] = students
            .map(student => {
                if (!student.birth_day || student.birth_day === "0000-00-00") return null;
                const date = parseISO(student.birth_day);
                if (!isValid(date)) return null;
                return { student, date, dayOfYear: getDayOfYear(date) };
            })
            .filter(Boolean) as { student: UserFullDetails, date: Date, dayOfYear: number }[];

        const now = new Date();
        const todayDayOfYear = getDayOfYear(now);
        
        const todayList = allBirthdays.filter(b => b.date.getMonth() === now.getMonth() && b.date.getDate() === now.getDate());

        // For recent/upcoming, we use day of year to handle year-end wraparound
        const sevenDaysAgo = getDayOfYear(subDays(now, 7));
        const sevenDaysHence = getDayOfYear(addDays(now, 7));

        const recentList = allBirthdays.filter(b => {
             if (b.dayOfYear === todayDayOfYear) return false; // Exclude today
             if (sevenDaysAgo < sevenDaysHence) { // Not wrapping around year-end
                return b.dayOfYear >= sevenDaysAgo && b.dayOfYear < todayDayOfYear;
             } else { // Wraps around year-end (e.g., today is Jan 3)
                 return b.dayOfYear >= sevenDaysAgo || b.dayOfYear < todayDayOfYear;
             }
        }).sort((a,b) => b.dayOfYear - a.dayOfYear);

        const upcomingList = allBirthdays.filter(b => {
            if (b.dayOfYear === todayDayOfYear) return false; // Exclude today
            if (todayDayOfYear < sevenDaysHence) { // Not wrapping around year-end
                return b.dayOfYear > todayDayOfYear && b.dayOfYear <= sevenDaysHence;
            } else { // Wraps around year-end
                return b.dayOfYear > todayDayOfYear || b.dayOfYear <= sevenDaysHence;
            }
        }).sort((a,b) => a.dayOfYear - b.dayOfYear);

        return {
            today: todayList.map(b => b.student),
            recent: recentList.map(b => b.student),
            upcoming: upcomingList.map(b => b.student),
        };

    }, [students]);

    const filteredStudents = useMemo(() => {
        let listToFilter = [];
        if (activeTab === 'today') listToFilter = today;
        if (activeTab === 'recent') listToFilter = recent;
        if (activeTab === 'upcoming') listToFilter = upcoming;

        if (!listToFilter) return [];
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return listToFilter;
        return listToFilter.filter(student =>
            student.username?.toLowerCase().includes(lowercasedFilter) ||
            student.full_name?.toLowerCase().includes(lowercasedFilter)
        );
    }, [today, recent, upcoming, searchTerm, activeTab]);
    
    const handleSendWish = (studentId: string) => {
        // Mock sending wish
        setTimeout(() => {
             setSentWishes(prev => new Set(prev).add(studentId));
             toast({ title: 'Wish Sent!', description: `Birthday greeting sent to student ${studentId}.` });
        }, 500);
    };

    const handleSendAll = () => {
        setIsSendingAll(true);
        const toSend = filteredStudents.filter(s => !sentWishes.has(s.id));
        
        setTimeout(() => {
            const newSent = new Set(sentWishes);
            toSend.forEach(s => newSent.add(s.id));
            setSentWishes(newSent);
            setIsSendingAll(false);
            toast({ title: `Wishes Sent!`, description: `Sent ${toSend.length} birthday greetings.` });
        }, 1500);
    };


    if (isError) {
        return (
            <div className="p-4 md:p-8">
                <h1 className="text-3xl font-headline font-semibold text-destructive">An Error Occurred</h1>
                <p className="text-muted-foreground">{error?.message}</p>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Birthday Wishes</h1>
                <p className="text-muted-foreground">Send birthday greetings to students celebrating today.</p>
            </header>
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="flex-grow">
                             <div className="relative w-full sm:w-auto flex-grow max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search student..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        {activeTab === 'today' && (
                            <Button onClick={handleSendAll} disabled={isLoading || isSendingAll || filteredStudents.length === 0}>
                                {isSendingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PartyPopper className="mr-2 h-4 w-4"/>}
                                Send to All
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="recent">Recent</TabsTrigger>
                            <TabsTrigger value="today">Today ({today.length})</TabsTrigger>
                            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                        </TabsList>
                        
                        <div className="relative w-full overflow-auto border rounded-lg mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Date of Birth</TableHead>
                                        {activeTab === 'today' && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={activeTab === 'today' ? 4 : 3} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                                    ) : (
                                        <>
                                            {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                                <BirthdayStudentRow 
                                                    key={student.id} 
                                                    student={student} 
                                                    showAction={activeTab === 'today'}
                                                    onSendWish={handleSendWish}
                                                    isSent={sentWishes.has(student.id)}
                                                />
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={activeTab === 'today' ? 4 : 3} className="text-center h-24">
                                                        No students found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
