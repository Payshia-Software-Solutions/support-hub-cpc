
"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowRight, Briefcase } from 'lucide-react';
import { getStaffMembers } from '@/lib/actions/users';
import type { StaffMember } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function StaffList() {
    const { data: staffMembers, isLoading, isError, error } = useQuery<StaffMember[]>({
        queryKey: ['staffMembersForCommissions'],
        queryFn: getStaffMembers,
    });
     if (isLoading) {
        return (
            <div className="space-y-2">
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 md:p-8">
                <h1 className="text-xl font-semibold text-destructive">An Error Occurred</h1>
                <p className="text-muted-foreground">{(error as Error).message}</p>
            </div>
        );
    }
    
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Staff Rates</CardTitle>
                <CardDescription>Select a staff member to manage their individual commission rates.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative w-full overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff Member</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staffMembers && staffMembers.length > 0 ? staffMembers.map((staff) => (
                                <TableRow key={staff.id}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={staff.avatar} alt={staff.name} />
                                            <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span>{staff.name}</span>
                                    </TableCell>
                                    <TableCell>{staff.email}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/admin/manage/commissions/${staff.id}`}>
                                                Manage Commissions <ArrowRight className="ml-2 h-4 w-4"/>
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">
                                        No staff members found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

function ManagementCommissionsTab() {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Management Commissions</CardTitle>
                <CardDescription>Define hierarchical commission structures for tasks.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="p-4 md:p-8 space-y-8 pb-20 flex items-center justify-center min-h-full">
                  <Card className="w-full max-w-lg text-center shadow-none border-dashed">
                    <CardHeader>
                      <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                        <Briefcase className="w-10 h-10 text-primary" />
                      </div>
                      <CardTitle className="mt-4">Coming Soon</CardTitle>
                       <CardDescription>This feature is under construction.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">The ability to define commission hierarchies for management will be available here.</p>
                    </CardContent>
                  </Card>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ManageCommissionsPage() {
    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Commissions Management</h1>
                <p className="text-muted-foreground">Set and manage staff rates and management commission structures.</p>
            </header>

            <Tabs defaultValue="staff" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="staff">Staff Rates</TabsTrigger>
                    <TabsTrigger value="management">Management Commissions</TabsTrigger>
                </TabsList>
                <TabsContent value="staff" className="mt-6">
                    <StaffList />
                </TabsContent>
                <TabsContent value="management" className="mt-6">
                    <ManagementCommissionsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
