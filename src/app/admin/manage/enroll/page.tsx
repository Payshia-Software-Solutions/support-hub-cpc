
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertTriangle, User, Mail, Phone, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dummyCourses } from '@/lib/dummy-data';
import type { Course } from '@/lib/types';

// Simplified types for this page
interface StudentInfo {
    id: string;
    student_id: string;
    full_name: string;
    e_mail: string;
    telephone_1: string;
    nic: string;
}

interface StudentEnrollment {
    id: string;
    course_code: string;
    batch_name: string;
    parent_course_name: string;
}

interface FullStudentData {
    studentInfo: StudentInfo;
    studentEnrollments: Record<string, StudentEnrollment>;
}

export default function EnrollStudentPage() {
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState<FullStudentData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newCourseId, setNewCourseId] = useState<string>('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a student ID.' });
            return;
        }

        setIsLoading(true);
        setError(null);
        setStudentData(null);

        try {
            const response = await fetch(`https://qa-api.pharmacollege.lk/get-student-full-info?loggedUser=${studentId.trim().toUpperCase()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Student not found or server error. Status: ${response.status}` }));
                throw new Error(errorData.message || 'Student not found or API response is invalid.');
            }
            const data = await response.json();
            if (data && data.studentInfo) {
                setStudentData(data);
            } else {
                 throw new Error('Student not found or API response is invalid.');
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            toast({ variant: 'destructive', title: 'Search Failed', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveEnrollment = (enrollmentId: string) => {
        if (!studentData) return;

        // Mock removal
        const updatedEnrollments = { ...studentData.studentEnrollments };
        delete updatedEnrollments[enrollmentId];
        
        setStudentData({
            ...studentData,
            studentEnrollments: updatedEnrollments,
        });

        toast({
            title: "Enrollment Removed",
            description: `The enrollment has been removed from this student's record.`,
        });
    };

    const handleAddEnrollment = () => {
        if (!studentData || !newCourseId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a course to add.' });
            return;
        }

        const courseToAdd = dummyCourses.find(c => c.id === newCourseId);
        if (!courseToAdd) {
             toast({ variant: 'destructive', title: 'Error', description: 'Invalid course selected.' });
            return;
        }
        
        if (studentData.studentEnrollments[courseToAdd.courseCode]) {
            toast({ variant: 'destructive', title: 'Already Enrolled', description: 'The student is already enrolled in this course.' });
            return;
        }

        // Mock addition
        const newEnrollment: StudentEnrollment = {
            id: `new-${Date.now()}`,
            course_code: courseToAdd.courseCode,
            parent_course_name: courseToAdd.name,
            batch_name: "Default Batch", // Placeholder
        };

        setStudentData({
            ...studentData,
            studentEnrollments: {
                ...studentData.studentEnrollments,
                [courseToAdd.courseCode]: newEnrollment
            }
        });

        toast({
            title: "Enrollment Added",
            description: `${studentData.studentInfo.full_name} has been enrolled in ${courseToAdd.name}.`
        });
        setNewCourseId('');
        setIsAddDialogOpen(false);
    };

    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Student Enrollment Management</h1>
                <p className="text-muted-foreground">Search for a student to add or remove course enrollments.</p>
            </header>

            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            placeholder="Enter Student ID (e.g., PA16642)" 
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="flex-grow"
                        />
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            )}

            {error && !isLoading && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle /> An Error Occurred</CardTitle>
                    </CardHeader>
                    <CardContent><p>{error}</p></CardContent>
                </Card>
            )}

            {studentData && (
                <div className="space-y-6">
                    {/* Student Info Card */}
                    <Card className="shadow-lg">
                        <CardHeader>
                             <CardTitle className="flex items-center gap-4">
                                <Avatar className="w-16 h-16 text-2xl border">
                                    <AvatarImage src={`https://placehold.co/150x150.png`} alt={studentData.studentInfo.full_name} data-ai-hint="student avatar" />
                                    <AvatarFallback>{studentData.studentInfo.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    {studentData.studentInfo.full_name}
                                    <CardDescription>{studentData.studentInfo.student_id}</CardDescription>
                                </div>
                             </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {studentData.studentInfo.e_mail}</p>
                            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {studentData.studentInfo.telephone_1}</p>
                            <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {studentData.studentInfo.nic}</p>
                        </CardContent>
                    </Card>

                    {/* Enrollments Card */}
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle>Course Enrollments</CardTitle>
                                <CardDescription>Manage student's active course enrollments.</CardDescription>
                            </div>
                             <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Enrollment</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Enrollment</DialogTitle>
                                        <DialogDescription>Select a course to enroll {studentData.studentInfo.full_name} into.</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-2">
                                        <label htmlFor="course-select">Course</label>
                                        <Select value={newCourseId} onValueChange={setNewCourseId}>
                                            <SelectTrigger id="course-select">
                                                <SelectValue placeholder="Select a course..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dummyCourses.map(course => (
                                                    <SelectItem key={course.id} value={course.id}>
                                                        {course.name} ({course.courseCode})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button onClick={handleAddEnrollment}>Add Enrollment</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Course Name</TableHead>
                                            <TableHead className="hidden md:table-cell">Course Code</TableHead>
                                            <TableHead className="hidden md:table-cell">Batch</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.values(studentData.studentEnrollments).length > 0 ? (
                                            Object.values(studentData.studentEnrollments).map(enrollment => (
                                                <TableRow key={enrollment.id}>
                                                    <TableCell>
                                                        <p className="font-medium">{enrollment.parent_course_name}</p>
                                                        <div className="md:hidden text-muted-foreground text-xs space-y-1 mt-1">
                                                            <p>Code: {enrollment.course_code}</p>
                                                            <p>Batch: {enrollment.batch_name}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">{enrollment.course_code}</TableCell>
                                                    <TableCell className="hidden md:table-cell">{enrollment.batch_name}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveEnrollment(enrollment.course_code)}>
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Remove Enrollment</span>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24">No enrollments found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );

    