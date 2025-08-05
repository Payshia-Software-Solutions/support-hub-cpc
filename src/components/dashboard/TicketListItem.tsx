
"use client";

import Link from "next/link";
import type { Ticket, StaffMember } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, ArrowRight, UserCircle, Lock, Ticket as TicketIcon } from "lucide-react"; 
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UnreadBadge } from "./UnreadBadge";
import { useAuth } from "@/contexts/AuthContext";

interface TicketListItemProps {
  ticket: Ticket;
  currentStaffId?: string; // Optional for admin context
  staffMembers?: StaffMember[];
}

const statusColors: Record<Ticket["status"], string> = {
  Open: "bg-blue-500 hover:bg-blue-600",
  "In Progress": "bg-purple-500 hover:bg-purple-600",
  Closed: "bg-gray-500 hover:bg-gray-600",
};

export function TicketListItem({ ticket, currentStaffId, staffMembers = [] }: TicketListItemProps) {
  const { user } = useAuth();
  const linkPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    ? `/admin/tickets/${ticket.id}`
    : `/dashboard/tickets/${ticket.id}`;
  
  return (
    <Link href={linkPath} className="group block h-full">
        <Card className="shadow-lg hover:shadow-xl transition-all duration-200 h-full border-0">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500">
                    <TicketIcon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{ticket.subject}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Badge variant={ticket.status === 'Closed' ? 'secondary' : 'default'}>{ticket.status}</Badge>
                        <span className="truncate">ID: TKT-{ticket.id}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                  <UnreadBadge ticketId={ticket.id} userRole={user?.role || 'student'} />
                </div>
            </CardContent>
        </Card>
    </Link>
  );
}
