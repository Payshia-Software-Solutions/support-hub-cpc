
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCoursesForFilter, getFilteredConvocationRegistrations, getStudentFullInfo } from '@/lib/api';
import type { ConvocationCourse, FilteredConvocationRegistration, FullStudentData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ClipboardList, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

const ITEMS_PER_PAGE = 25;

// --- Action Component ---
const UpdateCoursesAction = ({ registration }: { registration: FilteredConvocationRegistration }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<{ title: string, description: string, onConfirm?: () => void }>({});

    const { mutate, isPending } = useMutation({
        mutationFn: () => getStudentFullInfo(registration.student_number),
        onSuccess: (data: FullStudentData) => {
            const currentCourses = registration.course_id.split(',').map(s => s.trim()).filter(Boolean);
            const allEligibleCourses = Object.values(data.studentEnrollments)
                .filter(e => e.certificate_eligibility)
                .map(e => e.parent_course_id);
            
            const newEligibleCourses = allEligibleCourses.filter(id => !currentCourses.includes(id));

            if (newEligibleCourses.length > 0) {
                const newCourseString = [...currentCourses, ...newEligibleCourses].join(',');
                setDialogContent({
                    title: "Update Available",
                    description: `This student is also eligible for course(s) ${newEligibleCourses.join(', ')}. Do you want to add them to this convocation booking?`,
                    onConfirm: () => {
                        // Mock API call to update the registration
                        console.log(`UPDATING registration ${registration.registration_id} with new course list: ${newCourseString}`);
                        toast({
                            title: "Update Successful",
                            description: `Registration updated for ${registration.student_number} with new courses.`,
                        });
                        setIsDialogOpen(false);
                    }
                });
                setIsDialogOpen(true);
            } else {
                toast({
                    title: "No Updates Needed",
                    description: "Student is already registered for all eligible courses.",
                });
            }
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Error Checking Eligibility',
                description: error.message,
            });
        }
    });

    return (
        <>
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialogContent.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={dialogContent.onConfirm}>Update Booking</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Button
                variant="outline"
                size="sm"
                onClick={() => mutate()}
                disabled={isPending}
            >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Courses
            </Button>
        </>
    );
};


export default function ConvocationOrdersPage() {
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedSession, setSelectedSession] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: courses, isLoading: isLoadingCourses } = useQuery<ConvocationCourse[]>({
        queryKey: ['convocationCourses'],
        queryFn: getCoursesForFilter,
        staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    });

    const { data: registrations, isLoading: isLoadingRegistrations, isError, error, isFetching } = useQuery<FilteredConvocationRegistration[]>({
        queryKey: ['filteredConvocation', selectedCourse, selectedSession],
        queryFn: () => getFilteredConvocationRegistrations(selectedCourse, selectedSession),
        enabled: !!selectedCourse && !!selectedSession, // Only fetch when both filters are selected
        retry: false,
    });
    
    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCourse, selectedSession]);

    const totalPages = useMemo(() => {
        return Math.ceil((registrations?.length || 0) / ITEMS_PER_PAGE);
    }, [registrations]);

    const paginatedRegistrations = useMemo(() => {
        if (!registrations) return [];
        return registrations.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [registrations, currentPage]);

    const renderStatusBadge = (status: string) => {
        const isPrinted = status?.toLowerCase() === 'generated';
        return (
            <Badge variant={isPrinted ? 'default' : 'secondary'}>
                {status || 'N/A'}
            </Badge>
        );
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Filtered Convocation Orders</h1>
                <p className="text-muted-foreground">Select a course and session to view convocation registration details.</p>
            </header>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Select a course and session to load the registration list.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="course-select" className="text-sm font-medium mb-1 block">Course</label>
                            <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={isLoadingCourses}>
                                <SelectTrigger id="course-select">
                                    <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select a course"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses?.map(course => (
                                        <SelectItem key={course.id} value={course.id}>{course.course_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label htmlFor="session-select" className="text-sm font-medium mb-1 block">Session</label>
                            <Select value={selectedSession} onValueChange={setSelectedSession}>
                                <SelectTrigger id="session-select">
                                    <SelectValue placeholder="Select a session" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Session 1</SelectItem>
                                    <SelectItem value="2">Session 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Registration List</CardTitle>
                    <CardDescription>Showing {paginatedRegistrations.length} of {registrations?.length || 0} records.</CardDescription>
                </CardHeader>
                <CardContent>
                    {(isLoadingRegistrations || isFetching) && (
                         <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    )}
                    
                    {!isLoadingRegistrations && !isFetching && isError && (
                        <div className="text-destructive flex flex-col items-center justify-center p-8 text-center">
                            <AlertTriangle className="h-10 w-10 mb-4" />
                            <h3 className="text-lg font-semibold">Failed to load data</h3>
                            <p className="text-sm">{error.message}</p>
                        </div>
                    )}

                    {!isLoadingRegistrations && !isFetching && !isError && !registrations && (
                        <div className="text-muted-foreground flex flex-col items-center justify-center p-8 text-center">
                            <ClipboardList className="h-10 w-10 mb-4" />
                            <h3 className="text-lg font-semibold">Select filters to begin</h3>
                            <p className="text-sm">Please choose a course and a session to see the list of registrations.</p>
                        </div>
                    )}

                    {!isLoadingRegistrations && !isFetching && !isError && registrations && registrations.length === 0 && (
                        <div className="text-muted-foreground flex flex-col items-center justify-center p-8 text-center">
                            <AlertTriangle className="h-10 w-10 mb-4" />
                            <h3 className="text-lg font-semibold">No Registrations Found</h3>
                            <p className="text-sm">There are no convocation registrations matching your selected filters.</p>
                        </div>
                    )}
                    
                    {!isLoadingRegistrations && !isFetching && !isError && registrations && registrations.length > 0 && (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student Number</TableHead>
                                            <TableHead>Ceremony Number</TableHead>
                                            <TableHead>Certificate Status</TableHead>
                                            <TableHead>Advanced Cert. Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedRegistrations.map(reg => (
                                            <TableRow key={reg.registration_id}>
                                                <TableCell className="font-medium">{reg.student_number}</TableCell>
                                                <TableCell>{reg.ceremony_number}</TableCell>
                                                <TableCell>{renderStatusBadge(reg.certificate_print_status)}</TableCell>
                                                <TableCell>{renderStatusBadge(reg.advanced_print_status)}</TableCell>
                                                <TableCell>
                                                    <UpdateCoursesAction registration={reg} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile List */}
                            <div className="md:hidden space-y-4">
                                {paginatedRegistrations.map(reg => (
                                    <div key={reg.registration_id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                        <div>
                                            <p className="font-bold">{reg.student_number}</p>
                                            <p className="text-sm text-muted-foreground">Ceremony: {reg.ceremony_number}</p>
                                        </div>
                                        <div className="text-sm space-y-2 pt-2 border-t">
                                            <div className="flex items-center justify-between">
                                                <p className="text-muted-foreground">Certificate Status</p>
                                                {renderStatusBadge(reg.certificate_print_status)}
                                            </div>
                                             <div className="flex items-center justify-between">
                                                <p className="text-muted-foreground">Advanced Cert. Status</p>
                                                {renderStatusBadge(reg.advanced_print_status)}
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t">
                                            <UpdateCoursesAction registration={reg} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="flex items-center justify-center space-x-2 pt-6">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                        <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
