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
    PlayCircle
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
    
    const getGeneratedCert = (courseId: string) => {
        return certStatus?.certificateStatus?.find(c => c.parent_course_id === courseId && c.type === 'Certificate');
    };

    const allGenerated = courseIds.every(id => !!getGeneratedCert(id));

    if (isLoading) return <div className="space-y-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-24" /></div>;

    return (
        <div className="flex flex-col gap-2">
            {courseIds.map(id => {
                const cert = getGeneratedCert(id);
                return (
                    <div key={id} className="flex items-center gap-2 h-6">
                        {cert ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={cert.print_status === '1' ? 'default' : 'secondary'} className="font-mono text-[9px] h-5">
                                                {cert.certificate_id}
                                            </Badge>
                                            <Button asChild size="icon" variant="ghost" className="h-5 w-5">
                                                <Link href={`/print/certificate/${cert.certificate_id}`} target="_blank">
                                                    <Printer className="h-3 w-3" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{cert.print_status === '1' ? 'Printed' : 'Generated'}</p>
                                        <p className="text-[10px] opacity-70">Course: {courseNameMap.get(id) || id}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <Badge variant="outline" className="text-[8px] opacity-50 border-dashed h-4 px-1">PENDING</Badge>
                        )}
                    </div>
                );
            })}
            
            {!allGenerated && (
                <Button 
                    size="sm" 
                    className="w-full mt-1 h-7 text-[9px] font-bold uppercase" 
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                >
                    {generateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Award className="h-3 w-3 mr-1" />}
                    Generate All
                </Button>
            )}
        </div>
    );
};

export default function ConvocationCertificateGenPage() {
    const queryClient = useQueryClient();
    const [selectedCeremonyId, setSelectedCeremonyId] = useState('');
    const [selectedSession, setSelectedSession] = useState('all');
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

    const { data: registrations, isLoading: isLoadingRegs, isFetching } = useQuery<ConvocationRegistration[]>({
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
            // Only show active/pending bookings for generation
            const isInactive = r.registration_status === 'Rejected' || r.registration_status === 'Canceled';
            return matchesSearch && matchesSession && !isInactive;
        });
    }, [registrations, searchTerm, selectedSession]);

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
                // We continue with others even if one fails
            }
        }

        setIsBulkGenerating(false);
        setBulkProcessingDetails('Process Complete!');
        toast({ title: 'Bulk Generation Finished', description: `Processed ${filteredRegs.length} records.` });
        queryClient.invalidateQueries({ queryKey: ['convocationRegistrations', selectedCeremonyId] });
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

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Ceremony Selection</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                <Input 
                                    placeholder="ID, Name, or Ref #..." 
                                    className="pl-10" 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <Card className="shadow-lg">
                <CardHeader className="bg-muted/20 border-b">
                    <div className="flex justify-between items-center">
                        <CardTitle>Registration List</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                            {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
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
                                        <TableHead>Requested Courses</TableHead>
                                        <TableHead>Certificate Status</TableHead>
                                        <TableHead className="text-right pr-6">Data</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRegs.length > 0 ? paginatedRegs.map(reg => (
                                        <TableRow key={reg.registration_id}>
                                            <TableCell className="font-mono font-bold text-sm">{reg.student_number}</TableCell>
                                            <TableCell className="text-xs font-medium">{reg.name_on_certificate || 'N/A'}</TableCell>
                                            <TableCell><Badge variant="outline">{reg.session}</Badge></TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 max-w-[200px]">
                                                    {reg.course_id.split(',').map(id => id.trim()).filter(Boolean).map(id => (
                                                        <div key={id} className="text-[10px] truncate leading-6" title={courseNameMap.get(id)}>
                                                            • {courseNameMap.get(id) || `ID: ${id}`}
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
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
                                        <TableRow><TableCell colSpan={6} className="text-center h-32 text-muted-foreground">No matching registrations found.</TableCell></TableRow>
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
