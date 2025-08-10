
"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { getStaffMembers } from '@/lib/api';
import type { StaffMember } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

export default function ManageCommissionsPage() {
    const { data: staffMembers, isLoading, isError, error } = useQuery<StaffMember[]>({
        queryKey: ['staffMembersForCommissions'],
        queryFn: getStaffMembers,
    });

    if (isError) {
        return (
            <div className="p-4 md:p-8">
                <h1 className="text-xl font-semibold text-destructive">An Error Occurred</h1>
                <p className="text-muted-foreground">{(error as Error).message}</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Staff Commission Management</h1>
                <p className="text-muted-foreground">Select a staff member to manage their individual commission rates.</p>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>All Staff Members</CardTitle>
                    <CardDescription>
                        {isLoading ? "Loading staff..." : `${staffMembers?.length || 0} staff members found.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
