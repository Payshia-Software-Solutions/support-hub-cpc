
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Search, Loader2, FileDown, FileSignature, ArrowLeft } from 'lucide-react';
import { getAllUserFullDetails, getAllCities, getAllDistricts } from '@/lib/api';
import type { UserFullDetails } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { differenceInYears } from 'date-fns';

const ITEMS_PER_PAGE = 50;

interface Location {
  id: string;
  name_en: string;
}

const AGE_GROUPS = ['<20', '20-25', '26-30', '31-35', '36-40', '>40', 'Unknown'];
const GENDERS = ['Male', 'Female', 'Unknown'];

export default function AnalyticsReportPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [districtFilter, setDistrictFilter] = useState('all');
    const [cityFilter, setCityFilter] = useState('all');
    const [ageGroupFilter, setAgeGroupFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    const { data: students, isLoading: isLoadingStudents, isError, error } = useQuery<UserFullDetails[]>({
        queryKey: ['allStudentDetailsForReport'],
        queryFn: getAllUserFullDetails,
        staleTime: 1000 * 60 * 15,
    });
    
    const { data: cities, isLoading: isLoadingCities } = useQuery<Location[]>({
        queryKey: ['allCities'],
        queryFn: getAllCities,
        staleTime: Infinity,
    });

    const { data: districts, isLoading: isLoadingDistricts } = useQuery<Location[]>({
        queryKey: ['allDistricts'],
        queryFn: getAllDistricts,
        staleTime: Infinity,
    });

    const isLoading = isLoadingStudents || isLoadingCities || isLoadingDistricts;

    const cityMap = useMemo(() => new Map(cities?.map(c => [c.id, c.name_en])), [cities]);
    const districtMap = useMemo(() => new Map(districts?.map(d => [d.id, d.name_en])), [districts]);

    const filteredStudents = useMemo(() => {
        if (!students) return [];
        const lowercasedFilter = searchTerm.toLowerCase();

        return students.filter(student => {
            const matchesSearch = !searchTerm ||
                student.username?.toLowerCase().includes(lowercasedFilter) ||
                student.full_name?.toLowerCase().includes(lowercasedFilter) ||
                student.e_mail?.toLowerCase().includes(lowercasedFilter);
            
            const matchesDistrict = districtFilter === 'all' || student.district === districtFilter;
            const matchesCity = cityFilter === 'all' || student.city === cityFilter;
            const matchesGender = genderFilter === 'all' || (student.gender || 'Unknown') === genderFilter;
            
            let studentAgeGroup = 'Unknown';
            if (student.birth_day && student.birth_day.includes('-') && new Date(student.birth_day).toString() !== 'Invalid Date') {
                const age = differenceInYears(new Date(), new Date(student.birth_day));
                if (age < 20) studentAgeGroup = '<20';
                else if (age <= 25) studentAgeGroup = '20-25';
                else if (age <= 30) studentAgeGroup = '26-30';
                else if (age <= 35) studentAgeGroup = '31-35';
                else if (age <= 40) studentAgeGroup = '36-40';
                else studentAgeGroup = '>40';
            }
            const matchesAgeGroup = ageGroupFilter === 'all' || studentAgeGroup === ageGroupFilter;

            return matchesSearch && matchesDistrict && matchesCity && matchesGender && matchesAgeGroup;
        });
    }, [students, searchTerm, districtFilter, cityFilter, genderFilter, ageGroupFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, districtFilter, cityFilter, genderFilter, ageGroupFilter]);

    const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
    const paginatedStudents = useMemo(() => {
        return filteredStudents.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredStudents, currentPage]);
    
     const handleExport = () => {
        if (filteredStudents.length === 0) {
            toast({ variant: 'destructive', title: 'No data to export' });
            return;
        }
        setIsExporting(true);
        try {
            const headers = ['Username', 'Full Name', 'Email', 'Phone', 'NIC', 'Gender', 'Address Line 1', 'Address Line 2', 'City', 'District', 'Name on Certificate'];
            const rows = filteredStudents.map(s => [
                s.username,
                s.full_name,
                s.e_mail,
                s.telephone_1,
                s.nic,
                s.gender,
                s.address_line_1,
                s.address_line_2,
                cityMap.get(s.city) || s.city,
                districtMap.get(s.district) || s.district,
                s.name_on_certificate
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'student_report.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast({ title: 'Export Successful', description: 'Your report has been downloaded.' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate CSV.' });
        } finally {
            setIsExporting(false);
        }
    };


    if (isError) {
        return (
            <div className="p-4 md:p-8">
                <h1 className="text-3xl font-headline font-semibold text-destructive">An Error Occurred</h1>
                <p className="text-muted-foreground">{error?.message}</p>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                 <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Analytics Overview
                </Button>
                <h1 className="text-3xl font-headline font-semibold">Detailed Student Report</h1>
                <p className="text-muted-foreground">Filter and export a comprehensive list of all students.</p>
            </header>
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>Filters & Export</CardTitle>
                            <CardDescription>
                                {isLoading ? "Loading..." : `Showing ${paginatedStudents.length} of ${filteredStudents.length} students.`}
                            </CardDescription>
                        </div>
                         <div className="flex items-center gap-2">
                            <Button onClick={handleExport} disabled={isExporting}>
                                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                                Export
                            </Button>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 pt-4">
                        <div className="relative w-full lg:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search username, name, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                        </div>
                         <Select value={districtFilter} onValueChange={setDistrictFilter} disabled={isLoadingDistricts}>
                            <SelectTrigger><SelectValue placeholder="Filter by District" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Districts</SelectItem>
                                {districts?.map(d => <SelectItem key={d.id} value={d.id}>{d.name_en}</SelectItem>)}
                            </SelectContent>
                        </Select>
                         <Select value={cityFilter} onValueChange={setCityFilter} disabled={isLoadingCities}>
                            <SelectTrigger><SelectValue placeholder="Filter by City" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cities</SelectItem>
                                {cities?.map(c => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
                            </SelectContent>
                        </Select>
                         <Select value={genderFilter} onValueChange={setGenderFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by Gender" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Genders</SelectItem>
                                {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 pt-2">
                        <div className="lg:col-span-3"></div> {/* Spacer */}
                        <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
                            <SelectTrigger className="lg:col-span-2"><SelectValue placeholder="Filter by Age Group" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Age Groups</SelectItem>
                                {AGE_GROUPS.map(ag => <SelectItem key={ag} value={ag}>{ag}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-96 w-full" /> : (
                        <div className="relative w-full overflow-auto border rounded-lg hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Full Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>City</TableHead>
                                        <TableHead>District</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedStudents.length > 0 ? paginatedStudents.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">{student.username}</TableCell>
                                            <TableCell>{student.full_name}</TableCell>
                                            <TableCell>{student.e_mail}</TableCell>
                                            <TableCell>{student.telephone_1}</TableCell>
                                            <TableCell>{cityMap.get(student.city) || student.city}</TableCell>
                                            <TableCell>{districtMap.get(student.district) || student.district}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={6} className="text-center h-24">No students found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                     <div className="md:hidden space-y-4">
                        {paginatedStudents.length > 0 ? paginatedStudents.map((student) => (
                             <div key={student.id} className="p-4 border rounded-lg space-y-2 bg-muted/30 text-sm">
                                <div><p className="font-bold">{student.full_name}</p><p className="text-muted-foreground">{student.username}</p></div>
                                <div className="text-muted-foreground space-y-1 border-t pt-2">
                                     <p><strong>Email:</strong> {student.e_mail}</p>
                                     <p><strong>Phone:</strong> {student.telephone_1}</p>
                                     <p><strong>Location:</strong> {cityMap.get(student.city) || 'N/A'}, {districtMap.get(student.district) || 'N/A'}</p>
                                </div>
                            </div>
                        )) : !isLoading && (
                            <div className="text-center h-24 flex items-center justify-center"><p>No students found.</p></div>
                        )}
                    </div>
                </CardContent>
                 <CardFooter className="flex items-center justify-center space-x-2 pt-4">
                     <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                     <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages || 1}</span>
                     <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
