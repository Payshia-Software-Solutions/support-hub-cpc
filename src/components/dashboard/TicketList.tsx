
"use client";

import type { Ticket } from "@/lib/types";
import { TicketListItem } from "./TicketListItem";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

interface TicketListProps {
  tickets: Ticket[];
  currentStaffId?: string; // Optional for admin context to check locks
}

export function TicketList({ tickets: initialTickets, currentStaffId }: TicketListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredTickets = initialTickets
    .filter(ticket => 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.assignedTo && ticket.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(ticket => statusFilter === "all" || ticket.status === statusFilter)
    .filter(ticket => priorityFilter === "all" || ticket.priority === priorityFilter)
    .sort((a, b) => { // Sort open/in progress tickets first, then by creation date
      if (a.status !== 'Closed' && b.status === 'Closed') return -1;
      if (a.status === 'Closed' && b.status !== 'Closed') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });


  return (
    <div className="space-y-6 p-0 md:p-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center sticky top-0 bg-background py-4 z-10 border-b px-4 md:px-6">
        <h1 className="text-2xl font-headline font-semibold">Support Tickets</h1>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search tickets..." 
              className="pl-10 w-full md:w-64" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0 pb-4">
          {filteredTickets.map((ticket) => (
            <TicketListItem key={ticket.id} ticket={ticket} currentStaffId={currentStaffId} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-4 md:px-0">
          <p className="text-muted-foreground text-lg">No tickets match your filters.</p>
        </div>
      )}
    </div>
  );
}
