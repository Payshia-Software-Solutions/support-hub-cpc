"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getParentCourses, getBatches } from '@/lib/actions/courses';
import { getGeneratedCertificatesByBatch } from '@/lib/actions/certificates';
import { getStudentsByCourseCode } from '@/lib/actions/delivery';
import type { ParentCourse, Batch, GeneratedCertificateBatchInfo, StudentInBatch } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Search, FileDown, Loader2, AlertCircle, Award, FileText, CheckCircle2, BookText, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface GroupedIssuance {
    student_number: string;
    full_name: string;
    name_on_certificate: string;
    certificate_id: string;
    transcript_id: string;
    workshop_certificate_id: string;
    status: string;
}

export default function IssuedCertificatesReportPage() {
    const [selectedParentCourseId, setSelectedParentCourseId] = useState<string>('');
    const [selectedBatchCode, setSelectedBatchCode] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [isExporting, setIsExporting] = useState(false);

    const { data: parentCourses, isLoading: isLoadingParentCourses } = useQuery<ParentCourse[]>({
        queryKey: ['parentCoursesForIssuanceReport'],
        queryFn: getParentCourses,
        staleTime: Infinity,
    });

    const { data: allBatches, isLoading: isLoadingBatches } = useQuery<Batch[]>({
        queryKey: ['allBatchesForIssuanceReport'],
        queryFn: getBatches,
        staleTime: Infinity,
    });

    const { data: students, isLoading: isLoadingStudents } = useQuery<StudentInBatch[]>({
        queryKey: ['studentsByBatchForIssuanceReport', selectedBatchCode],
        queryFn: () => getStudentsByCourseCode(selectedBatchCode),
        enabled: !!selectedBatchCode,
    });

    const { data: issuanceData, isLoading: isLoadingIssuance, isError, error } = useQuery<GeneratedCertificateBatchInfo[]>({
        queryKey: ['generatedCertsReport', selectedBatchCode],
        queryFn: () => getGeneratedCertificatesByBatch(selectedBatchCode),
        enabled: !!selectedBatchCode,
        staleTime: 1000 * 60 * 5,
    });

    const filteredBatches = useMemo(() => {
        if (!allBatches || !selectedParentCourseId) return [];
        return allBatches.filter(b => b.parent_course_id === selectedParentCourseId);
    }, [allBatches, selectedParentCourseId]);

    const groupedData = useMemo(() => {
        if (!students) return [];
        
        const map = new Map<string, GroupedIssuance>();
        
        // Step 1: Add all enrolled students as the base
        students.forEach(s => {
            map.set(s.username, {
                student_number: s.username,
                full_name: s.full_name,
                name_on_certificate: '', // Will be filled from issuance data if available
                certificate_id: '',
                transcript_id: '',
                workshop_certificate_id: '',
                status: 'Pending'
            });
        });

        // Step 2: Merge issuance data
        if (issuanceData) {
            issuanceData.forEach(item => {
                const existing = map.get(item.student_number);
                if (existing) {
                    existing.name_on_certificate = item.name_on_certificate;
                    if (item.document_type === 'Certificate') {
                        existing.certificate_id = item.certificate_id;
                        if (item.print_status === '1') existing.status = 'Printed';
                    } else if (item.document_type === 'Transcript') {
                        existing.transcript_id = item.certificate_id;
                    } else if (item.document_type === 'Workshop-Certificate') {
                        existing.workshop_certificate_id = item.certificate_id;
                    }
                } else {
                    // This handles students who might have a cert but are somehow not in the enrollment list (edge cases)
                    map.set(item.student_number, {
                        student_number: item.student_number,
                        full_name: item.full_name,
                        name_on_certificate: item.name_on_certificate,
                        certificate_id: item.document_type === 'Certificate' ? item.certificate_id : '',
                        transcript_id: item.document_type === 'Transcript' ? item.certificate_id : '',
                        workshop_certificate_id: item.document_type === 'Workshop-Certificate' ? item.certificate_id : '',
                        status: item.print_status === '1' ? 'Printed' : 'Pending'
                    });
                }
            });
        }

        return Array.from(map.values());
    }, [students, issuanceData]);

    const filteredGroupedData = useMemo(() => {
        if (!groupedData) return [];
        const lower = searchTerm.toLowerCase();
        return groupedData.filter(s => 
            s.student_number.toLowerCase().includes(lower) || 
            s.full_name.toLowerCase().includes(lower) ||
            s.name_on_certificate.toLowerCase().includes(lower) ||
            s.certificate_id.toLowerCase().includes(lower) ||
            s.transcript_id.toLowerCase().includes(lower) ||
            s.workshop_certificate_id.toLowerCase().includes(lower)
        );
    }, [groupedData, searchTerm]);

    const totalPages = Math.ceil(filteredGroupedData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        return filteredGroupedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredGroupedData, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedBatchCode, searchTerm]);

    const handleExport = () => {
        if (filteredGroupedData.length === 0) {
            toast({ variant: 'destructive', title: 'No data to export' });
            return;
        }

        setIsExporting(true);
        try {
            const courseName = parentCourses?.find(pc => pc.id === selectedParentCourseId)?.course_name || 'N/A';
            const headers = ['Course Name', 'Student ID', 'Full Name', 'Name on Certificate', 'Certificate ID', 'Transcript ID', 'Workshop Cert ID', 'Status'];
            const rows = filteredGroupedData.map(s => [
                courseName,
                s.student_number,
                s.full_name,
                s.name_on_certificate,
                s.certificate_id,
                s.transcript_id,
                s.workshop_certificate_id,
                s.status
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', `Issuance_Report_${selectedBatchCode}_${format(new Date(), 'yyyyMMdd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({ title: 'Export Successful', description: 'The issuance report has been downloaded.' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Export Failed' });
        } finally {
            setIsExporting(false);
        }
    };

    const isLoading = isLoadingParentCourses || isLoadingBatches || isLoadingStudents || isLoadingIssuance;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">Issued Certificates Report</h1>
                    <p className="text-muted-foreground">Detailed student-to-certificate mapping for audit and logistics.</p>
                </div>
                <Button onClick={handleExport} disabled={!selectedBatchCode || isExporting || isLoading}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    Export Issuance List (CSV)
                </Button>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">Filter Selection</CardTitle>
                        <CardDescription>Select a batch to load document issuance data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Parent Course</Label>
                            <Select value={selectedParentCourseId} onValueChange={(val) => { setSelectedParentCourseId(val); setSelectedBatchCode(''); }}>
                                <SelectTrigger><SelectValue placeholder={isLoadingParentCourses ? "Loading..." : "Choose Course..."} /></SelectTrigger>
                                <SelectContent>
                                    {parentCourses?.map(pc => <SelectItem key={pc.id} value={pc.id}>{pc.course_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Batch (Course Code)</Label>
                            <Select value={selectedBatchCode} onValueChange={setSelectedBatchCode} disabled={!selectedParentCourseId || isLoadingBatches}>
                                <SelectTrigger><SelectValue placeholder={isLoadingBatches ? "Loading..." : "Choose Batch..."} /></SelectTrigger>
                                <SelectContent>
                                    {filteredBatches.map(b => <SelectItem key={b.id} value={b.courseCode}>{b.name} ({b.courseCode})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Search</CardTitle>
                        <CardDescription>Find specific records by ID, Name or Certificate #.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search details..." 
                                    className="pl-10" 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    disabled={!selectedBatchCode}
                                />
                            </div>
                        </div>
                        <div className="pt-4 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-medium flex items-center gap-2"><Users className="h-4 w-4"/>Total Students:</span>
                            <span className="font-bold">{isLoading ? "..." : (filteredGroupedData.length)}</span>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {selectedBatchCode && (
                <Card className="shadow-lg">
                    <CardHeader className="bg-muted/20">
                        <CardTitle>Issuance Table: {selectedBatchCode}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                        ) : isError ? (
                            <Alert variant="destructive" className="m-6"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[150px]">Student ID</TableHead>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Certificate ID</TableHead>
                                            <TableHead>Transcript ID</TableHead>
                                            <TableHead>Workshop Cert ID</TableHead>
                                            <TableHead className="text-right pr-6">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedData.length > 0 ? paginatedData.map((s) => (
                                            <TableRow key={s.student_number}>
                                                <TableCell className="font-mono font-bold text-sm">{s.student_number}</TableCell>
                                                <TableCell className="text-xs">{s.full_name}</TableCell>
                                                <TableCell>
                                                    {s.certificate_id ? (
                                                        <Badge variant="outline" className="gap-1 font-mono text-[10px] bg-primary/5 border-primary/20">
                                                            <Award className="h-2.5 w-2.5 text-primary" /> {s.certificate_id}
                                                        </Badge>
                                                    ) : <span className="text-[10px] text-muted-foreground italic">Pending</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {s.transcript_id ? (
                                                        <Badge variant="outline" className="gap-1 font-mono text-[10px] bg-blue-50 border-blue-200 text-blue-700">
                                                            <FileText className="h-2.5 w-2.5 text-blue-600" /> {s.transcript_id}
                                                        </Badge>
                                                    ) : <span className="text-[10px] text-muted-foreground italic">Pending</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {s.workshop_certificate_id ? (
                                                        <Badge variant="outline" className="gap-1 font-mono text-[10px] bg-orange-50 border-orange-200 text-orange-700">
                                                            <BookText className="h-2.5 w-2.5 text-orange-600" /> {s.workshop_certificate_id}
                                                        </Badge>
                                                    ) : <span className="text-[10px] text-muted-foreground italic">Pending</span>}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Badge variant={s.status === 'Printed' ? 'default' : 'secondary'} className={cn("uppercase text-[9px] h-5", s.status === 'Printed' && "bg-green-600")}>
                                                        {s.status === 'Printed' && <CheckCircle2 className="mr-1 h-2.5 w-2.5" />}
                                                        {s.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={6} className="text-center h-32 text-muted-foreground italic">No students found in this batch.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                    {totalPages > 1 && (
                        <CardFooter className="flex items-center justify-center space-x-2 pt-6 border-t">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
                        </CardFooter>
                    )}
                </Card>
            )}
        </div>
    );
}
