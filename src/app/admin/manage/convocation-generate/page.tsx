
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getConvocationCeremonies, 
    getConvocationRegistrations, 
    generateAllCertificatesForBooking, 
    getUserCertificatePrintStatus 
} from '@/lib/actions/certificates';
import { getParentCourses } from '@/lib/actions/courses';
import type { 
    ConvocationCeremony, 
    ConvocationRegistration, 
    ParentCourse, 
    UserCertificatePrintStatus 
} from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { 
    Award, 
    Loader2, 
    Search, 
    Database, 
    Printer,
    GraduationCap,
    PlayCircle,
    FileText,
    List,
    FileCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

const ITEMS_PER_PAGE = 25;

// --- Sub-component for single-booking certificate management ---
const BookingCertificateControl = ({ 
    registration,
    courseNameMap 
}: { 
    registration: ConvocationRegistration,
    courseNameMap: Map<string, string>
}) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: certStatus, isLoading, refetch } = useQuery<{ certificateStatus: UserCertificatePrintStatus[] }>({
        queryKey: ['userCertificateStatus', registration.student_number],
        queryFn: () => getUserCertificatePrintStatus(registration.student_number),
        staleTime: 5 * 60 * 1000,
    });

    const generateMutation = useMutation({
        mutationFn: () => generateAllCertificatesForBooking(registration.registration_id),
        onSuccess: (data) => {
            toast({ title: 'Success', description: data.message });
            refetch();
        },
        onError: (err: Error) => toast({ variant: 'destructive', title: 'Generation Failed', description: err.message })
    });

    const courseIds = registration.course_id.split(',').map(id => id.trim()).filter(Boolean);
    
    const getGeneratedDoc = (courseId: string, type: string) => {
        return certStatus?.certificateStatus?.find(c => c.parent_course_id === courseId && c.type === type);
    };

    if (isLoading) return <div className="space-y-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-24" /></div>;

    const allGenerated = courseIds.every(id => !!getGeneratedDoc(id, 'Certificate'));

    return (
        <div className="flex flex-col gap-4">
            {courseIds.map(id => {
                const cert = getGeneratedDoc(id, 'Certificate');
                
                // Certificate URLs logic
                const certBaseUrl = id === '2' 
                    ? 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/print-all-advanced-course.php'
                    : id === '7'
                    ? 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/english-certificate'
                    : id === '3'
                    ? 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/workshop-certificate.php'
                    : 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/print-all-certificates-course.php';
                const certPrintUrl = `${certBaseUrl}?courseCode=${id}&showSession=${registration.session}&tableMode=0&fixedStudentNumber=${registration.student_number}`;

                // Transcript URLs logic (Note: Transcript button appears if Cert is generated)
                const transBaseUrl = id === '2'
                    ? 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/print-all-transcript-advanced.php'
                    : 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/print-all-transcript.php';
                const transPrintUrl = `${transBaseUrl}?courseCode=${id}&showSession=${registration.session}&tableMode=0&fixedStudentNumber=${registration.student_number}`;

                return (
                    <div key={id} className="space-y-1.5 border-l-2 border-muted pl-2 py-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{courseNameMap.get(id) || `ID: ${id}`}</p>
                        <div className="flex flex-wrap gap-2">
                            {/* Certificate Section */}
                            <div className="flex items-center gap-1.5">
                                {cert ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-1">
                                                    <Badge variant={cert.print_status === '1' ? 'default' : 'secondary'} className="font-mono text-[9px] h-5 px-1.5">
                                                        <FileCheck className="h-2.5 w-2.5 mr-1" />
                                                        {cert.certificate_id}
                                                    </Badge>
                                                    <Button asChild size="icon" variant="ghost" className="h-6 w-6">
                                                        <a href={certPrintUrl} target="_blank" rel="noopener noreferrer">
                                                            <Printer className="h-3.5 w-3.5" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p className="text-xs font-bold">Certificate</p>
                                                <p className="text-[10px] opacity-70">Status: {cert.print_status === '1' ? 'Printed' : 'Generated'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (
                                    <Badge variant="outline" className="text-[8px] opacity-50 border-dashed h-5 px-1.5">CERT PENDING</Badge>
                                )}
                            </div>

                            {/* Transcript Section - Always show print button if Cert exists */}
                            <div className="flex items-center gap-1.5">
                                {cert ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-1">
                                                    <Badge variant="secondary" className="font-mono text-[9px] h-5 px-1.5 bg-blue-50 text-blue-700 border-blue-200 uppercase">
                                                        <FileText className="h-2.5 w-2.5 mr-1" />
                                                        Ready
                                                    </Badge>
                                                    <Button asChild size="icon" variant="ghost" className="h-6 w-6">
                                                        <a href={transPrintUrl} target="_blank" rel="noopener noreferrer">
                                                            <Printer className="h-3.5 w-3.5 text-blue-600" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p className="text-xs font-bold">Academic Transcript</p>
                                                <p className="text-[10px] opacity-70">Generated on-the-fly via ID {id}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (
                                    <Badge variant="outline" className="text-[8px] opacity-50 border-dashed h-5 px-1.5">TRANS PENDING</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {!allGenerated && (
                <Button 
                    size="sm" 
                    className="w-full h-8 text-[10px] font-bold uppercase" 
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                >
                    {generateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Award className="h-3 w-3 mr-1.5" />}
                    Generate All Docs
                </Button>
            )}
        </div>
    );
};

export default function ConvocationCertificateGenPage() {
    const queryClient = useQueryClient();
    const [selectedCeremonyId, setSelectedCeremonyId] = useState('');
    const [selectedSession, setSelectedSession] = useState('all');
    const [selectedCourseId, setSelectedCourseId] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Bulk Generation States
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(0);
    const [isBulkGenerating, setIsBulkGenerating] = useState(false);
    const [bulkCurrentIndex, setBulkCurrentIndex] = useState(0);
    const [bulkTotalCount, setBulkTotalCount] = useState(0);
    const [bulkProcessingDetails, setBulkProcessingDetails] = useState('');
    const [bulkEtah, setBulkEtah] = useState<string | null>(null);
    const generationStartTimeRef = useRef<number | null>(null);

    const { data: ceremonies, isLoading: isLoadingCeremonies } = useQuery<ConvocationCeremony[]>({
        queryKey: ['convocationCeremonies'],
        queryFn: getConvocationCeremonies,
    });

    const { data: registrations, isLoading: isLoadingRegs } = useQuery<ConvocationRegistration[]>({
        queryKey: ['convocationRegistrations', selectedCeremonyId],
        queryFn: () => getConvocationRegistrations(selectedCeremonyId || undefined),
        enabled: !!selectedCeremonyId,
    });

    const { data: parentCourses } = useQuery<ParentCourse[]>({
        queryKey: ['allParentCourses'],
        queryFn: getParentCourses,
        staleTime: Infinity,
    });

    const courseNameMap = useMemo(() => {
        if (!parentCourses) return new Map<string, string>();
        return new Map(parentCourses.map(c => [c.id, c.course_name]));
    }, [parentCourses]);

    const filteredRegs = useMemo(() => {
        if (!registrations) return [];
        const lower = searchTerm.toLowerCase();
        return registrations.filter(r => {
            const matchesSearch = !searchTerm || 
                r.student_number.toLowerCase().includes(lower) || 
                r.reference_number.toLowerCase().includes(lower) ||
                (r.name_on_certificate || '').toLowerCase().includes(lower);
            const matchesSession = selectedSession === 'all' || r.session === selectedSession;
            const matchesCourse = selectedCourseId === 'all' || r.course_id.split(',').map(id => id.trim()).includes(selectedCourseId);
            
            // Only show active/pending bookings for generation
            const isInactive = r.registration_status === 'Rejected' || r.registration_status === 'Canceled';
            return matchesSearch && matchesSession && matchesCourse && !isInactive;
        });
    }, [registrations, searchTerm, selectedSession, selectedCourseId]);

    const paginatedRegs = useMemo(() => {
        return filteredRegs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredRegs, currentPage]);

    const totalPages = Math.ceil(filteredRegs.length / ITEMS_PER_PAGE);

    const handleBulkGenerate = async () => {
        if (filteredRegs.length === 0) return;

        setIsBulkGenerating(true);
        setBulkTotalCount(filteredRegs.length);
        setBulkCurrentIndex(0);
        setBulkProgress(0);
        setBulkEtah(null);
        generationStartTimeRef.current = Date.now();

        for (let i = 0; i < filteredRegs.length; i++) {
            const reg = filteredRegs[i];
            setBulkCurrentIndex(i + 1);
            setBulkProcessingDetails(`${reg.student_number} - ${reg.name_on_certificate || 'Student'}`);
            
            try {
                // Call the API for this booking
                await generateAllCertificatesForBooking(reg.registration_id);
                
                // Update Progress
                const progress = Math.round(((i + 1) / filteredRegs.length) * 100);
                setBulkProgress(progress);

                // Calculate ETA
                const elapsedTime = Date.now() - generationStartTimeRef.current!;
                const averageTime = elapsedTime / (i + 1);
                const remaining = filteredRegs.length - (i + 1);
                const etrSeconds = Math.round((averageTime * remaining) / 1000);
                
                if (etrSeconds > 60) {
                    setBulkEtah(`${Math.floor(etrSeconds / 60)}m ${etrSeconds % 60}s`);
                } else {
                    setBulkEtah(`${etrSeconds}s`);
                }

            } catch (error) {
                console.error(`Failed to generate for ${reg.student_number}:`, error);
            }
        }

        setIsBulkGenerating(false);
        setBulkProcessingDetails('Process Complete!');
        toast({ title: 'Bulk Generation Finished', description: `Processed ${filteredRegs.length} records.` });
        queryClient.invalidateQueries({ queryKey: ['convocationRegistrations', selectedCeremonyId] });
    };

    // Bulk print URL logic for Certificates
    const getBulkPrintUrl = (mode: number) => {
        const baseUrl = selectedCourseId === '2'
            ? 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/print-all-advanced-course.php'
            : selectedCourseId === '7'
            ? 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/english-certificate'
            : selectedCourseId === '3'
            ? 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/workshop-certificate.php'
            : 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/print-all-certificates-course.php';
        
        return `${baseUrl}?courseCode=${selectedCourseId}&showSession=${selectedSession}&tableMode=${mode}`;
    };

    // Bulk print URL logic for Transcripts
    const getBulkTranscriptPrintUrl = (mode: number) => {
        const baseUrl = selectedCourseId === '2'
            ? 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/print-all-transcript-advanced.php'
            : 'https://admin.pharmacollege.lk/assets/content/lms-management/certification/print-view/print-all-transcript.php';
        
        return `${baseUrl}?courseCode=${selectedCourseId}&showSession=${selectedSession}&tableMode=${mode}`;
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">Convocation Certificate Issuance</h1>
                    <p className="text-muted-foreground">Select a ceremony to generate and manage certificates for registered students.</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isBulkOpen} onOpenChange={(open) => !isBulkGenerating && setIsBulkOpen(open)}>
                        <DialogTrigger asChild>
                            <Button variant="default" disabled={!selectedCeremonyId || filteredRegs.length === 0}>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Generate All Filtered ({filteredRegs.length})
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md" hideCloseButton={isBulkGenerating}>
                            <DialogHeader>
                                <DialogTitle>Bulk Certificate Generation</DialogTitle>
                                <DialogDescription>
                                    This will generate all required certificates for the {filteredRegs.length} students in the current filtered list.
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="py-6 space-y-6">
                                {isBulkGenerating ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Currently Processing</p>
                                                <p className="text-sm font-semibold truncate max-w-[250px]">{bulkProcessingDetails}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Remaining Time</p>
                                                <p className="text-sm font-mono font-bold text-primary">{bulkEtah || 'Calculating...'}</p>
                                            </div>
                                        </div>
                                        <Progress value={bulkProgress} className="h-3" />
                                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                            <span>Progress: {bulkProgress}%</span>
                                            <span>{bulkCurrentIndex} of {bulkTotalCount}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <Award className="h-12 w-12 text-primary mx-auto mb-2 opacity-50" />
                                        <p className="text-sm font-medium">Ready to process {filteredRegs.length} records.</p>
                                        <p className="text-xs text-muted-foreground mt-1">Estimated time: ~{Math.ceil(filteredRegs.length * 1.5)} seconds</p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsBulkOpen(false)} disabled={isBulkGenerating}>Cancel</Button>
                                {!isBulkGenerating && (
                                    <Button onClick={handleBulkGenerate}>Start Generation</Button>
                                )}
                                {bulkProgress === 100 && !isBulkGenerating && (
                                    <Button onClick={() => setIsBulkOpen(false)}>Done</Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Ceremony Selection</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Active Ceremony</Label>
                            <Select value={selectedCeremonyId} onValueChange={setSelectedCeremonyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingCeremonies ? "Loading..." : "Choose Ceremony"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {ceremonies?.filter(c => c.accept_booking === '1').map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.convocation_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Session Filter</Label>
                                <Select value={selectedSession} onValueChange={setSelectedSession}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Sessions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sessions</SelectItem>
                                        <SelectItem value="1">Session 1</SelectItem>
                                        <SelectItem value="2">Session 2</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Course Filter</Label>
                                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Courses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Courses</SelectItem>
                                        {parentCourses?.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Search</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label>Search Students</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input 
                                    placeholder="ID, Name, or Ref #..." 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10" 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Bulk Printing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <Button asChild variant="outline" className="h-auto py-2 flex-col gap-1" disabled={selectedCourseId === 'all' || selectedSession === 'all'}>
                                <a href={getBulkPrintUrl(1)} target="_blank" rel="noopener noreferrer">
                                    <List className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-[9px] font-bold uppercase">Cert Table</span>
                                </a>
                            </Button>
                            <Button asChild variant="outline" className="h-auto py-2 flex-col gap-1" disabled={selectedCourseId === 'all' || selectedSession === 'all'}>
                                <a href={getBulkPrintUrl(0)} target="_blank" rel="noopener noreferrer">
                                    <Printer className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-[9px] font-bold uppercase">Certificates</span>
                                </a>
                            </Button>
                            <Button asChild variant="outline" className="h-auto py-2 flex-col gap-1" disabled={selectedCourseId === 'all' || selectedSession === 'all'}>
                                <a href={getBulkTranscriptPrintUrl(1)} target="_blank" rel="noopener noreferrer">
                                    <List className="h-3.5 w-3.5 text-orange-500" />
                                    <span className="text-[9px] font-bold uppercase">Trans Table</span>
                                </a>
                            </Button>
                            <Button asChild variant="outline" className="h-auto py-2 flex-col gap-1" disabled={selectedCourseId === 'all' || selectedSession === 'all'}>
                                <a href={getBulkTranscriptPrintUrl(0)} target="_blank" rel="noopener noreferrer">
                                    <Printer className="h-3.5 w-3.5 text-orange-500" />
                                    <span className="text-[9px] font-bold uppercase">Transcripts</span>
                                </a>
                            </Button>
                        </div>
                        { (selectedCourseId === 'all' || selectedSession === 'all') && (
                            <p className="text-[10px] text-muted-foreground text-center italic">
                                * Select course and session to enable bulk print.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Card className="shadow-lg">
                <CardHeader className="bg-muted/20 border-b">
                    <div className="flex justify-between items-center">
                        <CardTitle>Registration List</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                            <span>{filteredRegs.length} records found</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoadingRegs ? (
                        <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                    ) : selectedCeremonyId ? (
                        <div className="w-full overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">Student ID</TableHead>
                                        <TableHead>Full Name</TableHead>
                                        <TableHead>Sess.</TableHead>
                                        <TableHead>Issuance Status (IDs & Printing)</TableHead>
                                        <TableHead className="text-right pr-6">Data</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRegs.length > 0 ? paginatedRegs.map(reg => (
                                        <TableRow key={reg.registration_id}>
                                            <TableCell className="font-mono font-bold text-sm">{reg.student_number}</TableCell>
                                            <TableCell className="text-xs font-medium">{reg.name_on_certificate || 'N/A'}</TableCell>
                                            <TableCell><Badge variant="outline">{reg.session}</Badge></TableCell>
                                            <TableCell className="py-4">
                                                <BookingCertificateControl 
                                                    registration={reg}
                                                    courseNameMap={courseNameMap}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <Database className="h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Raw Booking Data: {reg.student_number}</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="mt-4 p-4 rounded bg-muted font-mono text-[10px] overflow-auto max-h-[60vh]">
                                                            <pre>{JSON.stringify(reg, null, 2)}</pre>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={5} className="text-center h-32 text-muted-foreground">No matching registrations found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                            <GraduationCap className="w-16 h-16 mb-4 opacity-20" />
                            <h3 className="text-lg font-semibold">Ready to Generate</h3>
                            <p className="text-sm">Please select an active convocation ceremony to load registrations.</p>
                        </div>
                    )}
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="flex justify-center border-t py-4">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                            <span className="text-xs font-medium">Page {currentPage} of {totalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
