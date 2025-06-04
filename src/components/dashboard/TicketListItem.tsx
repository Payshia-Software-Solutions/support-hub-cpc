"use client";

import Link from "next/link";
import type { Ticket } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketListItemProps {
  ticket: Ticket;
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

export function TicketListItem({ ticket }: TicketListItemProps) {
  return (
    <Link href={`/dashboard/tickets/${ticket.id}`} legacyBehavior>
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer bg-card">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-headline mb-1">{ticket.subject}</CardTitle>
            <Badge className={cn("text-xs text-white", priorityColors[ticket.priority])}>
              {ticket.priority}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">Ticket ID: {ticket.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center text-sm">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={ticket.studentAvatar} alt={ticket.studentName} data-ai-hint="avatar person"/>
              <AvatarFallback>{ticket.studentName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{ticket.studentName}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
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
