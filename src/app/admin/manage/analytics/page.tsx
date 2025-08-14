
"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart as BarChartIcon, Users, MapPin, PersonStanding, Cake, Phone, ArrowRight, TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import Link from 'next/link';
import { getAllUserFullDetails } from '@/lib/actions/users';
import { getAllCities, getAllDistricts } from '@/lib/actions/locations';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserFullDetails, Location } from '@/lib/types';
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
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { differenceInYears } from 'date-fns';

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
                civilStatus: [],
                ageGroups: [],
                genderData: [],
                totalStudents: 0
            };
        }
        
        const districtMap = new Map(districts.map(d => [d.id, d.name_en]));
        const cityMap = new Map(cities.map(c => [c.id, c.name_en]));

        const districtCounts: Record<string, number> = {};
        const cityCounts: Record<string, number> = {};
        const civilStatusCounts: Record<string, number> = {};
        const ageGroups: Record<string, number> = {
            '<20': 0, '20-25': 0, '26-30': 0, '31-35': 0, '36-40': 0, '>40': 0, 'Unknown': 0
        };
        const genderCounts: Record<string, number> = { Male: 0, Female: 0, Unknown: 0 };

        students.forEach(student => {
            // Location
            const districtName = student.district ? districtMap.get(student.district) || 'Unknown' : 'Unknown';
            districtCounts[districtName] = (districtCounts[districtName] || 0) + 1;

            const cityName = student.city ? cityMap.get(student.city) || 'Unknown' : 'Unknown';
            cityCounts[cityName] = (cityCounts[cityName] || 0) + 1;
            
            // Gender
            const gender = student.gender || 'Unknown';
            if (gender in genderCounts) {
                genderCounts[gender]++;
            } else {
                genderCounts['Unknown']++;
            }

            // Civil Status
            const status = student.civil_status ? student.civil_status.trim().replace(/\.$/, '') : 'Unknown';
            const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
            civilStatusCounts[capitalizedStatus] = (civilStatusCounts[capitalizedStatus] || 0) + 1;
            
            // Age
            if (student.birth_day && student.birth_day.includes('-') && new Date(student.birth_day).toString() !== 'Invalid Date') {
                const age = differenceInYears(new Date(), new Date(student.birth_day));
                if (age > 0 && age < 20) ageGroups['<20']++;
                else if (age >= 20 && age <= 25) ageGroups['20-25']++;
                else if (age >= 26 && age <= 30) ageGroups['26-30']++;
                else if (age >= 31 && age <= 35) ageGroups['31-35']++;
                else if (age >= 36 && age <= 40) ageGroups['36-40']++;
                else if (age > 40) ageGroups['>40']++;
                else ageGroups['Unknown']++;
            } else {
                ageGroups['Unknown']++;
            }
        });

        return {
            districts: Object.entries(districtCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
            cities: Object.entries(cityCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
            civilStatus: Object.entries(civilStatusCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
            ageGroups: Object.entries(ageGroups).map(([name, count]) => ({ name, count })),
            genderData: Object.entries(genderCounts).map(([name, count]) => ({ name, count })),
            totalStudents: students.length,
        };
    }, [students, cities, districts]);
    
    const genderChartConfig: ChartConfig = {
        Male: { label: "Male", color: "hsl(var(--chart-1))" },
        Female: { label: "Female", color: "hsl(var(--chart-2))" },
        Unknown: { label: "Unknown", color: "hsl(var(--chart-3))" },
    };

    const ageChartConfig: ChartConfig = {
        count: { label: "Students", color: "hsl(var(--primary))" },
    };
    
    const countChartConfig: ChartConfig = {
        count: { label: "Students", color: "hsl(var(--primary))" },
    };


    if (isErrorStudents) {
        return <div className="p-8 text-destructive">Error loading student data: {studentsError.message}</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-semibold">Student Analytics Overview</h1>
                    <p className="text-muted-foreground">High-level geographic and demographic student distribution.</p>
                </div>
                 <Link href="/admin/manage/analytics/report">
                    <Button variant="outline">
                        <ArrowRight className="mr-2 h-4 w-4" /> View Detailed Report
                    </Button>
                </Link>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Students</CardTitle><Users className="w-5 h-5 text-primary" /></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{analyticsData.totalStudents.toLocaleString()}</div>}<p className="text-xs text-muted-foreground">Total registered students</p></CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Unique Districts</CardTitle><MapPin className="w-5 h-5 text-primary" /></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{analyticsData.districts.length}</div>}<p className="text-xs text-muted-foreground">Districts with student presence</p></CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Most Common Age</CardTitle><Cake className="w-5 h-5 text-primary" /></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{analyticsData.ageGroups.filter(g => g.name !== 'Unknown').sort((a,b) => b.count - a.count)[0]?.name || 'N/A'}</div>}<p className="text-xs text-muted-foreground">Highest populated age bracket</p></CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Gender Ratio</CardTitle><PieChartIcon className="w-5 h-5 text-primary" /></CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2" /> : (
                            <div className="text-2xl font-bold">
                                {analyticsData.genderData.find(g => g.name === 'Male')?.count || 0} M / {analyticsData.genderData.find(g => g.name === 'Female')?.count || 0} F
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">Male vs Female student count</p>
                    </CardContent>
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
                            <ChartContainer config={ageChartConfig} className="w-full h-full">
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
                    <CardContent className="h-[300px]">
                         {isLoading ? <Skeleton className="h-full w-full rounded-full" /> : (
                             <ChartContainer config={genderChartConfig} className="w-full h-full">
                                <PieChart>
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                    <Pie data={analyticsData.genderData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                            return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">{(percent * 100).toFixed(0)}%</text>;
                                        }}>
                                        {analyticsData.genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={genderChartConfig[entry.name as keyof typeof genderChartConfig]?.color} />)}
                                    </Pie>
                                    <Legend />
                                </PieChart>
                            </ChartContainer>
                         )}
                    </CardContent>
                </Card>
            </section>
            
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="shadow-lg lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Students by District</CardTitle>
                        <CardDescription>The complete district-wise breakdown of student enrollment.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        {isLoading ? <Skeleton className="h-full w-full" /> : (
                            <ChartContainer config={countChartConfig} className="w-full h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analyticsData.districts} layout="vertical" margin={{ left: 20, right: 20 }}>
                                         <CartesianGrid horizontal={false} />
                                        <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} fontSize={10} interval={0} />
                                        <XAxis type="number" hide />
                                        <Tooltip cursor={false} content={<ChartTooltipContent />} />
                                        <Bar dataKey="count" name="Students" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={12} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Civil Status Breakdown</CardTitle>
                        <CardDescription>Distribution of students by their civil status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {isLoading ? <Skeleton className="h-64 w-full" /> : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Student Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analyticsData.civilStatus.map(status => (
                                        <TableRow key={status.name}>
                                            <TableCell className="font-medium">{status.name}</TableCell>
                                            <TableCell className="text-right">{status.count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                       )}
                    </CardContent>
                </Card>
            </section>

             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Top 10 Cities by Student Count</CardTitle>
                    <CardDescription>Cities with the highest number of registered students.</CardDescription>
                </CardHeader>
                <CardContent>
                   {isLoading ? <Skeleton className="h-64 w-full" /> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>City</TableHead>
                                    <TableHead className="text-right">Student Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analyticsData.cities.slice(0, 10).map(city => (
                                    <TableRow key={city.name}>
                                        <TableCell className="font-medium">{city.name}</TableCell>
                                        <TableCell className="text-right">{city.count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                   )}
                </CardContent>
            </Card>

        </div>
    );
}
