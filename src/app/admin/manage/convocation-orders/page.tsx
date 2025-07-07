
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCoursesForFilter, getFilteredConvocationRegistrations, getStudentFullInfo, updateConvocationCourses, getUserCertificatePrintStatus } from '@/lib/api';
import type { ConvocationCourse, FilteredConvocationRegistration, FullStudentData, UpdateConvocationCoursesPayload, UserCertificatePrintStatus, CeylonPharmacyInfo, PharmaHunterInfo, PharmaHunterProInfo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, ClipboardList, Loader2, XCircle, Swords, Gem, Heart, FileDown } from 'lucide-react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const ITEMS_PER_PAGE = 25;

// --- Certificate Status Component ---
const CertificateStatusCell = ({ studentNumber, convocationCourseIds }: { studentNumber: string, convocationCourseIds: string }) => {
    const { data: certificates, isLoading, isError } = useQuery<UserCertificatePrintStatus[], Error>({
        queryKey: ['userCertificateStatus', studentNumber],
        queryFn: () => getUserCertificatePrintStatus(studentNumber),
        staleTime: 5 * 60 * 1000,
        enabled: !!studentNumber,
    });

    const relevantCourseIds = convocationCourseIds.split(',').map(id => id.trim());

    if (isLoading) {
        return <Skeleton className="h-6 w-24" />;
    }

    if (isError) {
        return <Badge variant="destructive">Error</Badge>;
    }

    const relevantCertificates = certificates?.filter(
        cert => relevantCourseIds.includes(cert.parent_course_id) && cert.type === 'Certificate'
    ) || [];

    if (relevantCertificates.length === 0) {
        return <Badge variant="secondary">None</Badge>;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {relevantCertificates.map(cert => (
                <TooltipProvider key={cert.id}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant={cert.print_status === '1' ? 'default' : 'secondary'}>
                                {cert.parent_course_id}: {cert.certificate_id}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Course ID: {cert.parent_course_id}</p>
                            <p>{cert.type}: {cert.certificate_id}</p>
                            <p>Course Code: {cert.course_code}</p>
                            <p>Status: {cert.print_status === '1' ? 'Printed' : 'Not Printed'}</p>
                            <p>Date: {new Date(cert.print_date).toLocaleDateString()}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
        </div>
    );
};

// --- Game Info Component ---
const GameDetailItem = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between items-center text-sm py-1.5 border-b border-dashed">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
    </div>
);

const GameInfoCell = ({ studentNumber, convocationCourseIds }: { studentNumber: string, convocationCourseIds: string }) => {
    const { data: fullStudentData, isLoading, isError } = useQuery<FullStudentData, Error>({
        queryKey: ['studentFullInfoForGames', studentNumber],
        queryFn: () => getStudentFullInfo(studentNumber),
        staleTime: 5 * 60 * 1000,
        enabled: !!studentNumber,
    });

    if (isLoading) {
        return <Button variant="outline" size="sm" disabled><Loader2 className="h-4 w-4 animate-spin mr-2"/>Loading...</Button>;
    }

    if (isError || !fullStudentData) {
        return <Badge variant="destructive">Error</Badge>;
    }

    const relevantCourseIds = convocationCourseIds.split(',').map(id => id.trim());
    const relevantEnrollments = Object.values(fullStudentData.studentEnrollments).filter(
        enrollment => relevantCourseIds.includes(enrollment.parent_course_id)
    );

    if (relevantEnrollments.length === 0) {
        return <Badge variant="secondary">No Data</Badge>;
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">View Games</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Game Progress</DialogTitle>
                    <DialogDescription>Student: {studentNumber}</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue={relevantEnrollments[0]?.parent_course_id} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        {relevantEnrollments.map(e => (
                            <TabsTrigger key={e.parent_course_id} value={e.parent_course_id}>{e.course_code}</TabsTrigger>
                        ))}
                    </TabsList>
                    {relevantEnrollments.map(e => (
                        <TabsContent key={e.parent_course_id} value={e.parent_course_id} className="space-y-4 pt-4">
                            {e.ceylon_pharmacy && (
                                <Card>
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base flex items-center gap-2"><Heart className="h-5 w-5 text-red-500" /> Ceylon Pharmacy</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <GameDetailItem label="Recovered Count" value={e.ceylon_pharmacy.recoveredCount} />
                                    </CardContent>
                                </Card>
                            )}
                             {e.pharma_hunter && (
                                <Card>
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base flex items-center gap-2"><Swords className="h-5 w-5 text-blue-500" /> Pharma Hunter</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 space-y-1">
                                        <GameDetailItem label="Correct Answers" value={e.pharma_hunter.correctCount} />
                                        <GameDetailItem label="Gems" value={e.pharma_hunter.gemCount} />
                                        <GameDetailItem label="Coins" value={e.pharma_hunter.coinCount} />
                                    </CardContent>
                                </Card>
                            )}
                             {e.pharma_hunter_pro && (
                                <Card>
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base flex items-center gap-2"><Gem className="h-5 w-5 text-purple-500" /> Pharma Hunter Pro</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 space-y-1">
                                        <GameDetailItem label="Progress" value={`${e.pharma_hunter_pro.results.progressPercentage}%`} />
                                        <GameDetailItem label="Correct Answers" value={e.pharma_hunter_pro.results.correctCount} />
                                        <GameDetailItem label="Gems" value={e.pharma_hunter_pro.results.gemCount} />
                                    </CardContent>
                                </Card>
                            )}
                             {!e.ceylon_pharmacy && !e.pharma_hunter && !e.pharma_hunter_pro && (
                                <p className="text-sm text-muted-foreground text-center py-4">No game data available for this course.</p>
                             )}
                        </TabsContent>
                    ))}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};


// --- Action Component ---
const EligibilityStatusCell = ({ registration }: { registration: FilteredConvocationRegistration }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<{ title: string, description: React.ReactNode, onConfirm?: () => void }>({});
    const queryClient = useQueryClient();

    const { data: fullStudentData, isLoading, isError, isFetching } = useQuery<FullStudentData, Error>({
        queryKey: ['studentFullInfo', registration.student_number],
        queryFn: () => getStudentFullInfo(registration.student_number),
        staleTime: 5 * 60 * 1000,
        retry: 1,
        enabled: true, // Auto-fetch on render
    });

    const { newEligibleEnrollments, isUpdateAvailable } = useMemo(() => {
        if (!fullStudentData) {
            return { newEligibleEnrollments: [], isUpdateAvailable: false };
        }
        
        const currentCourses = registration.course_id.split(',').map(s => s.trim()).filter(Boolean);
        
        const allEligibleEnrollments = Object.values(fullStudentData.studentEnrollments)
            .filter(e => e.certificate_eligibility);

        const newEnrollments = allEligibleEnrollments.filter(enrollment => 
            !currentCourses.includes(enrollment.parent_course_id)
        );
        
        return { newEligibleEnrollments: newEnrollments, isUpdateAvailable: newEnrollments.length > 0 };
    }, [fullStudentData, registration.course_id]);

    const { mutate: updateCourses, isPending: isUpdating } = useMutation({
        mutationFn: (payload: UpdateConvocationCoursesPayload) => updateConvocationCourses(payload),
        onSuccess: (data) => {
            toast({
                title: "Update Successful",
                description: data.message,
            });
            queryClient.invalidateQueries({ queryKey: ['filteredConvocation'] });
            setIsDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message,
            });
        }
    });

    const openUpdateDialog = () => {
        if (!newEligibleEnrollments.length) return;

        const currentCourses = registration.course_id.split(',').map(s => s.trim()).filter(Boolean);
        
        const onConfirm = () => {
            const newEligibleCourseIds = newEligibleEnrollments.map(e => e.parent_course_id);
            const allCourseIds = [...currentCourses, ...newEligibleCourseIds];
            const allCourseIdsAsNumbers = allCourseIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

            updateCourses({
                registrationId: registration.registration_id,
                courseIds: allCourseIdsAsNumbers,
            });
        };

        setDialogContent({
            title: "Update Available",
            description: (
                 <div className="text-sm">
                    <p className="mb-3">This student is eligible for the following additional course(s). Do you want to add them to this convocation booking?</p>
                    <div className="space-y-4 rounded-md border bg-muted/50 p-3 max-h-60 overflow-y-auto">
                        {newEligibleEnrollments.map(enrollment => (
                            <div key={enrollment.parent_course_id}>
                                <h4 className="font-semibold text-card-foreground">{enrollment.parent_course_name}</h4>
                                <ul className="mt-1 list-disc list-inside text-xs text-muted-foreground space-y-1 pl-2">
                                    {enrollment.criteria_details.map(c => (
                                        <li key={c.id} className="flex items-center justify-between">
                                            <span>{c.list_name}</span>
                                            {c.evaluation.completed ? (
                                                 <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Complete</span>
                                            ) : (
                                                 <span className="text-red-600 font-medium flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Incomplete</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            ),
            onConfirm
        });
        setIsDialogOpen(true);
    };

    if (isLoading || isFetching) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground" aria-live="polite">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking...</span>
            </div>
        );
    }

    if (isError) {
        return <Badge variant="destructive">Check Failed</Badge>;
    }

    if (isUpdateAvailable) {
        return (
            <>
                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
                             <AlertDialogDescription asChild>
                                {dialogContent.description || <div />}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={dialogContent.onConfirm} disabled={isUpdating}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Booking
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button variant="default" size="sm" onClick={openUpdateDialog}>Update Available</Button>
            </>
        );
    }
    
    return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Up to date</Badge>;
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

    const handleExport = () => {
        if (!registrations || registrations.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No data to export',
                description: 'Please select filters and load data before exporting.',
            });
            return;
        }

        const headers = [
            'Registration ID',
            'Student Number',
            'Ceremony Number',
            'Course IDs',
            'Session',
            'Payment Status',
            'Registration Status',
            'Registered At',
        ];

        const csvRows = [
            headers.join(','),
            ...registrations.map(reg => {
                const row = [
                    reg.registration_id,
                    reg.student_number,
                    reg.ceremony_number,
                    `"${reg.course_id}"`, // Wrap in quotes to handle commas
                    reg.session,
                    reg.payment_status,
                    reg.registration_status,
                    reg.registered_at,
                ];
                return row.join(',');
            })
        ];
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `convocation-orders-${selectedCourse}-${selectedSession}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
            title: 'Export Started',
            description: 'Your download will begin shortly.',
        });
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
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                            <CardTitle>Registration List</CardTitle>
                            <CardDescription>Showing {paginatedRegistrations.length} of {registrations?.length || 0} records.</CardDescription>
                        </div>
                        <Button
                            onClick={handleExport}
                            disabled={!registrations || registrations.length === 0 || isLoadingRegistrations || isFetching}
                        >
                            <FileDown className="mr-2 h-4 w-4" />
                            Export All to CSV
                        </Button>
                    </div>
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

                    {!isLoadingRegistrations && !isFetching && !registrations && (
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
                                            <TableHead>Ceremony #</TableHead>
                                            <TableHead>Course IDs</TableHead>
                                            <TableHead>Certificates</TableHead>
                                            <TableHead>Game Info</TableHead>
                                            <TableHead>Eligibility Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedRegistrations.map(reg => (
                                            <TableRow key={reg.registration_id}>
                                                <TableCell className="font-medium">{reg.student_number}</TableCell>
                                                <TableCell>{reg.ceremony_number}</TableCell>
                                                <TableCell>{reg.course_id}</TableCell>
                                                <TableCell>
                                                    <CertificateStatusCell studentNumber={reg.student_number} convocationCourseIds={reg.course_id} />
                                                </TableCell>
                                                <TableCell>
                                                    <GameInfoCell studentNumber={reg.student_number} convocationCourseIds={reg.course_id} />
                                                </TableCell>
                                                <TableCell>
                                                    <EligibilityStatusCell registration={reg} />
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
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold">{reg.student_number}</p>
                                                <p className="text-sm text-muted-foreground">Course IDs: {reg.course_id}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Ceremony</p>
                                                <p className="font-medium">{reg.ceremony_number}</p>
                                            </div>
                                        </div>
                                        <div className="text-sm space-y-2 pt-2 border-t">
                                            <div className="flex items-center justify-between">
                                                <p className="text-muted-foreground font-medium">Certificates</p>
                                                <CertificateStatusCell studentNumber={reg.student_number} convocationCourseIds={reg.course_id} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-muted-foreground font-medium">Game Info</p>
                                                <GameInfoCell studentNumber={reg.student_number} convocationCourseIds={reg.course_id} />
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t">
                                            <EligibilityStatusCell registration={reg} />
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
