
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Ticket, MessageSquare, CheckCircle, Users, Clock, BarChart as BarChartIcon } from "lucide-react";
import { getAdminTickets, getAdminChats } from "@/lib/actions/tickets";
import { getStaffMembers } from "@/lib/actions/users";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ticket as TicketType, Chat as ChatType, StaffMember } from "@/lib/types";
import { subDays, format, isSameDay } from "date-fns";
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
  Label,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";


export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const { data: tickets, isLoading: isLoadingTickets, isError: isErrorTickets, error: errorTickets } = useQuery<TicketType[]>({
    queryKey: ['admin-tickets-dashboard'], 
    queryFn: getAdminTickets,
  });

  const { data: chats, isLoading: isLoadingChats, isError: isErrorChats, error: errorChats } = useQuery<ChatType[]>({
    queryKey: ['chats-dashboard'],
    queryFn: getAdminChats,
  });

  const { data: staffMembers, isLoading: isLoadingStaff } = useQuery<StaffMember[]>({
    queryKey: ['staffMembers-dashboard'],
    queryFn: getStaffMembers,
  });

  const isLoading = isLoadingTickets || isLoadingChats || isLoadingStaff;

  const dashboardStats = useMemo(() => {
    const openTicketsCount = tickets?.filter(t => t.status === 'Open').length ?? 0;
    const inProgressTicketsCount = tickets?.filter(t => t.status === 'In Progress').length ?? 0;
    const snoozedTicketsCount = tickets?.filter(t => t.status === 'Snooze').length ?? 0;
    const activeChatsCount = chats?.length ?? 0;
    const oneMonthAgo = subDays(new Date(), 30);
    const resolvedThisMonthCount = tickets?.filter(t => t.status === 'Closed' && t.updatedAt && new Date(t.updatedAt) > oneMonthAgo).length ?? 0;

    return [
      { title: "Open Tickets", value: openTicketsCount.toString(), icon: <Ticket className="w-6 h-6 text-primary" />, trend: "Tickets awaiting response", href: "/admin/tickets?status=Open" },
      { title: "In Progress", value: inProgressTicketsCount.toString(), icon: <Clock className="w-6 h-6 text-purple-500" />, trend: "Tickets actively being handled", href: "/admin/tickets?status=In Progress" },
      { title: "Snoozed Tickets", value: snoozedTicketsCount.toString(), icon: <Clock className="w-6 h-6 text-orange-500" />, trend: "Tickets paused or waiting", href: "/admin/tickets?status=Snooze" },
      { title: "Active Chats", value: activeChatsCount.toString(), icon: <MessageSquare className="w-6 h-6 text-primary" />, trend: "Total active conversations", href: "/admin/chat" },
      { title: "Resolved (Month)", value: resolvedThisMonthCount.toString(), icon: <CheckCircle className="w-6 h-6 text-green-500" />, trend: "In the last 30 days", href: "/admin/tickets?status=Closed" },
    ];
  }, [tickets, chats]);

  const totalTickets = useMemo(() => tickets?.length ?? 0, [tickets]);

  const ticketVolumeData = useMemo(() => {
    if (!tickets) return [];
    return [...Array(7)].map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, "MMM d"),
        shortDate: format(date, "EEE"),
        total: tickets.filter(t => isSameDay(new Date(t.createdAt), date)).length,
      };
    });
  }, [tickets]);
  
  const statusChartConfig: ChartConfig = {
    Open: { label: "Open", color: "hsl(var(--chart-1))" },
    "In Progress": { label: "In Progress", color: "hsl(var(--chart-2))" },
    Closed: { label: "Closed", color: "hsl(var(--chart-3))" },
    Snooze: { label: "Snooze", color: "hsl(var(--chart-4))" },
  };

  const ticketStatusData = useMemo(() => {
    if (!tickets) return [];
    return (Object.keys(statusChartConfig) as Array<keyof typeof statusChartConfig>).map(status => ({
        status: status,
        total: tickets.filter(t => t.status === status).length,
        fill: statusChartConfig[status].color,
      })
    ).filter(d => d.total > 0);
  }, [tickets]);

  const volumeChartConfig: ChartConfig = {
    total: { label: "Tickets", color: "hsl(var(--primary))" },
  };

  const handlingChartConfig: ChartConfig = {
    Open: { label: "Open", color: "hsl(var(--chart-1))" },
    InProgress: { label: "In Progress", color: "hsl(var(--chart-2))" },
    Snooze: { label: "Snooze", color: "hsl(var(--chart-4))" },
  };

  const staffHandlingData = useMemo(() => {
    if (!tickets || !staffMembers) return [];
    return staffMembers.map(staff => {
      const assignedTickets = tickets.filter(t => t.assignedTo === staff.username) ?? [];
      return {
        name: staff.name.split(' ')[0], // Use first name for brevity
        Open: assignedTickets.filter(t => t.status === 'Open').length,
        InProgress: assignedTickets.filter(t => t.status === 'In Progress').length,
        Snooze: assignedTickets.filter(t => t.status === 'Snooze').length,
      };
    }).filter(d => d.Open > 0 || d.InProgress > 0 || d.Snooze > 0);
  }, [tickets, staffMembers]);
  
  const closedChartConfig: ChartConfig = {
    Closed: { label: "Closed", color: "hsl(var(--chart-3))" },
  };

  const staffClosedData = useMemo(() => {
    if (!tickets || !staffMembers) return [];
    return staffMembers.map(staff => {
      const closedTickets = tickets.filter(t => t.assignedTo === staff.username && t.status === 'Closed').length ?? 0;
      return {
        name: staff.name.split(' ')[0], // Use first name for brevity
        Closed: closedTickets,
      };
    }).filter(d => d.Closed > 0);
  }, [tickets, staffMembers]);
  
    const categoryChartConfig: ChartConfig = {
        total: { label: "Tickets" },
    };

    const ticketCategoryData = useMemo(() => {
        if (!tickets) return [];
        const categoryCounts = tickets.reduce((acc, ticket) => {
            acc[ticket.category] = (acc[ticket.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(categoryCounts).map(([name, total]) => ({ name, total })).sort((a,b) => b.total - a.total);
    }, [tickets]);
  
  if (isErrorTickets || isErrorChats) {
    return (
        <div className="p-4 md:p-8 space-y-8 pb-20">
            <h1 className="text-3xl font-headline font-semibold">Admin Dashboard</h1>
            <div className="mt-4 text-destructive space-y-2">
                <p className="font-bold">Error loading dashboard data:</p>
                {isErrorTickets && <p className="text-sm">Tickets Error: {errorTickets?.message}</p>}
                {isErrorChats && <p className="text-sm">Chats Error: {errorChats?.message}</p>}
            </div>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of support activity and system status.</p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {dashboardStats.map((stat, index) => {
           const card = (
             <Card 
                className="shadow-lg hover:shadow-xl transition-shadow h-full animate-in fade-in-50 slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
            >
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
           );

           if (stat.href) {
            return (
              <Link href={stat.href} key={index} className="block">
                {card}
              </Link>
            )
           }
           return <div key={index}>{card}</div>;
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg animate-in fade-in-50 slide-in-from-bottom-4 delay-200">
          <CardHeader>
            <CardTitle>Ticket Volume</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                 <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ChartContainer config={volumeChartConfig} className="w-full h-full">
                <BarChart data={ticketVolumeData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="shortDate"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    allowDecimals={false}
                    fontSize={12}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg animate-in fade-in-50 slide-in-from-bottom-4 delay-300">
          <CardHeader>
            <CardTitle>Ticket Status Distribution</CardTitle>
            <CardDescription>Current snapshot</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {isLoading ? (
               <div className="flex h-full items-center justify-center">
                 <Skeleton className="h-48 w-48 rounded-full" />
               </div>
            ) : ticketStatusData.length > 0 ? (
              <ChartContainer
                config={statusChartConfig}
                className="mx-auto aspect-square h-full"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={ticketStatusData}
                    dataKey="total"
                    nameKey="status"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                     {ticketStatusData.map((entry) => (
                      <Cell key={`cell-${entry.status}`} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {totalTickets.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 20}
                                className="fill-muted-foreground text-sm"
                              >
                                Total Tickets
                              </tspan>
                            </text>
                          )
                        }
                        return null
                      }}
                    />
                  </Pie>
                   <Legend
                      content={({ payload }) => {
                        return (
                          <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
                            {payload?.map((entry) => (
                              <li key={`item-${entry.value}`} className="flex items-center gap-2 text-sm">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span>{entry.value} ({entry.payload.payload.total})</span>
                              </li>
                            ))}
                          </ul>
                        )
                      }}
                    />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground">No ticket data to display.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="animate-in fade-in-50 slide-in-from-bottom-4 delay-400">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Ticket Analytics by Category</CardTitle>
                <CardDescription>Distribution of tickets across different support categories.</CardDescription>
            </CardHeader>
            <CardContent className="h-[450px]">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Skeleton className="h-full w-full" />
                    </div>
                ) : (
                    <ChartContainer config={categoryChartConfig} className="w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={ticketCategoryData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                <CartesianGrid horizontal={false} />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={isMobile ? 60 : 120}
                                    tickLine={false} 
                                    axisLine={false} 
                                    fontSize={12} 
                                    interval={0}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', dy: 2, textAnchor: 'start' }}
                                    wrapperStyle={{ overflow: 'visible' }}
                                />
                                <XAxis type="number" hide />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={18}>
                                     <Label
                                        position="right"
                                        content={({ x, y, width, height, value }) => 
                                            <text x={x + width + 8} y={y + height / 2} dy={4} className="text-sm font-medium fill-foreground">{value}</text>
                                        }
                                    />
                                </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
      </section>

      {user?.userlevel === 'Admin' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg animate-in fade-in-50 slide-in-from-bottom-4 delay-400">
            <CardHeader>
              <CardTitle>Active Tickets by Staff</CardTitle>
              <CardDescription>Open, In-Progress, and Snoozed tickets per staff member</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                   <Skeleton className="h-full w-full" />
                </div>
              ) : staffHandlingData.length > 0 ? (
                <ChartContainer config={handlingChartConfig} className="w-full h-full">
                  <BarChart data={staffHandlingData} layout="vertical" accessibilityLayer margin={{ left: 10, right: 10 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                      width={80}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Legend />
                    <Bar dataKey="Open" stackId="a" fill="var(--color-Open)" />
                    <Bar dataKey="InProgress" stackId="a" fill="var(--color-InProgress)" />
                    <Bar dataKey="Snooze" stackId="a" fill="var(--color-Snooze)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No active tickets assigned to staff.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg animate-in fade-in-50 slide-in-from-bottom-4 delay-500">
            <CardHeader>
              <CardTitle>Resolved Tickets by Staff</CardTitle>
              <CardDescription>Total tickets closed by each staff member</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                   <Skeleton className="h-full w-full" />
                </div>
              ) : staffClosedData.length > 0 ? (
                <ChartContainer config={closedChartConfig} className="w-full h-full">
                  <BarChart data={staffClosedData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      allowDecimals={false}
                      fontSize={12}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Legend />
                    <Bar dataKey="Closed" fill="var(--color-Closed)" radius={4} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No closed tickets assigned to staff.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

    </div>
  );
}

    