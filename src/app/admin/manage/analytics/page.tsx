
"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart as BarChartIcon, Users, MapPin, PersonStanding, Cake, Phone } from 'lucide-react';
import { getAllUserFullDetails, getAllCities, getAllDistricts } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserFullDetails } from '@/lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { differenceInYears } from 'date-fns';

interface LocationData {
    name: string;
    count: number;
}

interface Location {
  id: string;
  name_en: string;
}

interface AgeGroup {
    name: string;
    count: number;
}

export default function StudentAnalyticsPage() {
    const { data: students, isLoading: isLoadingStudents, isError: isErrorStudents, error: studentsError } = useQuery<UserFullDetails[]>({
        queryKey: ['allStudentDetailsForAnalytics'],
        queryFn: getAllUserFullDetails,
        staleTime: 1000 * 60 * 15, // Cache for 15 minutes
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

    const analyticsData = useMemo(() => {
        if (!students || !cities || !districts) {
            return {
                districts: [],
                cities: [],
                gender: [],
                civilStatus: [],
                ageGroups: [],
                totalStudents: 0
            };
        }
        
        const cityMap = new Map(cities.map(c => [c.id, c.name_en]));
        const districtMap = new Map(districts.map(d => [d.id, d.name_en]));

        const districtCounts: Record<string, number> = {};
        const cityCounts: Record<string, number> = {};
        const genderCounts: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
        const civilStatusCounts: Record<string, number> = {};
        const ageGroups: Record<string, number> = {
            '<20': 0, '20-25': 0, '26-30': 0, '31-35': 0, '36-40': 0, '>40': 0, 'Unknown': 0
        };

        students.forEach(student => {
            // Location
            if (student.district) {
                const districtName = districtMap.get(student.district) || student.district;
                districtCounts[districtName] = (districtCounts[districtName] || 0) + 1;
            }
            if (student.city) {
                const cityName = cityMap.get(student.city) || student.city;
                cityCounts[cityName] = (cityCounts[cityName] || 0) + 1;
            }
            // Gender
            const gender = student.gender || 'Other';
            genderCounts[gender] = (genderCounts[gender] || 0) + 1;
            
            // Civil Status
            let status = student.civil_status || 'Unknown';
            if (status.endsWith('.')) {
                status = status.slice(0, -1);
            }
            status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
            civilStatusCounts[status] = (civilStatusCounts[status] || 0) + 1;
            
            // Age
            if (student.birth_day) {
                const age = differenceInYears(new Date(), new Date(student.birth_day));
                if (age < 20) ageGroups['<20']++;
                else if (age <= 25) ageGroups['20-25']++;
                else if (age <= 30) ageGroups['26-30']++;
                else if (age <= 35) ageGroups['31-35']++;
                else if (age <= 40) ageGroups['36-40']++;
                else ageGroups['>40']++;
            } else {
                ageGroups['Unknown']++;
            }
        });

        return {
            districts: Object.entries(districtCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
            cities: Object.entries(cityCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
            gender: Object.entries(genderCounts).map(([name, total]) => ({ name, total, fill: name === 'Male' ? 'hsl(var(--chart-1))' : name === 'Female' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))' })).filter(g => g.total > 0),
            civilStatus: Object.entries(civilStatusCounts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count),
            ageGroups: Object.entries(ageGroups).map(([name, count]) => ({ name, count })),
            totalStudents: students.length,
        };
    }, [students, cities, districts]);
    

    const genderChartConfig: ChartConfig = {
      Male: { label: "Male", color: "hsl(var(--chart-1))" },
      Female: { label: "Female", color: "hsl(var(--chart-2))" },
      Other: { label: "Other", color: "hsl(var(--chart-3))" },
    };
    
    const countChartConfig: ChartConfig = {
        count: { label: "Students", color: "hsl(var(--primary))" },
    };


    if (isErrorStudents) {
        return <div className="p-8 text-destructive">Error loading student data: {studentsError.message}</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Student Analytics</h1>
                <p className="text-muted-foreground">Geographic and demographic distribution of registered students.</p>
            </header>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Students</CardTitle><Users className="w-5 h-5 text-primary" /></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{analyticsData.totalStudents.toLocaleString()}</div>}<p className="text-xs text-muted-foreground">Total registered students</p></CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Unique Districts</CardTitle><MapPin className="w-5 h-5 text-primary" /></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{analyticsData.districts.length}</div>}<p className="text-xs text-muted-foreground">Districts with student presence</p></CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Unique Cities</CardTitle><MapPin className="w-5 h-5 text-primary" /></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{analyticsData.cities.length}</div>}<p className="text-xs text-muted-foreground">Cities with student presence</p></CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Gender Ratio</CardTitle><PersonStanding className="w-5 h-5 text-primary" /></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{analyticsData.gender.map(g => `${g.name.charAt(0)}:${g.total}`).join(' ')}</div>}<p className="text-xs text-muted-foreground">Male / Female breakdown</p></CardContent>
                </Card>
            </section>
            
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Age Distribution</CardTitle>
                        <CardDescription>Number of students in different age brackets.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                         {isLoading ? <Skeleton className="h-full w-full" /> : (
                            <ChartContainer config={countChartConfig} className="w-full h-full">
                               <BarChart data={analyticsData.ageGroups} accessibilityLayer>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} fontSize={12} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                         )}
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Gender Distribution</CardTitle>
                        <CardDescription>Breakdown of male and female students.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        {isLoading ? <Skeleton className="h-48 w-48 rounded-full" /> : (
                            <ChartContainer config={genderChartConfig} className="mx-auto aspect-square h-full">
                                <PieChart>
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                    <Pie data={analyticsData.gender} dataKey="total" nameKey="name" innerRadius={60} strokeWidth={5}>
                                        {analyticsData.gender.map((entry) => (<Cell key={`cell-${entry.name}`} fill={entry.fill} />))}
                                    </Pie>
                                    <Legend />
                                </PieChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </section>
            
            <section>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Students by District</CardTitle>
                        <CardDescription>Full breakdown of students across all districts.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[500px]">
                        {isLoading ? <Skeleton className="h-full w-full" /> : (
                            <ChartContainer config={countChartConfig} className="w-full h-full">
                                <BarChart data={analyticsData.districts} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <CartesianGrid horizontal={false} />
                                    <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} fontSize={10} interval={0} />
                                    <XAxis type="number" hide />
                                    <Tooltip cursor={false} content={<ChartTooltipContent />} />
                                    <Bar dataKey="count" name="Students" fill="var(--color-count)" radius={[0, 4, 4, 0]} barSize={12} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </section>
            
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Civil Status Breakdown</CardTitle>
                        <CardDescription>Student counts by civil status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isLoading ? <Skeleton className="h-48 w-full" /> : (
                            <Table>
                                <TableHeader><TableRow><TableHead>Status</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {analyticsData.civilStatus.map((item) => (
                                        <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell className="text-right font-bold">{item.count}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         )}
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>City Breakdown</CardTitle>
                        <CardDescription>Top student counts by city.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                        {isLoading ? <Skeleton className="h-full w-full" /> : (
                            <Table>
                                <TableHeader><TableRow><TableHead>City</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {analyticsData.cities.map((city) => (
                                        <TableRow key={city.name}><TableCell>{city.name}</TableCell><TableCell className="text-right font-bold">{city.count}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
