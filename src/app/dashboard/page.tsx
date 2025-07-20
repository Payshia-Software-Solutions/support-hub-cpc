
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getTickets, getChats } from "@/lib/api";
import { useAnnouncements } from "@/contexts/AnnouncementsContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ticket } from "@/lib/types";
import { ArrowRight, MessageSquare, Ticket as TicketIcon, Megaphone, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// A small component for list items to keep the main component clean
const InfoListItem = ({ href, icon, title, description, badgeText, badgeVariant }: { href: string, icon: React.ReactNode, title: string, description: string, badgeText?: string, badgeVariant?: "default" | "secondary" | "destructive" | "outline" | null | undefined }) => (
    <Link href={href} className="block group">
        <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
            <div className="text-primary">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-card-foreground group-hover:text-primary truncate">{title}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
            </div>
            <div className="flex items-center gap-2">
                {badgeText && <Badge variant={badgeVariant} className="shrink-0">{badgeText}</Badge>}
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
        </div>
    </Link>
);

const StatCard = ({ title, value, icon, description, href, isLoading }: { title: string, value: string | number, icon: React.ReactNode, description: string, href: string, isLoading: boolean }) => (
  <Link href={href}>
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <Skeleton className="h-8 w-1/2" />
        ) : (
            <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </Link>
);


export default function StudentDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();

    const { data: tickets, isLoading: isLoadingTickets } = useQuery<Ticket[]>({
        queryKey: ['tickets', user?.username],
        queryFn: () => getTickets(user!.username!),
        enabled: !!user?.username,
    });

    const { data: chats, isLoading: isLoadingChats } = useQuery<Chat[]>({
        queryKey: ['chats', user?.username],
        queryFn: () => getChats(user!.username!),
        enabled: !!user?.username,
    });

    const { announcements, unreadCount: unreadAnnouncementsCount, isLoading: isLoadingAnnouncements } = useAnnouncements();

    const isLoading = isLoadingTickets || isLoadingChats || isLoadingAnnouncements;

    const openTickets = tickets?.filter(t => t.status === 'Open' || t.status === 'In Progress') || [];
    const studentChat = chats?.[0];
    const unreadMessagesCount = studentChat?.unreadCount || 0;
    const recentAnnouncements = announcements?.slice(0, 3) || [];

    const dashboardStats = [
        { title: "Open Tickets", value: openTickets.length, icon: <TicketIcon className="w-5 h-5 text-muted-foreground" />, description: "View your active tickets", href: "/dashboard/tickets" },
        { title: "Unread Messages", value: unreadMessagesCount, icon: <MessageSquare className="w-5 h-5 text-muted-foreground" />, description: "Go to your support chat", href: "/dashboard/chat" },
        { title: "New Announcements", value: unreadAnnouncementsCount, icon: <Megaphone className="w-5 h-5 text-muted-foreground" />, description: "See the latest updates", href: "/dashboard/announcements" },
        { title: "Course Recordings", value: "View", icon: <Video className="w-5 h-5 text-muted-foreground" />, description: "Access your class recordings", href: "/dashboard/recordings" },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Welcome, {user?.name || 'Student'}!</h1>
                <p className="text-muted-foreground">Here's a quick overview of your support activity.</p>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardStats.map((stat, index) => (
                    <StatCard 
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        description={stat.description}
                        href={stat.href}
                        isLoading={isLoading && stat.title !== 'Course Recordings'}
                    />
                ))}
            </section>
            
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TicketIcon className="w-6 h-6 text-primary"/>
                            Recent Tickets
                        </CardTitle>
                        <CardDescription>Your most recently updated open tickets.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1 flex-grow">
                        {isLoading ? (
                            <>
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </>
                        ) : openTickets.length > 0 ? (
                            openTickets.slice(0, 3).map(ticket => (
                                <InfoListItem 
                                    key={ticket.id}
                                    href={`/dashboard/tickets/${ticket.id}`}
                                    icon={<TicketIcon className="w-5 h-5"/>}
                                    title={ticket.subject}
                                    description={`Status: ${ticket.status}`}
                                    badgeText={ticket.priority}
                                    badgeVariant="secondary"
                                />
                            ))
                        ) : (
                           <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground">
                                <p>You have no open tickets.</p>
                                <Button asChild variant="link" className="mt-1">
                                    <Link href="/dashboard/create-ticket">Create a new ticket</Link>
                                </Button>
                           </div>
                        )}
                    </CardContent>
                    <CardFooter>
                         <Button variant="outline" className="w-full" asChild>
                            <Link href="/dashboard/tickets">View All Tickets</Link>
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="shadow-lg flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Megaphone className="w-6 h-6 text-primary" />
                           Latest Announcements
                        </CardTitle>
                        <CardDescription>Top news and updates from the institution.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1 flex-grow">
                         {isLoading ? (
                            <>
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </>
                        ) : recentAnnouncements.length > 0 ? (
                            recentAnnouncements.map(announcement => (
                                <InfoListItem
                                    key={announcement.id}
                                    href="/dashboard/announcements"
                                    icon={<Megaphone className="w-5 h-5"/>}
                                    title={announcement.title}
                                    description={announcement.content}
                                    badgeText={announcement.isNew ? "New" : undefined}
                                    badgeVariant="destructive"
                                />
                            ))
                        ) : (
                           <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground">
                                <p>No recent announcements.</p>
                           </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/dashboard/announcements">View All Announcements</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </section>
        </div>
    );
}
