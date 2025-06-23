
"use client";

import { useQuery } from '@tanstack/react-query';
import { TicketList } from "@/components/dashboard/TicketList";
import { dummyStaffMembers } from "@/lib/dummy-data";
import type { Ticket } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getTickets } from '@/lib/api';

const CURRENT_STAFF_ID = dummyStaffMembers[0]?.id || 'staff1'; 

export default function AdminTicketsPage() {
  const { data: tickets, isLoading, isError, error } = useQuery<Ticket[]>({
    queryKey: ['admin-tickets'],
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
    <div className="h-full overflow-y-auto w-full pb-20">
      <TicketList tickets={tickets || []} currentStaffId={CURRENT_STAFF_ID} />
    </div>
  );
}
