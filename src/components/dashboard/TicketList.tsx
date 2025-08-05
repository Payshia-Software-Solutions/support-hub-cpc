
"use client";

import type { Ticket } from "@/lib/types";
import { TicketListItem } from "./TicketListItem";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TicketListProps {
  tickets: Ticket[];
  currentStaffId?: string; // Optional for admin context to check locks
  initialStatusFilter?: string;
}

const ITEMS_PER_PAGE = 9; // Display 9 tickets per page (3x3 grid)

export function TicketList({ tickets: initialTickets, currentStaffId, initialStatusFilter = "all" }: TicketListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTickets = useMemo(() => {
    return initialTickets
    .filter(ticket =>
      (ticket.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ticket.id?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase()) || // Search by ID
      (ticket.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ticket.studentName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ticket.assignedTo?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .filter(ticket => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'Open') return ticket.status === 'Open' || ticket.status === 'In Progress';
        return ticket.status === statusFilter;
    })
    .filter(ticket => priorityFilter === "all" || ticket.priority === priorityFilter)
    .sort((a, b) => { // Sort open/in progress tickets first, then by creation date
      if (a.status !== 'Closed' && b.status === 'Closed') return -1;
      if (a.status === 'Closed' && b.status !== 'Closed') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [initialTickets, searchTerm, statusFilter, priorityFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter]);
  
  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = useMemo(() => {
    return filteredTickets.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredTickets, currentPage]);
  
  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
       <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 h-14 w-14 rounded-full shadow-lg">
                <Link href="/dashboard/create-ticket">
                    <Plus className="h-6 w-6" />
                    <span className="sr-only">Create New Ticket</span>
                </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Create New Ticket</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center sticky top-0 bg-background/80 backdrop-blur-sm pt-2 pb-4 z-10 -mx-4 -mt-4 px-4 border-b md:mx-0 md:mt-0 md:px-0 md:border-b-0">
        <div>
          <h1 className="text-2xl font-headline font-semibold">Support Tickets</h1>
          <p className="text-muted-foreground text-sm">Create or manage support tickets.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, subject, user..."
              className="pl-10 w-full md:w-64 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Open">Open & In Progress</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card">
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

      {paginatedTickets.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTickets.map((ticket) => (
              <TicketListItem key={ticket.id} ticket={ticket} currentStaffId={currentStaffId} />
            ))}
          </div>
          {totalPages > 1 && (
             <div className="flex items-center justify-center space-x-2 pt-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    Next
                </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-lg">No tickets match your filters.</p>
        </div>
      )}
    </div>
  );
}
