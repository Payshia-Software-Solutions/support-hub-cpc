"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getParentCourse, updateParentCourse } from '@/lib/api';
import type { ParentCourse } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';


const courseFormSchema = z.object({
  course_name: z.string().min(3, "Course name is required"),
  course_code: z.string().min(1, "Course code is required"),
  instructor_id: z.string().optional(),
  course_duration: z.string().optional(),
  course_fee: z.coerce.number().min(0).optional(),
  registration_fee: z.coerce.number().min(0).optional(),
  course_img: z.string().optional(),
  mini_description: z.string().optional(),
  course_description: z.string().optional(),
  certification: z.string().optional(),
  lecture_count: z.coerce.number().min(0).optional(),
  hours_per_lecture: z.coerce.number().min(0).optional(),
  assessments: z.coerce.number().min(0).optional(),
  language: z.string().optional(),
  quizzes: z.coerce.number().min(0).optional(),
  skill_level: z.string().optional(),
  head_count: z.coerce.number().min(0).optional(),
  course_mode: z.string().optional(),
  slug: z.string().optional(),
  criteria_list: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;


export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const queryClient = useQueryClient();
    const courseId = params.id as string;

    const { data: course, isLoading, isError, error } = useQuery<ParentCourse>({
        queryKey: ['parentCourse', courseId],
        queryFn: () => getParentCourse(courseId),
        enabled: !!courseId,
    });

    const form = useForm<CourseFormValues>({
        resolver: zodResolver(courseFormSchema),
    });
    
    useEffect(() => {
        if (course) {
             form.reset({
                ...course,
                course_fee: course.course_fee ? parseFloat(course.course_fee) : 0,
                registration_fee: course.registration_fee ? parseFloat(course.registration_fee) : 0,
                lecture_count: course.lecture_count ? parseInt(course.lecture_count, 10) : 0,
                hours_per_lecture: course.hours_per_lecture ? parseInt(course.hours_per_lecture, 10) : 0,
                assessments: course.assessments ? parseInt(course.assessments, 10) : 0,
                quizzes: course.quizzes ? parseInt(course.quizzes, 10) : 0,
                head_count: course.head_count ? parseInt(course.head_count, 10) : 0,
             });
        }
    }, [course, form]);


     const updateMutation = useMutation({
        mutationFn: (data: CourseFormValues) => {
            const apiData = {
                ...data,
                course_fee: String(data.course_fee),
                registration_fee: String(data.registration_fee),
                lecture_count: String(data.lecture_count),
                hours_per_lecture: String(data.hours_per_lecture),
                assessments: String(data.assessments),
                quizzes: String(data.quizzes),
                head_count: String(data.head_count),
            };
            return updateParentCourse(courseId, apiData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parentCourses'] });
            queryClient.invalidateQueries({ queryKey: ['parentCourse', courseId] });
            toast({ title: 'Success', description: 'Course updated successfully.' });
            router.push('/admin/manage/courses');
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    });

    const onSubmit = (data: CourseFormValues) => {
        updateMutation.mutate(data);
    };
    
    if (isLoading) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                <Skeleton className="h-10 w-48" />
                <Card className="shadow-lg">
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                    <CardFooter><Skeleton className="h-10 w-32" /></CardFooter>
                </Card>
            </div>
        );
    }
    
    if (isError) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                 <Button variant="ghost" onClick={() => router.back()} className="-ml-4"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Courses</Button>
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Failed to load course</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                 </Alert>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                 <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
                </Button>
                <h1 className="text-3xl font-headline font-semibold mt-2">Edit Course</h1>
                <p className="text-muted-foreground">Modify the details for "{course?.course_name}".</p>
            </header>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                 <Card className="shadow-lg">
                    <CardHeader><CardTitle>Course Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <ScrollArea className="h-[60vh] pr-6 -mr-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-2"><Label>Course Name*</Label><Input {...form.register('course_name')} />{form.formState.errors.course_name && <p className="text-sm text-destructive">{form.formState.errors.course_name.message}</p>}</div>
                                    <div className="space-y-2"><Label>Course Code*</Label><Input {...form.register('course_code')} />{form.formState.errors.course_code && <p className="text-sm text-destructive">{form.formState.errors.course_code.message}</p>}</div>
                                    <div className="space-y-2"><Label>Instructor ID</Label><Input {...form.register('instructor_id')} /></div>
                                    <div className="space-y-2"><Label>Duration</Label><Input {...form.register('course_duration')} /></div>
                                    <div className="space-y-2"><Label>Course Fee (LKR)</Label><Input type="number" {...form.register('course_fee')} /></div>
                                    <div className="space-y-2"><Label>Registration Fee (LKR)</Label><Input type="number" {...form.register('registration_fee')} /></div>
                                    <div className="space-y-2 md:col-span-2 lg:col-span-3"><Label>Course Image Filename</Label><Input {...form.register('course_img')} placeholder="e.g., image.jpg"/></div>
                                    <div className="space-y-2"><Label>Lecture Count</Label><Input type="number" {...form.register('lecture_count')} /></div>
                                    <div className="space-y-2"><Label>Hours Per Lecture</Label><Input type="number" {...form.register('hours_per_lecture')} /></div>
                                    <div className="space-y-2"><Label>Assessments</Label><Input type="number" {...form.register('assessments')} /></div>
                                    <div className="space-y-2"><Label>Language</Label><Input {...form.register('language')} /></div>
                                    <div className="space-y-2"><Label>Quizzes</Label><Input type="number" {...form.register('quizzes')} /></div>
                                    <div className="space-y-2"><Label>Skill Level</Label><Input {...form.register('skill_level')} placeholder="e.g. Beginner"/></div>
                                    <div className="space-y-2"><Label>Max Head Count</Label><Input type="number" {...form.register('head_count')} /></div>
                                    <div className="space-y-2"><Label>Course Mode</Label><Input {...form.register('course_mode')} placeholder="e.g. Free, Paid"/></div>
                                    <div className="space-y-2"><Label>Slug</Label><Input {...form.register('slug')} placeholder="e.g. certificate-course"/></div>
                                    <div className="space-y-2"><Label>Criteria List (CSV)</Label><Input {...form.register('criteria_list')} placeholder="e.g. 1,2,3"/></div>
                                </div>
                                <div className="space-y-2"><Label>Mini Description</Label><Textarea rows={3} {...form.register('mini_description')} /></div>
                                <div className="space-y-2"><Label>Full Description (HTML)</Label><Textarea rows={8} {...form.register('course_description')} /></div>
                                <div className="space-y-2"><Label>Certification Details</Label><Textarea rows={2} {...form.register('certification')} /></div>
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}