
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertTriangle, User, Mail, Phone, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getStudentFullInfo } from '@/lib/actions/users';
import { getBatchByCode } from '@/lib/actions/courses'; 
import type { FullStudentData, ApiCourse } from '@/lib/types';

// --- Type Definitions for the API response ---
interface StudentInfo {
    id: string;
    student_id: string;
    full_name: string;
    e_mail: string;
    telephone_1: string;
    nic: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    district: string;
}

interface StudentEnrollment {
    id: string;
    course_code: string;
    batch_name: string;
    parent_course_name: string;
}

// --- Main Page Component ---
export default function GenerateConfirmationLetterPage() {
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState<FullStudentData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedCourseData, setSelectedCourseData] = useState<ApiCourse | null>(null);
    const [isLoadingCourseData, setIsLoadingCourseData] = useState(false);
    
    // States for editable dates
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');


    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a student ID.' });
            return;
        }

        setIsLoading(true);
        setError(null);
        setStudentData(null);
        setSelectedCourseId('');
        setSelectedCourseData(null);

        try {
            const response = await fetch(`https://qa-api.pharmacollege.lk/get-student-full-info?loggedUser=${studentId.trim().toUpperCase()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Student not found or server error. Status: ${response.status}` }));
                throw new Error(errorData.message || 'Student data is invalid or not found.');
            }
            const data = await response.json();
            if (data && data.studentInfo) {
                setStudentData(data);
            } else {
                 throw new Error('Student data is incomplete in the API response.');
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            toast({ variant: 'destructive', title: 'Search Failed', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        const fetchCourseDetails = async () => {
            const selectedEnrollment = enrollmentsArray.find(e => e.id === selectedCourseId);
            if (!selectedEnrollment) {
                setSelectedCourseData(null);
                setStartDate('');
                setEndDate('');
                return;
            }

            setIsLoadingCourseData(true);
            try {
                const courseDetails = await getBatchByCode(selectedEnrollment.course_code);
                setSelectedCourseData(courseDetails);
                setStartDate(courseDetails.start_date || '');
                setEndDate(courseDetails.end_date || '');
            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch course details.' });
                setSelectedCourseData(null);
                setStartDate('');
                setEndDate('');
            } finally {
                setIsLoadingCourseData(false);
            }
        };

        if (selectedCourseId) {
            fetchCourseDetails();
        } else {
            setSelectedCourseData(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCourseId]);

    const studentNumberForUrl = studentData?.studentInfo.student_id.replace(/\//g, '');
    const enrollmentsArray = studentData ? Object.values(studentData.studentEnrollments) : [];
    
    const printHref = useMemo(() => {
        if (!studentNumberForUrl) return '#';
        const params = new URLSearchParams();
        if (selectedCourseId) {
            const course = enrollmentsArray.find(e => e.id === selectedCourseId);
            if(course) params.set('course', course.parent_course_name);
        }
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        
        return `/print/confirmation-letter/${studentNumberForUrl}?${params.toString()}`;
    }, [studentNumberForUrl, selectedCourseId, enrollmentsArray, startDate, endDate]);


    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Generate Confirmation Letter</h1>
                <p className="text-muted-foreground">Search for a student to generate a proof of registration letter.</p>
            </header>

            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            placeholder="Enter Student ID (e.g., PA16642)" 
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="flex-grow"
                        />
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search Student
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="space-y-6">
                    <Skeleton className="h-[170px] w-full" />
                </div>
            )}

            {error && !isLoading && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle /> An Error Occurred</CardTitle>
                    </CardHeader>
                    <CardContent><p>{error}</p></CardContent>
                </Card>
            )}

            {studentData && (
                <div className="space-y-6">
                    <Card className="shadow-lg">
                         <CardHeader>
                            <CardTitle>Student Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex items-center gap-4">
                                 <Avatar className="w-16 h-16 text-2xl border-2 border-primary" data-ai-hint="student avatar">
                                    <AvatarImage src={`https://placehold.co/150x150.png`} alt={studentData.studentInfo.full_name} />
                                    <AvatarFallback>{studentData.studentInfo.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold">{studentData.studentInfo.full_name}</h3>
                                    <p className="text-sm text-muted-foreground">{studentData.studentInfo.student_id}</p>
                                </div>
                           </div>
                            <div className="text-sm space-y-2 pt-2 border-t">
                                <p className="flex items-center gap-2"><User className="h-4 w-4 shrink-0 text-primary" /> {studentData.studentInfo.nic}</p>
                                <p className="flex items-center gap-2 break-all"><Mail className="h-4 w-4 shrink-0 text-primary" /> {studentData.studentInfo.e_mail}</p>
                                <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" /> {studentData.studentInfo.telephone_1}</p>
                            </div>
                            
                            <div className="pt-4 border-t space-y-4">
                                <h3 className="font-semibold text-card-foreground">Letter Options</h3>
                                <div className="space-y-2">
                                     <Label htmlFor="course-select">Course for Confirmation</Label>
                                     <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                                        <SelectTrigger id="course-select"><SelectValue placeholder="Select an enrolled course..."/></SelectTrigger>
                                        <SelectContent>
                                             {enrollmentsArray.map(e => <SelectItem key={e.id} value={e.id}>{e.parent_course_name}</SelectItem>)}
                                        </SelectContent>
                                     </Select>
                                </div>
                                {isLoadingCourseData ? (
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Start Date</Label>
                                            <Input 
                                                value={startDate} 
                                                onChange={(e) => setStartDate(e.target.value)} 
                                                placeholder="YYYY-MM-DD"
                                                disabled={!selectedCourseId}
                                            />
                                        </div>
                                         <div>
                                            <Label>End Date</Label>
                                            <Input 
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)} 
                                                placeholder="YYYY-MM-DD"
                                                disabled={!selectedCourseId}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full" disabled={!selectedCourseId || isLoadingCourseData}>
                                <Link href={printHref} target="_blank">
                                    {isLoadingCourseData && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    <Printer className="mr-2 h-4 w-4" /> 
                                    Print Letter
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
