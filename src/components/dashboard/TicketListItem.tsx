
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
import { format } from "date-fns";


interface TicketListItemProps {
  ticket: Ticket;
  currentStaffId?: string; // Optional for admin context
  staffMembers?: StaffMember[];
}

const priorityColors: Record<Ticket["priority"], string> = {
  High: "bg-red-500 text-white",
  Medium: "bg-yellow-500 text-white",
  Low: "bg-green-500 text-white",
};

export function TicketListItem({ ticket, currentStaffId, staffMembers = [] }: TicketListItemProps) {
  const { user } = useAuth();
  const linkPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    ? `/admin/tickets/${ticket.id}`
    : `/dashboard/tickets/${ticket.id}`;
    
  const assignedStaffMember = staffMembers.find(s => s.username === ticket.assignedTo);
  const assignedStaffName = assignedStaffMember?.name || ticket.assignedTo;
  
  return (
    <Link href={linkPath} className="group block h-full">
        <Card className="shadow-lg hover:shadow-xl transition-all duration-200 h-full flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">{ticket.subject}</CardTitle>
                    <Badge variant="secondary" className={cn(priorityColors[ticket.priority])}>{ticket.priority}</Badge>
                </div>
                 <CardDescription>Ticket ID: <span className="font-bold text-red-800 text-lg">TKT-{ticket.id}</span></CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                 <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        {ticket.assignedTo && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={ticket.assigneeAvatar} alt={assignedStaffName || ''} />
                                            <AvatarFallback>{(assignedStaffName || 'S').charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Assigned to {assignedStaffName}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <span className="font-medium">{assignedStaffName || 'Unassigned'}</span>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                   {ticket.lastMessagePreview || "No messages yet."}
                </p>
            </CardContent>
            <CardFooter className="flex justify-between items-center text-xs text-muted-foreground p-4 bg-muted/50">
                 <div className="flex gap-2">
                    <Badge variant={ticket.status === 'Closed' ? 'outline' : 'default'}>{ticket.status}</Badge>
                    <Badge variant="outline">{ticket.category}</Badge>
                </div>
                 <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{format(new Date(ticket.createdAt), "dd/MM/yyyy")}</span>
                </div>
            </CardFooter>
        </Card>
    </Link>
  );
}
