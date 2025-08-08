
"use client";

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Search, PlusCircle, Edit, Trash2, BookOpen, AlertTriangle, Loader2 } from 'lucide-react';
import { getCourses, createCourse, updateCourse, deleteCourse } from '@/lib/api';
import type { Course } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const courseFormSchema = z.object({
    name: z.string().min(3, "Course name must be at least 3 characters."),
    courseCode: z.string().min(3, "Course code must be at least 3 characters."),
    fee: z.coerce.number().min(0, "Fee must be a positive number."),
    description: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

const CourseForm = ({ course, onClose }: { course?: Course | null; onClose: () => void; }) => {
    const queryClient = useQueryClient();
    const form = useForm<CourseFormValues>({
        resolver: zodResolver(courseFormSchema),
        defaultValues: {
            name: course?.name || '',
            courseCode: course?.courseCode || '',
            fee: course ? parseFloat(course.fee) : 0,
            description: course?.description || '',
        }
    });

    const courseMutation = useMutation({
        mutationFn: (data: CourseFormValues) => {
            if (course) {
                return updateCourse(course.id, { ...data, fee: String(data.fee) });
            }
            return createCourse({ ...data, fee: String(data.fee) });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allCourses'] });
            toast({ title: 'Success', description: `Course ${course ? 'updated' : 'created'} successfully.` });
            onClose();
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    });
    
    const onSubmit = (data: CourseFormValues) => {
        courseMutation.mutate(data);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Course Name</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="courseCode">Course Code</Label>
                <Input id="courseCode" {...form.register('courseCode')} />
                {form.formState.errors.courseCode && <p className="text-sm text-destructive">{form.formState.errors.courseCode.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="fee">Course Fee (LKR)</Label>
                <Input id="fee" type="number" step="0.01" {...form.register('fee')} />
                {form.formState.errors.fee && <p className="text-sm text-destructive">{form.formState.errors.fee.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...form.register('description')} />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={courseMutation.isPending}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={courseMutation.isPending}>
                    {courseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {course ? "Save Changes" : "Create Course"}
                </Button>
            </DialogFooter>
        </form>
    );
};


export default function ManageCoursesPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

    const { data: courses, isLoading, isError, error } = useQuery<Course[]>({
        queryKey: ['allCourses'],
        queryFn: getCourses,
        staleTime: 1000 * 60 * 5,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allCourses'] });
            toast({ title: 'Success', description: 'Course deleted successfully.' });
            setCourseToDelete(null);
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            setCourseToDelete(null);
        }
    });

    const handleCreate = () => {
        setSelectedCourse(null);
        setIsFormOpen(true);
    };

    const handleEdit = (course: Course) => {
        setSelectedCourse(course);
        setIsFormOpen(true);
    };

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
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>An Error Occurred</AlertTitle>
                    <AlertDescription>{error?.message}</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedCourse ? "Edit" : "Create"} Course</DialogTitle>
                        <DialogDescription>
                           {selectedCourse ? "Modify the existing course details." : "Fill in the details for a new course."}
                        </DialogDescription>
                    </DialogHeader>
                    <CourseForm course={selectedCourse} onClose={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the course "{courseToDelete?.name}". This action cannot be undone.
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
                    <p className="text-muted-foreground">View, add, and edit course information.</p>
                </div>
                <Button onClick={handleCreate}>
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
                                               <Button variant="ghost" size="icon" onClick={() => handleEdit(course)}><Edit className="h-4 w-4"/></Button>
                                               <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCourseToDelete(course)}><Trash2 className="h-4 w-4"/></Button>
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
