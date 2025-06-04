"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TicketDetailClient } from "@/components/dashboard/TicketDetailClient";
import { dummyTickets as initialDummyTickets } from "@/lib/dummy-data";
import type { Ticket } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  // Use state to manage tickets data, simulating a mutable data store
  const [tickets, setTickets] = useState<Ticket[]>(initialDummyTickets);
  const [ticket, setTicket] = useState<Ticket | null | undefined>(undefined); // undefined for loading, null for not found

  useEffect(() => {
    const foundTicket = tickets.find((t) => t.id === ticketId);
    setTicket(foundTicket || null);
  }, [ticketId, tickets]);

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets(prevTickets => 
      prevTickets.map(t => t.id === updatedTicket.id ? updatedTicket : t)
    );
    // The local 'ticket' state for this page will be updated by the useEffect above
    // or directly if preferred: setTicket(updatedTicket);
  };

  if (ticket === undefined) { // Loading state
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full mt-6" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Ticket Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The ticket with ID "{ticketId}" could not be found.
        </p>
        <button
          onClick={() => router.push("/dashboard/tickets")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Back to Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <TicketDetailClient initialTicket={ticket} onUpdateTicket={handleUpdateTicket} />
    </div>
  );
}
