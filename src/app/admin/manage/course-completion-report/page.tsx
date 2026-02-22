
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getParentCourses, getBatches } from '@/lib/actions/courses';
import { getStudentsByCourseCode } from '@/lib/actions/delivery';
import { getStudentFullInfo } from '@/lib/actions/users';
import type { ParentCourse, Batch, StudentInBatch, FullStudentData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, FileDown, Loader2, CheckCircle, XCircle, AlertCircle, Info, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 25;

export default function CourseCompletionReportPage() {
    const [selectedParentCourseId, setSelectedParentCourseId] = useState<string>('');
    const [selectedBatchCode, setSelectedBatchCode] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    
    // Detailed student data cache
    const [studentDataMap, setStudentDataMap] = useState<Map<string, FullStudentData>>(new Map());

    // --- Master Data Fetching ---
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

    // Filter batches based on selected parent course
    const filteredBatches = useMemo(() => {
        if (!allBatches || !selectedParentCourseId) return [];
        return allBatches.filter(b => b.parent_course_id === selectedParentCourseId);
    }, [allBatches, selectedParentCourseId]);

    // --- Student List Fetching ---
    const { data: students, isLoading: isLoadingStudents, isError, error } = useQuery<StudentInBatch[]>({
        queryKey: ['studentsByBatchForReport', selectedBatchCode],
        queryFn: () => getStudentsByCourseCode(selectedBatchCode),
        enabled: !!selectedBatchCode,
    });

    // --- UI State Logic ---
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedBatchCode, searchTerm]);

    const filteredStudents = useMemo(() => {
        if (!students) return [];
        const lower = searchTerm.toLowerCase();
        return students.filter(s => 
            s.username.toLowerCase().includes(lower) || 
            s.full_name.toLowerCase().includes(lower)
        );
    }, [students, searchTerm]);

    const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
    const paginatedStudents = useMemo(() => {
        return filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredStudents, currentPage]);

    // --- Detail Data Fetching (Batched for current page) ---
    const studentUsernamesToFetch = useMemo(() => {
        return paginatedStudents
            .map(s => s.username)
            .filter(un => !studentDataMap.has(un));
    }, [paginatedStudents, studentDataMap]);

    const { isLoading: isLoadingDetails } = useQuery({
        queryKey: ['batchCompletionDetails', studentUsernamesToFetch],
        queryFn: async () => {
            if (studentUsernamesToFetch.length === 0) return null;
            const promises = studentUsernamesToFetch.map(un => getStudentFullInfo(un).catch(() => null));
            const results = await Promise.all(promises);
            
            const newMap = new Map(studentDataMap);
            results.forEach((data, index) => {
                if (data) newMap.set(studentUsernamesToFetch[index], data);
            });
            setStudentDataMap(newMap);
            return newMap;
        },
        enabled: studentUsernamesToFetch.length > 0,
        refetchOnWindowFocus: false,
    });

    // --- Handlers ---
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
            toast({ title: 'Preparing Export', description: 'Fetching detailed status for all students...' });
            
            // We need to fetch data for ALL students in the batch for a full report
            const allPromises = students.map(s => getStudentFullInfo(s.username).catch(() => null));
            const allResults = await Promise.all(allPromises);

            const headers = ['Student ID', 'Full Name', 'Batch', 'Status', 'Avg Grade (%)', 'Missing Criteria'];
            const rows = students.map((s, idx) => {
                const data = allResults[idx];
                const enrollment = data ? Object.values(data.studentEnrollments).find(e => e.course_code === selectedBatchCode) : null;
                const isCompleted = enrollment?.certificate_eligibility || false;
                const missing = enrollment ? enrollment.criteria_details.filter(c => !c.evaluation.completed).map(c => c.list_name).join('; ') : 'Data Load Error';

                return [
                    s.username,
                    s.full_name,
                    selectedBatchCode,
                    isCompleted ? 'Completed' : 'Incomplete',
                    enrollment?.assignment_grades.average_grade || '0.00',
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
                    <p className="text-muted-foreground">Monitor and export students' progress and eligibility across batches.</p>
                </div>
                <Button onClick={handleExport} disabled={!selectedBatchCode || isExporting || isLoadingStudents}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    Export Report (CSV)
                </Button>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">Step 1: Select Filters</CardTitle>
                        <CardDescription>Choose a parent course then a specific batch to load student records.</CardDescription>
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
                        <CardTitle className="text-lg">Step 2: Refine Results</CardTitle>
                        <CardDescription>Quick search within the loaded batch.</CardDescription>
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

            {selectedBatchCode && (
                <Card className="shadow-lg border-primary/10">
                    <CardHeader className="bg-muted/20">
                        <CardTitle>Batch Completion Status: {selectedBatchCode}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoadingStudents ? (
                            <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                        ) : isError ? (
                            <Alert variant="destructive" className="m-6"><AlertCircle className="h-4 w-4" /><AlertTitle>Data Load Error</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[150px]">Student ID</TableHead>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Avg Grade</TableHead>
                                            <TableHead className="w-[180px]">Status</TableHead>
                                            <TableHead className="text-right pr-6">Eligibility Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedStudents.length > 0 ? paginatedStudents.map((s) => {
                                            const data = studentDataMap.get(s.username);
                                            const enrollment = data ? Object.values(data.studentEnrollments).find(e => e.course_code === selectedBatchCode) : null;
                                            const isCompleted = enrollment?.certificate_eligibility || false;
                                            const isLoadingRow = isLoadingDetails && !data;

                                            return (
                                                <TableRow key={s.student_course_id}>
                                                    <TableCell className="font-mono font-bold text-sm">{s.username}</TableCell>
                                                    <TableCell className="font-medium">{s.full_name}</TableCell>
                                                    <TableCell>
                                                        {isLoadingRow ? <Skeleton className="h-4 w-12" /> : 
                                                         enrollment ? <span className="font-mono text-xs">{parseFloat(enrollment.assignment_grades.average_grade).toFixed(2)}%</span> : "N/A"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {isLoadingRow ? <Skeleton className="h-6 w-24 rounded-full" /> : (
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={isCompleted ? "default" : "destructive"} className={cn("uppercase text-[10px]", isCompleted && "bg-green-600")}>
                                                                    {isCompleted ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                                                                    {isCompleted ? "Completed" : "Incomplete"}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        {isLoadingRow ? <Skeleton className="h-8 w-8 rounded-md ml-auto" /> : enrollment && (
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
                                            <TableRow><TableCell colSpan={5} className="text-center h-32 text-muted-foreground italic">No students found.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                    {totalPages > 1 && (
                        <CardFooter className="flex items-center justify-center space-x-2 py-4 border-t bg-muted/10">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
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
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
                        </CardFooter>
                    )}
                </Card>
            )}
        </div>
    );
}
