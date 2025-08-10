
"use client";

import Link from "next/link";
import type { Ticket, StaffMember } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, ArrowRight, UserCircle, Lock, Ticket as TicketIcon, User } from "lucide-react"; 
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
  viewMode?: 'grid' | 'list';
}

const priorityColors: Record<Ticket["priority"], string> = {
  High: "bg-red-500 text-white",
  Medium: "bg-yellow-500 text-white",
  Low: "bg-green-500 text-white",
};

export function TicketListItem({ ticket, currentStaffId, staffMembers = [], viewMode = 'grid' }: TicketListItemProps) {
  const { user } = useAuth();
  
  const linkPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    ? `/admin/tickets/${ticket.id}`
    : `/dashboard/tickets/${ticket.id}`;
    
  const assignedStaffMember = staffMembers.find(s => s.username === ticket.assignedTo);
  const assignedStaffName = assignedStaffMember?.name || ticket.assignedTo;
  
  const userRoleForBadge = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') ? 'staff' : 'student';

  if (viewMode === 'list') {
      return (
        <Link href={linkPath} className="group block">
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
                           ID: TKT-{ticket.id}
                        </p>
                        <UnreadBadge ticketId={ticket.id} userRole={userRoleForBadge} />
                    </div>
                </div>
                 <div className="flex-shrink-0">
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
            </div>
        </Link>
      )
  }

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
                        <User className="w-4 h-4" />
                        <span className="font-medium">{ticket.studentName} ({ticket.studentNumber})</span>
                    </div>
                </div>
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
                   {ticket.lastMessagePreview}
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
