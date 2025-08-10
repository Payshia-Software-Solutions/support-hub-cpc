
"use client";

import type { Ticket } from "@/lib/types";
import { TicketListItem } from "./TicketListItem";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, LayoutGrid, List, Rows, User } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TicketListProps {
  tickets: Ticket[];
  currentStaffId?: string; // Optional for admin context to check locks
  initialStatusFilter?: string;
}

const ITEMS_PER_PAGE = 9;
const FILTERS_STORAGE_KEY = 'ticketListFilters';
const VIEW_MODE_STORAGE_KEY = 'ticketListViewMode';

type ViewMode = 'grid' | 'list' | 'table';

export function TicketList({ tickets: initialTickets, currentStaffId, initialStatusFilter = "all" }: TicketListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignedToMeFilter, setAssignedToMeFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    try {
        const savedViewMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY) as ViewMode | null;
        if (savedViewMode && ['grid', 'list', 'table'].includes(savedViewMode)) {
            setViewMode(savedViewMode);
        }
    } catch (error) {
        console.error("Failed to load view mode from local storage", error);
    }

    if (initialStatusFilter && initialStatusFilter !== 'all') {
      setStatusFilter(initialStatusFilter);
      try {
        const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
        const currentFilters = saved ? JSON.parse(saved) : {};
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({ ...currentFilters, statusFilter: initialStatusFilter }));
      } catch (error) {
        console.error("Failed to update status filter in local storage", error);
      }
    } else {
      try {
          const savedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
          if (savedFilters) {
              const { searchTerm, statusFilter, priorityFilter, assignedToMeFilter } = JSON.parse(savedFilters);
              setSearchTerm(searchTerm || "");
              if (!initialStatusFilter || initialStatusFilter === 'all') {
                 setStatusFilter(statusFilter || "all");
              }
              setPriorityFilter(priorityFilter || "all");
              if (currentStaffId) {
                setAssignedToMeFilter(assignedToMeFilter || false);
              }
          }
      } catch (error) {
          console.error("Failed to load filters from local storage", error);
      }
    }
    setIsMounted(true);
  }, [initialStatusFilter, currentStaffId]);

  useEffect(() => {
    if (isMounted) {
        try {
            const filters = { searchTerm, statusFilter, priorityFilter, assignedToMeFilter };
            localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
            localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
        } catch (error) {
            console.error("Failed to save state to local storage", error);
        }
    }
  }, [searchTerm, statusFilter, priorityFilter, viewMode, isMounted, assignedToMeFilter]);

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
        return ticket.status === statusFilter;
    })
    .filter(ticket => priorityFilter === "all" || ticket.priority === priorityFilter)
    .filter(ticket => {
        if (!assignedToMeFilter || !currentStaffId) return true;
        return ticket.assignedTo === currentStaffId;
    })
    .sort((a, b) => { // Sort open/in progress tickets first, then by creation date
      const closedOrder = a.status === 'Closed' ? 1 : (b.status === 'Closed' ? -1 : 0);
      if (closedOrder !== 0) return closedOrder;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [initialTickets, searchTerm, statusFilter, priorityFilter, assignedToMeFilter, currentStaffId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, assignedToMeFilter]);

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = useMemo(() => {
    return filteredTickets.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredTickets, currentPage]);
  
  const linkPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') 
    ? '/dashboard/create-ticket' // Admin create ticket page might be different if it exists
    : '/dashboard/create-ticket';

  const ViewSwitcher = () => (
    <div className="flex items-center gap-1 rounded-md bg-muted p-1">
        <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-1.5" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
        <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-1.5" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
        <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-1.5" onClick={() => setViewMode('table')}><Rows className="h-4 w-4"/></Button>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:px-6">
       <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 h-14 w-14 rounded-full shadow-lg">
                <Link href={linkPath}>
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

      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center sticky top-0 bg-background/80 backdrop-blur-sm z-10 -mx-4 px-4 border-b md:mx-0 md:px-0 md:border-b-0 pb-4">
        <div>
          <h1 className="text-2xl font-headline font-semibold">Support Tickets</h1>
          <p className="text-muted-foreground text-sm">Create or manage support tickets.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
           <ViewSwitcher />
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 w-full md:w-48 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Snooze">Snooze</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-card">
              <SelectValue placeholder="Priority" />
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

       {currentStaffId && (
        <div className="flex items-center space-x-2">
            <Checkbox
                id="assigned-to-me"
                checked={assignedToMeFilter}
                onCheckedChange={(checked) => setAssignedToMeFilter(Boolean(checked))}
            />
            <Label htmlFor="assigned-to-me" className="text-sm font-medium">
                Only show tickets assigned to me
            </Label>
        </div>
      )}


      {paginatedTickets.length > 0 ? (
        <>
          {viewMode === 'grid' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedTickets.map((ticket) => (
                  <TicketListItem key={ticket.id} ticket={ticket} currentStaffId={currentStaffId} viewMode="grid" />
                ))}
            </div>
          )}
          {viewMode === 'list' && (
             <div className="space-y-3">
                {paginatedTickets.map((ticket) => (
                  <TicketListItem key={ticket.id} ticket={ticket} currentStaffId={currentStaffId} viewMode="list" />
                ))}
            </div>
          )}
          {viewMode === 'table' && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell><Link href={currentStaffId ? `/admin/tickets/${ticket.id}` : `/dashboard/tickets/${ticket.id}`} className="font-medium text-primary hover:underline">TKT-{ticket.id}</Link></TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>{ticket.studentName}</TableCell>
                      <TableCell><Badge variant={ticket.status === 'Closed' ? 'outline' : 'default'}>{ticket.status}</Badge></TableCell>
                      <TableCell>{format(new Date(ticket.createdAt), "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
