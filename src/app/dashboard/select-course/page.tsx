
"use client";

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentEnrollments } from '@/lib/actions/users';
import { getCourses } from '@/lib/actions/courses';
import type { StudentEnrollmentInfo, Course } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SELECTED_COURSE_STORAGE_KEY = 'selected_course';

export default function SelectCoursePage() {
    const router = useRouter();
    const { user } = useAuth();

    const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery<StudentEnrollmentInfo[]>({
        queryKey: ['studentEnrollments', user?.username],
        queryFn: () => getStudentEnrollments(user!.username!),
        enabled: !!user?.username,
    });

    const { data: allCourses, isLoading: isLoadingCourses } = useQuery<Course[]>({
        queryKey: ['allCourses'],
        queryFn: getCourses,
        staleTime: Infinity,
    });
    
    // Redirect if not needed
    useEffect(() => {
        if (!isLoadingEnrollments && enrollments && enrollments.length <= 1) {
            if (enrollments.length === 1) {
                localStorage.setItem(SELECTED_COURSE_STORAGE_KEY, enrollments[0].course_code);
            }
            router.replace('/dashboard');
        }
    }, [enrollments, isLoadingEnrollments, router]);

    const handleCourseSelect = (courseCode: string) => {
        localStorage.setItem(SELECTED_COURSE_STORAGE_KEY, courseCode);
        router.push('/dashboard');
    };

    const isLoading = isLoadingEnrollments || isLoadingCourses;

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
            <Dialog open={true}>
                <DialogContent className="max-w-4xl shadow-2xl" onInteractOutside={(e) => e.preventDefault()} hideCloseButton={true}>
                    <DialogHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <Image src="https://content-provider.pharmacollege.lk/app-icon/android-chrome-192x192.png" alt="SOS App Logo" width={64} height={64} className="w-16 h-16" />
                        </div>
                        <DialogTitle className="text-2xl font-headline">Select Your Course</DialogTitle>
                        <DialogDescription>You are enrolled in multiple courses. Please choose one to view its dashboard.</DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-32 w-full" />
                                <Skeleton className="h-32 w-full" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                                {enrollments?.map(enrollment => {
                                    const courseInfo = allCourses?.find(c => c.courseCode === enrollment.course_code);
                                    return (
                                        <button
                                            key={enrollment.student_course_id}
                                            onClick={() => handleCourseSelect(enrollment.course_code)}
                                            className="w-full text-left group"
                                        >
                                            <Card className="shadow-sm hover:shadow-lg hover:border-primary transition-all h-full">
                                                <CardContent className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 rounded-lg bg-primary/10">
                                                            <BookOpen className="w-6 h-6 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{courseInfo?.name || enrollment.course_code}</p>
                                                            <p className="text-sm text-muted-foreground">{enrollment.course_code}</p>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                                </CardContent>
                                            </Card>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                         {!isLoading && (!enrollments || enrollments.length === 0) && (
                            <p className="text-center text-muted-foreground py-8">You are not enrolled in any courses.</p>
                         )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Add hideCloseButton to DialogContent props to avoid type errors
declare module "@radix-ui/react-dialog" {
  interface DialogContentProps {
    hideCloseButton?: boolean;
  }
}
