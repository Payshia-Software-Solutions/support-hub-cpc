"use client";

import Link from "next/link";
import type { Ticket, StaffMember } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, ArrowRight, UserCircle, Lock } from "lucide-react"; 
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { dummyStaffMembers } from "@/lib/dummy-data";


interface TicketListItemProps {
  ticket: Ticket;
  currentStaffId?: string; // Optional: for admin context
}

const priorityColors: Record<Ticket["priority"], string> = {
  High: "bg-red-500 hover:bg-red-600",
  Medium: "bg-yellow-500 hover:bg-yellow-600",
  Low: "bg-green-500 hover:bg-green-600",
};

const statusColors: Record<Ticket["status"], string> = {
  Open: "bg-blue-500 hover:bg-blue-600",
  "In Progress": "bg-purple-500 hover:bg-purple-600",
  Closed: "bg-gray-500 hover:bg-gray-600",
};

export function TicketListItem({ ticket, currentStaffId }: TicketListItemProps) {
  const linkPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    ? `/admin/tickets/${ticket.id}`
    : `/dashboard/tickets/${ticket.id}`;

  const locker = ticket.isLocked && ticket.lockedByStaffId 
    ? dummyStaffMembers.find(s => s.id === ticket.lockedByStaffId) 
    : null;
  
  // const isLockedByOther = ticket.isLocked && ticket.lockedByStaffId !== currentStaffId;

  return (
    <Link href={linkPath} legacyBehavior>
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer bg-card flex flex-col h-full">
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-headline mb-1">{ticket.subject}</CardTitle>
            <div className="flex flex-col items-end gap-1">
              <Badge className={cn("text-xs text-white whitespace-nowrap", priorityColors[ticket.priority])}>
                {ticket.priority}
              </Badge>
              {ticket.isLocked && locker && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Badge variant="secondary" className="text-xs whitespace-nowrap bg-orange-500 text-white">
                        <Lock size={12} className="mr-1"/> Locked
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Locked by: {locker.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <CardDescription className="text-xs text-muted-foreground">Ticket ID: {ticket.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 flex-grow">
          <div className="flex items-center text-sm">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={ticket.studentAvatar} alt={ticket.studentName || 'Student'} data-ai-hint="avatar person"/>
              <AvatarFallback>{ticket.studentName?.charAt(0).toUpperCase() || 'S'}</AvatarFallback>
            </Avatar>
            <span>{ticket.studentName || 'Unknown Student'}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
           {ticket.assignedTo && ticket.assigneeAvatar && (
            <div className="flex items-center text-xs text-muted-foreground pt-2">
              <span className="mr-1">Assigned to:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={ticket.assigneeAvatar} alt={ticket.assignedTo} data-ai-hint="staff avatar"/>
                      <AvatarFallback>{ticket.assignedTo.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{ticket.assignedTo}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-4 mt-auto">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("border text-xs", statusColors[ticket.status], "text-white")}>
              {ticket.status}
            </Badge>
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-primary" />
        </CardFooter>
      </Card>
    </Link>
  );
}
