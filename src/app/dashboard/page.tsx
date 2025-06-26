"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getTickets, getChats } from "@/lib/api";
import { useAnnouncements } from "@/contexts/AnnouncementsContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ticket, Chat, Announcement } from "@/lib/types";
import { ArrowRight, MessageSquare, Ticket as TicketIcon, Megaphone, PlusCircle } from "lucide-react";
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
            {badgeText && <Badge variant={badgeVariant} className="shrink-0">{badgeText}</Badge>}
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
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

    const { announcements, isLoading: isLoadingAnnouncements } = useAnnouncements();

    const isLoading = isLoadingTickets || isLoadingChats || isLoadingAnnouncements;

    const openTickets = tickets?.filter(t => t.status === 'Open' || t.status === 'In Progress') || [];
    const studentChat = chats?.[0];
    const recentAnnouncements = announcements?.slice(0, 3) || [];

    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-headline font-semibold">Welcome, {user?.name || 'Student'}!</h1>
                <p className="text-muted-foreground">Here's a quick overview of your support activity.</p>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TicketIcon className="w-6 h-6 text-primary"/>
                            My Open Tickets
                        </CardTitle>
                        <CardDescription>Your active support requests.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {isLoading && (
                            <>
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </>
                        )}
                        {!isLoading && openTickets.length > 0 ? (
                            openTickets.slice(0, 2).map(ticket => (
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
                            !isLoading && <p className="text-muted-foreground text-center p-4">No open tickets.</p>
                        )}
                    </CardContent>
                    <div className="p-6 pt-0 flex gap-2">
                        <Button asChild>
                            <Link href="/dashboard/create-ticket"><PlusCircle className="mr-2"/>New Ticket</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/tickets">View All</Link>
                        </Button>
                    </div>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-primary"/>
                            Support Chat
                        </CardTitle>
                        <CardDescription>Live chat with our support team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading && <Skeleton className="h-16 w-full" />}
                        {!isLoading && studentChat ? (
                           <InfoListItem
                                href="/dashboard/chat"
                                icon={<MessageSquare className="w-5 h-5"/>}
                                title={`Chat with Support`}
                                description={studentChat.lastMessagePreview || "Click to start chatting."}
                                badgeText={studentChat.unreadCount ? `${studentChat.unreadCount} New` : undefined}
                                badgeVariant="destructive"
                           />
                        ) : (
                           !isLoading &&  <p className="text-muted-foreground text-center p-4">No active chat session.</p>
                        )}
                    </CardContent>
                    <div className="p-6 pt-0">
                         <Button className="w-full" asChild>
                            <Link href="/dashboard/chat">
                                {studentChat ? 'Open Chat' : 'Start Chat'}
                                <ArrowRight className="ml-2"/>
                            </Link>
                        </Button>
                    </div>
                </Card>
            </section>

             <section>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Megaphone className="w-6 h-6 text-primary" />
                           Recent Announcements
                        </CardTitle>
                        <CardDescription>Latest news and updates from the institution.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         {isLoading && (
                            <>
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </>
                        )}
                        {!isLoading && recentAnnouncements.length > 0 ? (
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
                           !isLoading && <p className="text-muted-foreground text-center p-4">No recent announcements.</p>
                        )}
                    </CardContent>
                    <div className="p-6 pt-0">
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/dashboard/announcements">View All Announcements</Link>
                        </Button>
                    </div>
                </Card>
            </section>
        </div>
    );
}
