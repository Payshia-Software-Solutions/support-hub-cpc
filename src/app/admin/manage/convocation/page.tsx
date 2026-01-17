"use client";

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConvocationRegistrations } from '@/lib/api';
import type { ConvocationRegistration } from '@/lib/types';
import { format, isValid } from 'date-fns';
import Image from 'next/image';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Search, FileText } from 'lucide-react';

const ITEMS_PER_PAGE = 25;
const CONTENT_PROVIDER_URL = process.env.NEXT_PUBLIC_CONTENT_PROVIDER_URL || 'https://content-provider.pharmacollege.lk';

const ViewSlipDialog = ({ slipPath, studentName }: { slipPath: string | null; studentName: string; }) => {
    if (!slipPath) return <Button variant="outline" size="sm" disabled>No Slip</Button>;

    const fullSlipUrl = `${CONTENT_PROVIDER_URL}${slipPath}`;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(slipPath);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">View Slip</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Payment Slip for {studentName}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 max-h-[70vh] overflow-auto border rounded-lg p-2 bg-muted">
                    {isImage ? (
                        <Image src={fullSlipUrl} alt={`Payment Slip for ${studentName}`} width={800} height={1200} className="w-full h-auto object-contain" data-ai-hint="payment slip" />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <FileText className="w-16 h-16 text-muted-foreground mb-4"/>
                            <p className="mb-4">This file is not an image. Open it in a new tab to view.</p>
                            <a href={fullSlipUrl} target="_blank" rel="noopener noreferrer"><Button>Open Slip</Button></a>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};


export default function ConvocationListPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: registrations, isLoading, isError, error } = useQuery<ConvocationRegistration[]>({
        queryKey: ['allConvocations'],
        queryFn: getConvocationRegistrations,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const filteredRegistrations = useMemo(() => {
        if (!registrations) return [];
        const lowercasedSearch = searchTerm.toLowerCase();
        
        return registrations.filter(reg => {
            const matchesSearch = lowercasedSearch === '' || 
                reg.student_number.toLowerCase().includes(lowercasedSearch) ||
                reg.name_on_certificate.toLowerCase().includes(lowercasedSearch) ||
                reg.reference_number.toLowerCase().includes(lowercasedSearch);
            
            const matchesStatus = statusFilter === 'all' || reg.payment_status.toLowerCase() === statusFilter.toLowerCase();
            
            return matchesSearch && matchesStatus;
        }).sort((a,b) => {
            const dateA = new Date(a.registered_at);
            const dateB = new Date(b.registered_at);
            if (!isValid(dateA)) return 1;
            if (!isValid(dateB)) return -1;
            return dateB.getTime() - dateA.getTime();
        });
    }, [registrations, searchTerm, statusFilter]);

    const totalPages = Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE);
    const paginatedRegistrations = useMemo(() => {
        return filteredRegistrations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredRegistrations, currentPage]);

    const getStatusVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid':
            case 'completed':
                return 'default';
            case 'pending':
                return 'destructive';
            default:
                return 'secondary';
        }
    };
    
    if (isError) {
        return (
             <div className="p-4 md:p-8">
                <h1 className="text-3xl font-headline font-semibold text-destructive">An Error Occurred</h1>
                <p className="text-muted-foreground">{(error as Error).message}</p>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Convocation Registrations</h1>
                <p className="text-muted-foreground">View and manage all student registrations for convocation.</p>
            </header>
            
            <Card className="shadow-lg">
                <CardHeader>
                     <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>All Registrations</CardTitle>
                             <CardDescription>
                                {isLoading ? "Loading..." : `${filteredRegistrations.length} registrations found.`}
                            </CardDescription>
                        </div>
                         <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-auto flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search by name, student #, ref #" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Payment Statuses</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
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
                                        <TableHead>Student</TableHead>
                                        <TableHead>Ref #</TableHead>
                                        <TableHead>Session</TableHead>
                                        <TableHead>Registered At</TableHead>
                                        <TableHead>Payment Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRegistrations.length > 0 ? paginatedRegistrations.map((reg) => (
                                        <TableRow key={reg.registration_id}>
                                            <TableCell className="font-medium">
                                                <p>{reg.name_on_certificate}</p>
                                                <p className="text-xs text-muted-foreground">{reg.student_number}</p>
                                            </TableCell>
                                            <TableCell>{reg.reference_number}</TableCell>
                                            <TableCell>Session {reg.session} / #{reg.ceremony_number}</TableCell>
                                            <TableCell>{reg.registered_at && isValid(new Date(reg.registered_at)) ? format(new Date(reg.registered_at), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(reg.payment_status)}>{reg.payment_status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                               <ViewSlipDialog slipPath={reg.image_path} studentName={reg.name_on_certificate} />
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24">No registrations found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
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
