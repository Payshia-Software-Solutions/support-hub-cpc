
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, PieChart, Ticket, MessageSquare, CheckCircle, Users } from "lucide-react";
import { getTickets, getChats } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ticket as TicketType, Chat as ChatType } from "@/lib/types";
import { subDays } from "date-fns";

export default function AdminDashboardPage() {
  const { data: tickets, isLoading: isLoadingTickets, isError: isErrorTickets, error: errorTickets } = useQuery<TicketType[]>({
    queryKey: ['admin-tickets-dashboard'], 
    queryFn: getTickets,
  });

  const { data: chats, isLoading: isLoadingChats, isError: isErrorChats, error: errorChats } = useQuery<ChatType[]>({
    queryKey: ['chats-dashboard'],
    queryFn: getChats,
  });

  const isLoading = isLoadingTickets || isLoadingChats;
  const isError = isErrorTickets || isErrorChats;
  const error = errorTickets || errorChats;

  const openTicketsCount = tickets?.filter(t => t.status === 'Open' || t.status === 'In Progress').length ?? 0;
  const activeChatsCount = chats?.length ?? 0;
  
  const oneMonthAgo = subDays(new Date(), 30);
  const resolvedThisMonthCount = tickets?.filter(t => t.status === 'Closed' && t.updatedAt && new Date(t.updatedAt) > oneMonthAgo).length ?? 0;
  
  const newUsersCount = "23"; // Static placeholder as user data API is not available

  const dashboardStats = [
    { title: "Open Tickets", value: openTicketsCount.toString(), icon: <Ticket className="w-6 h-6 text-primary" />, trend: "All open & in-progress" },
    { title: "Active Chats", value: activeChatsCount.toString(), icon: <MessageSquare className="w-6 h-6 text-primary" />, trend: "Total active conversations" },
    { title: "Resolved Tickets (Month)", value: resolvedThisMonthCount.toString(), icon: <CheckCircle className="w-6 h-6 text-green-500" />, trend: "In the last 30 days" },
    { title: "New Users (Week)", value: newUsersCount, icon: <Users className="w-6 h-6 text-primary" />, trend: "Static placeholder" },
  ];
  
  if (isError) {
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-headline font-semibold">Admin Dashboard</h1>
            <div className="mt-4 text-destructive">
                Error loading dashboard data: {error?.message}
            </div>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of support activity and system status.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
               {isLoading ? (
                <Skeleton className="h-8 w-1/2" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Ticket Volume</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {/* Placeholder for a chart */}
            <div className="text-center text-muted-foreground">
              <LineChart className="w-16 h-16 mx-auto mb-2" />
              <p>Ticket Volume Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Ticket Status Distribution</CardTitle>
            <CardDescription>Current snapshot</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {/* Placeholder for a chart */}
            <div className="text-center text-muted-foreground">
              <PieChart className="w-16 h-16 mx-auto mb-2" />
              <p>Status Distribution Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>
      </section>
      
      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>New ticket #ticket123 created by Student Alpha.</li>
              <li>Chat with Student Bravo ended.</li>
              <li>Ticket #ticket120 resolved by Staff Jane.</li>
              <li>Payment of $50 received from Student Charlie.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
