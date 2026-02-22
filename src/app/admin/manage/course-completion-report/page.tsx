
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getParentCourses, getBatches } from '@/lib/actions/courses';
import { getStudentsByCourseCode } from '@/lib/actions/delivery';
import { getStudentFullInfo } from '@/lib/actions/users';
import { getGeneratedCertificatesByBatch } from '@/lib/actions/certificates';
import type { ParentCourse, Batch, StudentInBatch, FullStudentData, GeneratedCertificateBatchInfo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Search, FileDown, Loader2, CheckCircle, XCircle, AlertCircle, Info, Award, Phone, MapPin, Clock, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

export default function CourseCompletionReportPage() {
    const [selectedParentCourseId, setSelectedParentCourseId] = useState<string>('');
    const [selectedBatchCode, setSelectedBatchCode] = useState<string>('');
    const [isReportViewed, setIsReportViewed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [isExporting, setIsExporting] = useState(false);
    
    const [studentDataMap, setStudentDataMap] = useState<Map<string, FullStudentData>>(new Map());

    const { data: parentCourses, isLoading: isLoadingParentCourses } = useQuery<ParentCourse[]>({
        queryKey: ['parentCoursesForReport'],
        queryFn: getParentCourses,
        staleTime: Infinity,
    });

    const { data: allBatches, isLoading: isLoadingBatches } = useQuery<Batch[]>({
        queryKey: ['allBatchesForReport'],
        queryFn: getBatches,
        staleTime: Infinity,
    });

    const filteredBatches = useMemo(() => {
        if (!allBatches || !selectedParentCourseId) return [];
        return allBatches.filter(b => b.parent_course_id === selectedParentCourseId);
    }, [allBatches, selectedParentCourseId]);

    const { data: students, isLoading: isLoadingStudents, isError, error } = useQuery<StudentInBatch[]>({
        queryKey: ['studentsByBatchForReport', selectedBatchCode],
        queryFn: () => getStudentsByCourseCode(selectedBatchCode),
        enabled: !!selectedBatchCode,
    });

    const { data: batchCertificates, isLoading: isLoadingBatchCerts } = useQuery<GeneratedCertificateBatchInfo[]>({
        queryKey: ['generatedCertsByBatch', selectedBatchCode],
        queryFn: () => getGeneratedCertificatesByBatch(selectedBatchCode),
        enabled: !!selectedBatchCode,
        staleTime: 1000 * 60 * 5,
    });

    const batchCertificatesMap = useMemo(() => {
        if (!batchCertificates) return new Map<string, GeneratedCertificateBatchInfo[]>();
        const map = new Map<string, GeneratedCertificateBatchInfo[]>();
        batchCertificates.forEach(cert => {
            const current = map.get(cert.student_number) || [];
            map.set(cert.student_number, [...current, cert]);
        });
        return map;
    }, [batchCertificates]);

    useEffect(() => {
        setCurrentPage(1);
        setIsReportViewed(false); // Reset view when batch changes
    }, [selectedBatchCode]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    const filteredStudents = useMemo(() => {
        if (!students) return [];
        const lower = searchTerm.toLowerCase();
        return students.filter(s => 
            s.username.toLowerCase().includes(lower) || 
            s.full_name.toLowerCase().includes(lower)
        );
    }, [students, searchTerm]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = useMemo(() => {
        return filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredStudents, currentPage, itemsPerPage]);

    const studentUsernamesToFetch = useMemo(() => {
        return paginatedStudents
            .map(s => s.username)
            .filter(un => !studentDataMap.has(un));
    }, [paginatedStudents, studentDataMap]);

    const { isLoading: isLoadingDetails } = useQuery({
        queryKey: ['batchCompletionDetails', studentUsernamesToFetch],
        queryFn: async () => {
            if (studentUsernamesToFetch.length === 0) return null;
            const results: (FullStudentData | null)[] = [];
            const chunkSize = 5;
            for (let i = 0; i < studentUsernamesToFetch.length; i += chunkSize) {
                const chunk = studentUsernamesToFetch.slice(i, i + chunkSize);
                const chunkResults = await Promise.all(
                    chunk.map(un => getStudentFullInfo(un).catch(() => null))
                );
                results.push(...chunkResults);
            }
            setStudentDataMap(prev => {
                const newMap = new Map(prev);
                results.forEach((data, index) => {
                    if (data) newMap.set(studentUsernamesToFetch[index], data);
                });
                return newMap;
            });
            return true;
        },
        enabled: isReportViewed && studentUsernamesToFetch.length > 0,
        refetchOnWindowFocus: false,
    });

    const estimatedExportTime = useMemo(() => {
        if (!students?.length) return 0;
        return Math.ceil(students.length / 10) * 1.5;
    }, [students]);

    const handlePageInputChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const pageNum = parseInt(e.currentTarget.value, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                setCurrentPage(pageNum);
            } else {
                 toast({ variant: 'destructive', title: 'Invalid Page', description: `Enter 1-${totalPages}` });
            }
        }
    };

    const handleExport = async () => {
        if (!students || students.length === 0) {
            toast({ variant: 'destructive', title: 'No data to export' });
            return;
        }

        setIsExporting(true);
        try {
            toast({ 
                title: 'Preparing Export', 
                description: `Fetching detailed status. Estimated time: ${Math.ceil(estimatedExportTime)}s...` 
            });
            
            const courseName = parentCourses?.find(pc => pc.id === selectedParentCourseId)?.course_name || 'N/A';
            const allFullData: (FullStudentData | null)[] = [];
            const batchSize = 10;
            
            for (let i = 0; i < students.length; i += batchSize) {
                const batch = students.slice(i, i + batchSize);
                const batchResults = await Promise.all(
                    batch.map(s => getStudentFullInfo(s.username).catch(() => null))
                );
                allFullData.push(...batchResults);
                if (i + batchSize < students.length) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            const headers = ['Course Name', 'Student ID', 'Full Name', 'Phone 1', 'Phone 2', 'Address', 'Batch', 'Status', 'Avg Grade (%)', 'Certificate ID', 'Transcript ID', 'Workshop Cert ID', 'Missing Criteria'];
            const rows = students.map((s, idx) => {
                const data = allFullData[idx];
                const enrollment = data ? Object.values(data.studentEnrollments).find((e: any) => e.course_code === selectedBatchCode) : null;
                const isCompleted = enrollment?.certificate_eligibility || false;
                const missing = enrollment ? enrollment.criteria_details.filter((c: any) => !c.evaluation.completed).map((c: any) => c.list_name).join('; ') : 'Data Load Error';
                
                const certs = batchCertificatesMap.get(s.username) || [];
                const certId = certs.find(c => c.document_type === 'Certificate')?.certificate_id || '';
                const transId = certs.find(c => c.document_type === 'Transcript')?.certificate_id || '';
                const workshopId = certs.find(c => c.document_type === 'Workshop-Certificate')?.certificate_id || '';

                const fullAddress = data ? [data.studentInfo.address_line_1, data.studentInfo.address_line_2, data.studentInfo.city, data.studentInfo.district].filter(Boolean).join(', ') : '';

                return [
                    courseName,
                    s.username,
                    s.full_name,
                    data?.studentInfo.telephone_1 || '',
                    data?.studentInfo.telephone_2 || '',
                    fullAddress,
                    selectedBatchCode,
                    isCompleted ? 'Completed' : 'Incomplete',
                    enrollment?.assignment_grades.average_grade || '0.00',
                    certId,
                    transId,
                    workshopId,
                    missing
                ];
            });

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', `Completion_Report_${selectedBatchCode}_${format(new Date(), 'yyyyMMdd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({ title: 'Export Successful', description: 'The report has been downloaded.' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate report.' });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">Course Completion Report</h1>
                    <p className="text-muted-foreground">Monitor and export students' progress and issued certificates.</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <Button onClick={handleExport} disabled={!selectedBatchCode || isExporting || isLoadingStudents}>
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                        {isExporting ? 'Preparing...' : 'Export Report (CSV)'}
                    </Button>
                    {selectedBatchCode && !isExporting && students && students.length > 0 && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Est. Time: {Math.ceil(estimatedExportTime)}s
                        </p>
                    )}
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">Step 1: Select Filters</CardTitle>
                        <CardDescription>Choose a parent course then a specific batch.</CardDescription>
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
                        {selectedBatchCode && (
                            <Button className="w-full mt-4" variant={isReportViewed ? "secondary" : "default"} onClick={() => setIsReportViewed(true)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {isReportViewed ? "Refresh Detailed Report" : "View Detailed Report"}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">Step 2: Refine Results</CardTitle>
                        <CardDescription>Quick search and batch summary.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Search Students</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Name or ID..." 
                                    className="pl-10" 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    disabled={!selectedBatchCode}
                                />
                            </div>
                        </div>
                        <div className="pt-4 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Batch Population:</span>
                            <span className="font-bold">{isLoadingStudents ? "..." : (students?.length || 0)} Students</span>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {isReportViewed && selectedBatchCode && (
                <Card className="shadow-lg border-primary/10 animate-in fade-in-50 duration-500">
                    <CardHeader className="bg-muted/20">
                        <CardTitle>Batch Completion Status: {selectedBatchCode}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoadingStudents || isLoadingBatchCerts ? (
                            <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                        ) : isError ? (
                            <Alert variant="destructive" className="m-6"><AlertCircle className="h-4 w-4" /><AlertTitle>Data Load Error</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[120px]">Student ID</TableHead>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead className="max-w-[150px]">Address</TableHead>
                                            <TableHead>Generated Docs</TableHead>
                                            <TableHead>Avg Grade</TableHead>
                                            <TableHead className="w-[150px]">Status</TableHead>
                                            <TableHead className="text-right pr-6">Eligibility Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedStudents.length > 0 ? paginatedStudents.map((s) => {
                                            const data = studentDataMap.get(s.username);
                                            const enrollment = data ? Object.values(data.studentEnrollments).find(e => e.course_code === selectedBatchCode) : null;
                                            const isCompleted = enrollment?.certificate_eligibility || false;
                                            const isRowLoading = isLoadingDetails && !data;
                                            const issuedCerts = batchCertificatesMap.get(s.username) || [];

                                            return (
                                                <TableRow key={s.student_course_id}>
                                                    <TableCell className="font-mono font-bold text-xs">{s.username}</TableCell>
                                                    <TableCell className="text-xs font-medium">{s.full_name}</TableCell>
                                                    <TableCell className="text-[10px]">
                                                        {isRowLoading ? <Skeleton className="h-4 w-20" /> : 
                                                         data ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{data.studentInfo.telephone_1}</span>
                                                                {data.studentInfo.telephone_2 && <span className="text-muted-foreground">{data.studentInfo.telephone_2}</span>}
                                                            </div>
                                                         ) : "N/A"}
                                                    </TableCell>
                                                    <TableCell className="text-[10px] max-w-[150px] truncate">
                                                        {isRowLoading ? <Skeleton className="h-4 w-32" /> : 
                                                         data ? (
                                                            <div className="flex items-start gap-1">
                                                                <MapPin className="h-2.5 w-2.5 shrink-0 mt-0.5" />
                                                                <span className="truncate">{data.studentInfo.address_line_1}, {data.studentInfo.city}</span>
                                                            </div>
                                                         ) : "N/A"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {issuedCerts.length > 0 ? (
                                                                issuedCerts.map(cert => (
                                                                    <TooltipProvider key={cert.certificate_id}>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-1 font-mono">
                                                                                    <Award className="h-2.5 w-2.5 text-primary" />
                                                                                    {cert.certificate_id}
                                                                                </Badge>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p className="text-xs font-bold">{cert.document_type}</p>
                                                                                <p className="text-[10px] text-muted-foreground">ID: {cert.certificate_id}</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                ))
                                                            ) : (
                                                                <span className="text-[10px] text-muted-foreground italic">None issued</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {isRowLoading ? <Skeleton className="h-4 w-12" /> : 
                                                         enrollment ? <span className="font-mono text-xs">{parseFloat(enrollment.assignment_grades.average_grade).toFixed(2)}%</span> : "N/A"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {isRowLoading ? <Skeleton className="h-6 w-24 rounded-full" /> : (
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={isCompleted ? "default" : "destructive"} className={cn("uppercase text-[10px]", isCompleted && "bg-green-600")}>
                                                                    {isCompleted ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                                                                    {isCompleted ? "Completed" : "Incomplete"}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        {isRowLoading ? <Skeleton className="h-8 w-8 rounded-md ml-auto" /> : enrollment && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5">
                                                                            <Info className="h-3.5 w-3.5" />
                                                                            {isCompleted ? "All Verified" : `${enrollment.criteria_details.filter(c => !c.evaluation.completed).length} Pending`}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="left" className="w-64 p-3">
                                                                        <p className="font-bold text-xs mb-2 border-b pb-1">Criteria Verification</p>
                                                                        <div className="space-y-1.5">
                                                                            {enrollment.criteria_details.map(c => (
                                                                                <div key={c.id} className="flex justify-between items-center text-[10px]">
                                                                                    <span className={cn(c.evaluation.completed ? "text-green-600" : "text-destructive")}>
                                                                                        {c.evaluation.completed ? "✓" : "×"} {c.list_name}
                                                                                    </span>
                                                                                    <span className="font-mono">{c.evaluation.currentValue}/{c.evaluation.requiredValue}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        }) : (
                                            <TableRow><TableCell colSpan={8} className="text-center h-32 text-muted-foreground italic">No students found.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                    {totalPages > 0 && (
                        <CardFooter className="flex flex-col-reverse items-center gap-y-4 gap-x-6 sm:flex-row sm:justify-between pt-6 border-t">
                            <div className="text-sm text-muted-foreground">
                                Total: {filteredStudents.length} students
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="rows-per-page" className="whitespace-nowrap text-sm font-normal">Rows</Label>
                                    <Select
                                        value={`${itemsPerPage}`}
                                        onValueChange={(value) => setItemsPerPage(Number(value))}
                                    >
                                        <SelectTrigger id="rows-per-page" className="h-8 w-[70px]">
                                            <SelectValue placeholder={`${itemsPerPage}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[10, 25, 50, 100].map((pageSize) => (
                                                <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-center text-sm font-medium">
                                    Page 
                                    <Input
                                        key={currentPage}
                                        type="number"
                                        defaultValue={currentPage}
                                        onKeyDown={handlePageInputChange}
                                        className="h-8 w-[200px] mx-2 text-center"
                                    />
                                    of {totalPages}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
                                </div>
                            </div>
                        </CardFooter>
                    )}
                </Card>
            )}
        </div>
    );
}
