
"use client";

import { useQuery } from '@tanstack/react-query';
import { TicketList } from "@/components/dashboard/TicketList";
import type { Ticket } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getTickets } from '@/lib/api';

export default function TicketsPage() {
  const { data: tickets, isLoading, isError, error } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: getTickets,
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center">
        <p className="text-destructive">Error: {error.message}</p>
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-y-auto">
      <TicketList tickets={tickets || []} />
    </div>
  );
}
