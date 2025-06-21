"use client";

import { useQuery } from '@tanstack/react-query';
import { TicketList } from "@/components/dashboard/TicketList";
import { dummyStaffMembers } from "@/lib/dummy-data";
import type { Ticket } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

// Simulate current staff user - In a real app, this would come from auth
const CURRENT_STAFF_ID = dummyStaffMembers[0]?.id || 'staff1'; 

async function getTickets(): Promise<Ticket[]> {
  const res = await fetch('/api/tickets');
  if (!res.ok) {
    throw new Error('Failed to fetch tickets');
  }
  return res.json();
}

export default function AdminTicketsPage() {
  const { data: tickets, isLoading, isError, error } = useQuery<Ticket[]>({
    queryKey: ['admin-tickets'], // Use a different key to avoid conflicts if needed
    queryFn: getTickets,
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
       <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto w-full">
      <TicketList tickets={tickets || []} currentStaffId={CURRENT_STAFF_ID} />
    </div>
  );
}
