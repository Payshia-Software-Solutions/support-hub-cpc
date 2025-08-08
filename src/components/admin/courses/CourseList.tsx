"use client";

import Link from 'next/link';
import Image from 'next/image';
import type { ParentCourse } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Settings, BookOpen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CourseListProps {
    courses: ParentCourse[];
    onDelete: (course: ParentCourse) => void;
}

export function CourseList({ courses, onDelete }: CourseListProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
                <Card key={course.id} className="shadow-lg flex flex-col">
                    <CardHeader>
                        {course.course_img ? (
                             <div className="relative aspect-video rounded-t-lg -mt-6 -mx-6 mb-4 overflow-hidden">
                                <Image 
                                    src={`https://content-provider.pharmacollege.lk/${course.course_img}`} 
                                    alt={course.course_name} 
                                    layout="fill" 
                                    objectFit="cover" 
                                    className="bg-muted"
                                />
                            </div>
                        ) : (
                            <div className="relative aspect-video rounded-t-lg -mt-6 -mx-6 mb-4 bg-muted flex items-center justify-center">
                                <BookOpen className="w-12 h-12 text-muted-foreground" />
                            </div>
                        )}
                        <CardTitle className="text-lg">{course.course_name}</CardTitle>
                        <CardDescription>{course.course_code}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                            {course.mini_description || 'No mini description available.'}
                        </p>
                    </CardContent>
                    <CardFooter className="p-4 flex justify-end gap-2 border-t mt-auto">
                        <Button variant="outline" asChild>
                            <Link href={`/admin/manage/batches?courseId=${course.id}`}>Manage Batches</Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Settings className="h-4 w-4" />
                                    <span className="sr-only">Course Settings</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                   <Link href={`/admin/manage/courses/edit/${course.id}`}>
                                     <Edit className="mr-2 h-4 w-4" />
                                     <span>Edit Course</span>
                                   </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete(course)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete Course</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
