
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getTickets } from "@/lib/api";
import type { Ticket } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Ticket as TicketIcon, Clock, CheckCircle, PlusCircle } from "lucide-react";

// --- Sub Components ---
const TicketStats = ({ tickets, isLoading }: { tickets: Ticket[], isLoading: boolean }) => {
    const stats = useMemo(() => {
        if (!tickets) return { open: 0, inProgress: 0, closed: 0 };
        return {
            open: tickets.filter(t => t.status === 'Open').length,
            inProgress: tickets.filter(t => t.status === 'In Progress').length,
            closed: tickets.filter(t => t.status === 'Closed').length,
        };
    }, [tickets]);

    const statCards = [
        { title: "Open Tickets", value: stats.open, icon: <TicketIcon className="w-6 h-6 text-primary" /> },
        { title: "In Progress", value: stats.inProgress, icon: <Clock className="w-6 h-6 text-purple-500" /> },
        { title: "Closed Tickets", value: stats.closed, icon: <CheckCircle className="w-6 h-6 text-green-500" /> },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.map(stat => (
                <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        {stat.icon}
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stat.value}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};


// --- Main Page Component ---
export default function StudentDashboardPage() {
    const { user } = useAuth();
    
    const { data: tickets, isLoading } = useQuery<Ticket[]>({
        queryKey: ['tickets', user?.username],
        queryFn: () => getTickets(user!.username!),
        enabled: !!user?.username,
    });
    
    const recentTickets = useMemo(() => {
       if (!tickets) return [];
       return [...tickets]
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
    }, [tickets]);

    return (
        <div className="space-y-8 p-4 md:p-8 bg-background pb-20">

            {/* --- Profile Header --- */}
            <Card className="shadow-lg overflow-hidden">
                <div className="bg-card p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <Avatar className="w-20 h-20 text-3xl border-4 border-primary/50 shrink-0" data-ai-hint="student avatar">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <h1 className="text-2xl font-bold font-headline">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                        <p className="text-muted-foreground">Here's a summary of your support tickets.</p>
                    </div>
                     <Button asChild>
                        <Link href="/dashboard/create-ticket">
                            <PlusCircle className="mr-2 h-4 w-4"/> Create New Ticket
                        </Link>
                    </Button>
                </div>
            </Card>
            
            <section>
                <h2 className="text-2xl font-semibold font-headline mb-4">Ticket Summary</h2>
                <TicketStats tickets={tickets || []} isLoading={isLoading} />
            </section>

            <section>
                 <h2 className="text-2xl font-semibold font-headline mb-4">Recent Tickets</h2>
                 <Card className="shadow-lg">
                    <CardContent className="p-0">
                       <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                    </TableRow>
                                ))}
                                {!isLoading && recentTickets.length > 0 ? recentTickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">{ticket.subject}</TableCell>
                                        <TableCell><Badge variant={ticket.status === 'Closed' ? 'secondary' : 'default'}>{ticket.status}</Badge></TableCell>
                                        <TableCell>{new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/dashboard/tickets/${ticket.id}`}>
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    !isLoading && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                You haven't created any tickets yet.
                                            </TableCell>
                                        </TableRow>
                                    )
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                 </Card>
            </section>
        </div>
    );
}
