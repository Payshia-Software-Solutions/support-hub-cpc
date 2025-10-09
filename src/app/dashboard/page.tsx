
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getTickets } from "@/lib/actions/tickets";
import type { Ticket } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Ticket as TicketIcon, Clock, CheckCircle, PlusCircle, Award, Library, BookOpen, FileText, Gamepad2 } from "lucide-react";
import { UnreadBadge } from "@/components/dashboard/UnreadBadge";
import { CeylonPharmacyIcon, DPadIcon, HunterProIcon, LuckyWheelIcon, PharmaHunterIcon, PharmaReaderIcon, WinPharmaIcon, WordPalletIcon } from "@/components/icons/module-icons";

// --- Sub Components ---
const TicketStats = ({ tickets, isLoading }: { tickets: Ticket[], isLoading: boolean }) => {
    const stats = useMemo(() => {
        if (!tickets) return { open: 0, inProgress: 0, closed: 0, all: 0 };
        return {
            open: tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length,
            inProgress: tickets.filter(t => t.status === 'In Progress').length,
            closed: tickets.filter(t => t.status === 'Closed').length,
            all: tickets.length
        };
    }, [tickets]);

    const statCards = [
        { title: "Open Tickets", value: stats.open, icon: <TicketIcon className="w-6 h-6 text-primary" /> },
        { title: "In Progress", value: stats.inProgress, icon: <Clock className="w-6 h-6 text-purple-500" /> },
        { title: "Closed Tickets", value: stats.closed, icon: <CheckCircle className="w-6 h-6 text-green-500" /> },
        { title: "All Tickets", value: stats.all, icon: <Library className="w-6 h-6 text-gray-500" /> },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {statCards.map((stat, index) => (
                <Card 
                    key={stat.title} 
                    className="shadow-lg hover:shadow-xl transition-shadow animate-in fade-in-50 slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
                >
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

const QuickActionCard = ({ title, description, href, icon, colorClass }: { title: string, description: string, href: string, icon: React.ReactNode, colorClass: string }) => (
    <Link href={href} className="group block">
        <Card className="shadow-lg hover:shadow-xl transition-all duration-200 h-full border-0">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClass}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
            </CardContent>
        </Card>
    </Link>
);


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
            <Card className="shadow-lg overflow-hidden animate-in fade-in-50">
                <div className="bg-card p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <Avatar className="w-20 h-20 text-3xl border-4 border-primary/50 shrink-0" data-ai-hint="student avatar">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <h1 className="text-2xl font-bold font-headline">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                        <p className="text-muted-foreground">Here's a summary of your support tickets and available modules.</p>
                    </div>
                </div>
            </Card>
            
             <section className="animate-in fade-in-50 slide-in-from-bottom-4 delay-400">
                 <h2 className="text-2xl font-semibold font-headline mb-4">Games & Challenges</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <QuickActionCard title="Ceylon Pharmacy" description="Patient simulation game." href="/dashboard/ceylon-pharmacy" icon={<CeylonPharmacyIcon className="w-8 h-8 text-white"/>} colorClass="from-cyan-400 to-sky-500" />
                     <QuickActionCard title="D-Pad Challenge" description="Dispensing accuracy test." href="/dashboard/d-pad" icon={<DPadIcon className="w-8 h-8 text-white"/>} colorClass="from-rose-400 to-red-500" />
                     <QuickActionCard title="Sentence Builder" description="English language practice." href="/dashboard/games/sentence-builder" icon={<BookOpen className="w-8 h-8 text-white"/>} colorClass="from-amber-400 to-orange-500" />
                 </div>
            </section>

            <section className="animate-in fade-in-50 slide-in-from-bottom-4 delay-150">
                <h2 className="text-2xl font-semibold font-headline mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <QuickActionCard title="Create Ticket" description="Open a new support request for any issue." href="/dashboard/create-ticket" icon={<PlusCircle className="w-8 h-8 text-white" />} colorClass="from-blue-400 to-indigo-500" />
                     <QuickActionCard title="Order Certificate" description="Request official certificates for completed courses." href="/dashboard/certificate-order" icon={<Award className="w-8 h-8 text-white" />} colorClass="from-green-400 to-teal-500" />
                     <QuickActionCard title="BNF" description="Access the British National Formulary." href="/dashboard/bnf" icon={<BookOpen className="w-8 h-8 text-white" />} colorClass="from-red-400 to-rose-500" />
                </div>
            </section>
            
            <section className="animate-in fade-in-50 slide-in-from-bottom-4 delay-300">
                <h2 className="text-2xl font-semibold font-headline mb-4">Ticket Summary</h2>
                <div className="w-full">
                    <TicketStats tickets={tickets || []} isLoading={isLoading} />
                </div>
            </section>

            <section className="animate-in fade-in-50 slide-in-from-bottom-4 delay-500">
                 <h2 className="text-2xl font-semibold font-headline mb-4">Recent Tickets</h2>
                 <Card className="shadow-lg">
                    <CardContent className="p-4 md:p-6">
                       <div className="space-y-4">
                        {isLoading && [...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                        ))}
                        {!isLoading && recentTickets.length > 0 ? recentTickets.map((ticket) => (
                            <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`} className="block group">
                                <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <TicketIcon className="w-5 h-5 text-primary"/>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold truncate pr-2">{ticket.subject}</p>
                                            <Badge variant={ticket.status === 'Closed' ? 'secondary' : 'default'}>{ticket.status}</Badge>
                                        </div>
                                        <div className="flex justify-between items-end mt-1">
                                            <p className="text-sm text-muted-foreground truncate pr-2">
                                                {ticket.lastMessagePreview || "No messages yet."}
                                            </p>
                                            <UnreadBadge ticketId={ticket.id} userRole="student" />
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            !isLoading && (
                                <div className="text-center py-10 text-muted-foreground">
                                    You haven't created any tickets yet.
                                </div>
                            )
                        )}
                        </div>
                    </CardContent>
                 </Card>
            </section>
        </div>
    );
}
