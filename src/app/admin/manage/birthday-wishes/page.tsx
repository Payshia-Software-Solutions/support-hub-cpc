
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
import { getAllUserFullDetails } from '@/lib/api';
import type { UserFullDetails } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isToday, parseISO } from 'date-fns';

export default function BirthdayWishesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSendingAll, setIsSendingAll] = useState(false);
    const [sentWishes, setSentWishes] = useState<Set<string>>(new Set());

    const { data: students, isLoading, isError, error } = useQuery<UserFullDetails[]>({
        queryKey: ['allStudentDetailsForBirthday'],
        queryFn: getAllUserFullDetails,
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
    });

    const birthdayStudents = useMemo(() => {
        if (!students) return [];
        return students.filter(student => {
            if (!student.birth_day) return false;
            try {
                // The API returns YYYY-MM-DD format, which parseISO handles correctly
                return isToday(parseISO(student.birth_day));
            } catch (e) {
                return false;
            }
        });
    }, [students]);

    const filteredStudents = useMemo(() => {
        if (!birthdayStudents) return [];
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return birthdayStudents;
        return birthdayStudents.filter(student =>
            student.username?.toLowerCase().includes(lowercasedFilter) ||
            student.full_name?.toLowerCase().includes(lowercasedFilter)
        );
    }, [birthdayStudents, searchTerm]);
    
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
                        <div>
                            <CardTitle className="flex items-center gap-2"><Cake className="h-5 w-5 text-primary"/> Today's Birthdays</CardTitle>
                            <CardDescription>
                                {isLoading ? "Loading students..." : `Found ${birthdayStudents.length} students celebrating today.`}
                            </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-auto flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search student..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                    disabled={isLoading}
                                />
                            </div>
                            <Button onClick={handleSendAll} disabled={isLoading || isSendingAll || filteredStudents.length === 0}>
                                {isSendingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PartyPopper className="mr-2 h-4 w-4"/>}
                                Send to All
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     {isLoading ? (
                        <div className="space-y-2">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Date of Birth</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.length > 0 ? filteredStudents.map((student) => (
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
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => handleSendWish(student.id)} disabled={sentWishes.has(student.id)}>
                                                    <Send className="h-4 w-4 mr-2" />
                                                    {sentWishes.has(student.id) ? 'Sent' : 'Send Wish'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">
                                                {birthdayStudents.length === 0 ? "No students have a birthday today." : "No students found matching your search."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
