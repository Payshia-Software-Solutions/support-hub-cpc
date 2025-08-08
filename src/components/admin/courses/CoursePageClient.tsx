"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getParentCourses, deleteParentCourse } from '@/lib/api';
import type { ParentCourse } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Loader2, AlertTriangle, BookOpen } from 'lucide-react';
import { CourseList } from '@/components/admin/courses/CourseList';
import { CourseForm } from '@/components/admin/courses/CourseForm';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

export function CoursePageClient() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<ParentCourse | null>(null);
    const [courseToDelete, setCourseToDelete] = useState<ParentCourse | null>(null);

    const { data: courses, isLoading, isError, error } = useQuery<ParentCourse[]>({
        queryKey: ['parentCourses'],
        queryFn: getParentCourses,
        staleTime: 1000 * 60 * 5,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteParentCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parentCourses'] });
            toast({ title: 'Success', description: 'Course deleted successfully.' });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        },
        onSettled: () => setCourseToDelete(null),
    });

    const handleCreate = () => {
        setSelectedCourse(null);
        setIsFormOpen(true);
    };

    const handleEdit = (course: ParentCourse) => {
        setSelectedCourse(course);
        setIsFormOpen(true);
    };

    const handleDelete = (course: ParentCourse) => {
        setCourseToDelete(course);
    };

    const filteredCourses = courses?.filter(course =>
        course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_code.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <CourseForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                course={selectedCourse}
            />

             <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete the course "{courseToDelete?.course_name}". This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(courseToDelete!.id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">Manage Courses</h1>
                    <p className="text-muted-foreground">Add, edit, and manage parent courses and their batches.</p>
                </div>
                <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Course
                </Button>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <CardTitle>All Parent Courses</CardTitle>
                        <div className="relative w-full md:w-auto md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                     <CardDescription>
                        {isLoading ? "Loading..." : `${filteredCourses.length} courses found.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardHeader className="h-24 bg-muted rounded-t-lg"></CardHeader>
                                    <CardContent className="p-4 space-y-2">
                                        <div className="h-6 w-3/4 bg-muted rounded"></div>
                                        <div className="h-4 w-1/2 bg-muted rounded"></div>
                                    </CardContent>
                                    <CardFooter className="p-4 flex justify-end gap-2">
                                         <div className="h-10 w-24 bg-muted rounded-md"></div>
                                         <div className="h-10 w-24 bg-muted rounded-md"></div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                    {isError && (
                        <div className="text-center py-10 text-destructive">
                             <AlertTriangle className="h-10 w-10 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">Failed to load courses</h3>
                            <p>{error?.message}</p>
                        </div>
                    )}
                    {!isLoading && !isError && courses && (
                        filteredCourses.length > 0 ? (
                             <CourseList
                                courses={filteredCourses}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ) : (
                             <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                                <BookOpen className="w-16 h-16 mb-4" />
                                <h3 className="text-xl font-semibold">No Courses Found</h3>
                                <p>Click "Add New Course" to get started.</p>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
