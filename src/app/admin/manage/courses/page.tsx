
"use client";

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Search, PlusCircle, Edit, Trash2, BookOpen, AlertTriangle } from 'lucide-react';
import { getCourses } from '@/lib/api';
import type { Course } from '@/lib/types';
import { Input } from '@/components/ui/input';

export default function ManageCoursesPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: courses, isLoading, isError, error } = useQuery<Course[]>({
        queryKey: ['allCourses'],
        queryFn: getCourses,
        staleTime: 1000 * 60 * 5,
    });

    const filteredCourses = useMemo(() => {
        if (!courses) return [];
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return courses;
        return courses.filter(course =>
            course.name.toLowerCase().includes(lowercasedFilter) ||
            course.courseCode.toLowerCase().includes(lowercasedFilter)
        );
    }, [courses, searchTerm]);

    if (isError) {
        return (
            <div className="p-4 md:p-8">
                 <AlertTriangle className="h-4 w-4" />
                <h1 className="text-3xl font-headline font-semibold text-destructive">An Error Occurred</h1>
                <p className="text-muted-foreground">{error?.message}</p>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">Manage Courses</h1>
                    <p className="text-muted-foreground">View, add, and edit course information.</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Course
                </Button>
            </header>
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>All Courses</CardTitle>
                             <CardDescription>
                                {isLoading ? "Loading..." : `${filteredCourses.length} courses found.`}
                            </CardDescription>
                        </div>
                         <div className="relative w-full md:w-auto md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or code..."
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
                        <div className="relative w-full overflow-auto border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Course Name</TableHead>
                                        <TableHead>Course Code</TableHead>
                                        <TableHead>Course Fee (LKR)</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCourses.length > 0 ? filteredCourses.map((course) => (
                                        <TableRow key={course.id}>
                                            <TableCell className="font-medium">{course.name}</TableCell>
                                            <TableCell>{course.courseCode}</TableCell>
                                            <TableCell>{parseFloat(course.fee).toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                               <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                                               <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">
                                                No courses found.
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
