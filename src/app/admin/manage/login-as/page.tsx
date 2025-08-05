
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Search, UserCheck, AlertTriangle } from 'lucide-react';
import type { ApiStaffMember, UserProfile } from '@/lib/types';
import { getAllStudents } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function LoginAsPage() {
    const { loginAsStudent, user: adminUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const { data: students, isLoading, isError, error } = useQuery<ApiStaffMember[]>({
        queryKey: ['allStudentsForLoginAs'],
        queryFn: getAllStudents,
        staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    });

    const handleLoginAs = (student: ApiStaffMember) => {
        if (adminUser?.role !== 'staff') {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only staff can use this feature.' });
            return;
        }
        
        const studentProfile: UserProfile = {
            id: student.id,
            username: student.username,
            name: `${student.fname} ${student.lname}`,
            email: student.email,
            role: 'student',
            avatar: `https://placehold.co/100x100.png?text=${student.fname.charAt(0)}${student.lname.charAt(0)}`,
            joinedDate: student.created_at,
        };
        
        toast({ title: `Logging in as ${studentProfile.name}`, description: 'You will be redirected to the student dashboard.' });
        loginAsStudent(studentProfile);
    };

    const filteredStudents = useMemo(() => {
        if (!students) return [];
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return students;
        return students.filter(student =>
            student.username?.toLowerCase().includes(lowercasedFilter) ||
            student.fname?.toLowerCase().includes(lowercasedFilter) ||
            student.lname?.toLowerCase().includes(lowercasedFilter)
        );
    }, [students, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
    const paginatedStudents = useMemo(() => {
        return filteredStudents.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredStudents, currentPage]);


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
                <h1 className="text-3xl font-headline font-semibold">Login As Student</h1>
                <p className="text-muted-foreground">Select a student to view the application from their perspective.</p>
            </header>
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription>
                   This tool allows you to impersonate a student. Actions you take may affect the real student's account. Please proceed with caution.
                </AlertDescription>
            </Alert>
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>Select a Student</CardTitle>
                            <CardDescription>
                                Showing {isLoading ? 0 : paginatedStudents.length} of {isLoading ? 0 : filteredStudents.length} students.
                            </CardDescription>
                        </div>
                        <div className="relative w-full md:w-auto md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by username or name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                disabled={isLoading}
                            />
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
                        <>
                            <div className="relative w-full overflow-auto border rounded-lg hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Username</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedStudents.length > 0 ? paginatedStudents.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={`https://placehold.co/40x40.png?text=${student.fname[0]}${student.lname[0]}`} alt={student.fname} />
                                                        <AvatarFallback>{student.fname[0]}{student.lname[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{student.fname} {student.lname}</span>
                                                </TableCell>
                                                <TableCell>{student.username}</TableCell>
                                                <TableCell className="text-right">
                                                   <Button size="sm" onClick={() => handleLoginAs(student)}>
                                                        <UserCheck className="h-4 w-4 mr-2" />
                                                        Login As
                                                   </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24">No students found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="md:hidden space-y-4">
                               {paginatedStudents.length > 0 ? paginatedStudents.map((student) => (
                                 <div key={student.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={`https://placehold.co/40x40.png?text=${student.fname[0]}${student.lname[0]}`} alt={student.fname} />
                                            <AvatarFallback>{student.fname[0]}{student.lname[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{student.fname} {student.lname}</p>
                                            <p className="text-sm text-muted-foreground">{student.username}</p>
                                        </div>
                                    </div>
                                    <Button className="w-full" onClick={() => handleLoginAs(student)}>
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        Login As
                                   </Button>
                                </div>
                                )) : (
                                    <div className="text-center h-24 flex items-center justify-center">
                                        <p>No students found.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
                 <CardFooter className="flex items-center justify-center space-x-2 pt-4">
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || isLoading}
                     >
                        Previous
                     </Button>
                     <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages || 1}
                     </span>
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                     >
                        Next
                     </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
