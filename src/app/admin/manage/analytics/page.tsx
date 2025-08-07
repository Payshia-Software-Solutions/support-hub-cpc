"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart as BarChartIcon, Users, MapPin, PersonStanding, Cake, Phone, ArrowRight } from 'lucide-react';
import Link from 'next/link';
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

        const districtCounts: Record<string, number> = {};
        const ageGroups: Record<string, number> = {
            '<20': 0, '20-25': 0, '26-30': 0, '31-35': 0, '36-40': 0, '>40': 0, 'Unknown': 0
        };
        const genderCounts: Record<string, number> = {};

        students.forEach(student => {
            // Location
            if (student.district) {
                const districtName = districtMap.get(student.district) || student.district;
                districtCounts[districtName] = (districtCounts[districtName] || 0) + 1;
            }
            
            // Gender
            const gender = student.gender || 'Unknown';
            genderCounts[gender] = (genderCounts[gender] || 0) + 1;
            
            // Age
            if (student.birth_day && student.birth_day.includes('-') && new Date(student.birth_day).toString() !== 'Invalid Date') {
                const age = differenceInYears(new Date(), new Date(student.birth_day));
                if (age < 20) ageGroups['<20']++;
                else if (age >= 20 && age <= 25) ageGroups['20-25']++;
                else if (age >= 26 && age <= 30) ageGroups['26-30']++;
                else if (age >= 31 && age <= 35) ageGroups['31-35']++;
                else if (age >= 36 && age <= 40) ageGroups['36-40']++;
                else if (age > 40) ageGroups['>40']++;
            } else {
                ageGroups['Unknown']++;
            }
        });

        return {
            districts: Object.entries(districtCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
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
                <Button asChild>
                    <Link href="/admin/manage/analytics/report">
                        View Detailed Report <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Students</CardTitle><Users className="w-5 h-5 text-primary" /></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{analyticsData.totalStudents.toLocaleString()}</div>}<p className="text-xs text-muted-foreground">Total registered students</p></CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Unique Districts</CardTitle><MapPin className="w-5 h-5 text-primary" /></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{analyticsData.districts.length}</div>}<p className="text-xs text-muted-foreground">Districts with student presence</p></CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Gender Ratio</CardTitle><PersonStanding className="w-5 h-5 text-primary" /></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{analyticsData.genderData.find(g => g.name === 'Female')?.count || 0} : {analyticsData.genderData.find(g => g.name === 'Male')?.count || 0}</div>}<p className="text-xs text-muted-foreground">Female to Male ratio</p></CardContent>
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
                        <CardTitle>Students by District</CardTitle>
                        <CardDescription>Top 15 districts with the most students.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {isLoading ? <Skeleton className="h-full w-full" /> : (
                            <ChartContainer config={countChartConfig} className="w-full h-full">
                                <BarChart data={analyticsData.districts.slice(0, 15)} layout="vertical" margin={{ left: 20, right: 20 }}>
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
        </div>
    );
}
