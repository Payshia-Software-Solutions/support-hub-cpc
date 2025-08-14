
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertTriangle, User, Mail, Phone, PlusCircle, Trash2, BookOpen, Tag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dummyCourses } from '@/lib/dummy-data';
import type { Course } from '@/lib/types';
import { getStudentFullInfo } from '@/lib/actions/users';

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
            const data = await getStudentFullInfo(studentId.trim().toUpperCase());
            if (data && data.studentInfo && data.studentEnrollments) {
                setStudentData(data);
            } else {
                 throw new Error('Student data is incomplete or invalid in the API response.');
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
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Student Enrollment</h1>
                <p className="text-muted-foreground">Search for a student to manage their course enrollments.</p>
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
                <div className="space-y-6">
                    <Skeleton className="h-[170px] w-full" />
                    <Skeleton className="h-64 w-full" />
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
                    {/* Profile Header Card - Adopted from quick-links page */}
                    <Card className="shadow-lg">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                                <Avatar className="w-24 h-24 text-4xl border-2 border-primary" data-ai-hint="student avatar">
                                    <AvatarImage src={`https://placehold.co/150x150.png`} alt={studentData.studentInfo.full_name} />
                                    <AvatarFallback>{studentData.studentInfo.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold font-headline">{studentData.studentInfo.full_name}</h2>
                                    <p className="text-muted-foreground">{studentData.studentInfo.student_id}</p>
                                    <div className="mt-2 text-sm text-muted-foreground space-y-1 break-all">
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><User className="h-4 w-4 shrink-0" /> {studentData.studentInfo.nic}</p>
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><Mail className="h-4 w-4 shrink-0" /> {studentData.studentInfo.e_mail}</p>
                                        <p className="flex items-center justify-center sm:justify-start gap-2"><Phone className="h-4 w-4 shrink-0" /> {studentData.studentInfo.telephone_1}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Enrollments Card */}
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row justify-between items-center">
                             <div className="space-y-1">
                                <CardTitle>Course Enrollments</CardTitle>
                                <CardDescription>Add or remove courses for this student.</CardDescription>
                            </div>
                             <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
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
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.values(studentData.studentEnrollments).length > 0 ? (
                                    Object.values(studentData.studentEnrollments).map(enrollment => (
                                        <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                           <div className="space-y-1 overflow-hidden mr-4">
                                                <p className="font-semibold text-card-foreground truncate">{enrollment.parent_course_name}</p>
                                                <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{enrollment.course_code}</span>
                                                    <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />{enrollment.batch_name}</span>
                                                </div>
                                           </div>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0" onClick={() => handleRemoveEnrollment(enrollment.course_code)}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Remove Enrollment</span>
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground py-10 md:col-span-2">
                                        <p>No enrollments found for this student.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
