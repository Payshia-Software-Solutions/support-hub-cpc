
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, PieChart } from "lucide-react"; // Example icons

// Dummy data for dashboard widgets
const dashboardStats = [
  { title: "Open Tickets", value: "12", icon: <TicketIcon className="w-6 h-6 text-primary" />, trend: "+2 this week" },
  { title: "Active Chats", value: "5", icon: <MessageSquareIcon className="w-6 h-6 text-primary" />, trend: "-1 from yesterday" },
  { title: "Resolved Tickets (Month)", value: "152", icon: <CheckCircleIcon className="w-6 h-6 text-green-500" />, trend: "+15% MoM" },
  { title: "New Users (Week)", value: "23", icon: <UsersIcon className="w-6 h-6 text-primary" />, trend: "Steady" },
];

export default function AdminDashboardPage() {
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
              <div className="text-2xl font-bold">{stat.value}</div>
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

// Placeholder Icons (replace with actual lucide-react imports if needed for styling)
function TicketIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M4 22V2c0-.5.2-1 .6-1.4S5.5 0 6 0h8l6 6v10a6 6 0 0 1-6 6H6a2 2 0 0 1-2-2Z" />
      <path d="M8 14h3" />
      <path d="M8 18h3" />
    </svg>
  );
}

function MessageSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

