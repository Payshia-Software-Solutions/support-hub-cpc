
"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Users, MapPin } from 'lucide-react';
import { getAllUserFullDetails, getAllCities, getAllDistricts } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserFullDetails } from '@/lib/types';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LocationData {
    name: string;
    count: number;
}

interface Location {
  id: string;
  name_en: string;
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
        if (!students || !cities || !districts) return { districts: [], cities: [] };
        
        const cityMap = new Map(cities.map(c => [c.id, c.name_en]));
        const districtMap = new Map(districts.map(d => [d.id, d.name_en]));

        const districtCounts: Record<string, number> = {};
        const cityCounts: Record<string, number> = {};

        students.forEach(student => {
            if (student.district) {
                const districtName = districtMap.get(student.district) || student.district;
                districtCounts[districtName] = (districtCounts[districtName] || 0) + 1;
            }
            if (student.city) {
                const cityName = cityMap.get(student.city) || student.city;
                cityCounts[cityName] = (cityCounts[cityName] || 0) + 1;
            }
        });

        const districtsData: LocationData[] = Object.entries(districtCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
        
        const citiesData: LocationData[] = Object.entries(cityCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return { districts: districtsData, cities: citiesData };
    }, [students, cities, districts]);

    const topDistrictsData = analyticsData.districts.slice(0, 15);

    const chartConfig: ChartConfig = {
        students: { label: "Students", color: "hsl(var(--primary))" },
    };

    if (isErrorStudents) {
        return <div className="p-8 text-destructive">Error loading student data: {studentsError.message}</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Student Analytics</h1>
                <p className="text-muted-foreground">Geographic distribution of registered students.</p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="w-5 h-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{students?.length.toLocaleString()}</div>}
                        <p className="text-xs text-muted-foreground">Total registered students</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Districts</CardTitle>
                        <MapPin className="w-5 h-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{analyticsData.districts.length}</div>}
                        <p className="text-xs text-muted-foreground">Districts with student presence</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Cities</CardTitle>
                         <MapPin className="w-5 h-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{analyticsData.cities.length}</div>}
                        <p className="text-xs text-muted-foreground">Cities with student presence</p>
                    </CardContent>
                </Card>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Students by District</CardTitle>
                        <CardDescription>Top 15 districts with the most students.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <Skeleton className="h-full w-full" />
                            </div>
                        ) : (
                            <ChartContainer config={chartConfig} className="w-full h-full">
                                <RechartsBarChart data={topDistrictsData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <CartesianGrid horizontal={false} />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        width={80} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        fontSize={12}
                                    />
                                    <XAxis type="number" hide />
                                    <Tooltip
                                        cursor={false}
                                        content={<ChartTooltipContent />}
                                    />
                                    <Bar dataKey="count" name="Students" fill="var(--color-students)" radius={[0, 4, 4, 0]} />
                                </RechartsBarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Students by City</CardTitle>
                        <CardDescription>Full list of cities and their student counts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                        {isLoading ? (
                            <div className="space-y-2">
                                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="sticky top-0 bg-card">
                                    <TableRow>
                                        <TableHead>City</TableHead>
                                        <TableHead className="text-right">Student Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analyticsData.cities.map((city) => (
                                        <TableRow key={city.name}>
                                            <TableCell className="font-medium">{city.name}</TableCell>
                                            <TableCell className="text-right font-bold">{city.count}</TableCell>
                                        </TableRow>
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
