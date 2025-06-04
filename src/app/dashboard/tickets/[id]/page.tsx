
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TicketDetailClient } from "@/components/dashboard/TicketDetailClient";
import { dummyTickets as initialDummyTickets } from "@/lib/dummy-data";
import type { Ticket } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [tickets, setTickets] = useState<Ticket[]>(initialDummyTickets);
  const [ticket, setTicket] = useState<Ticket | null | undefined>(undefined); 
  const isMobile = useIsMobile();

  useEffect(() => {
    const foundTicket = tickets.find((t) => t.id === ticketId);
    setTicket(foundTicket || null);
  }, [ticketId, tickets]);

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets(prevTickets => 
      prevTickets.map(t => t.id === updatedTicket.id ? updatedTicket : t)
    );
  };

  if (ticket === undefined) { 
    return (
      <div className="p-4 md:p-6 space-y-4">
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
      <div className="flex flex-col items-center justify-center h-full p-4 md:p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Ticket Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The ticket with ID "{ticketId}" could not be found.
        </p>
        <Button
          onClick={() => router.push("/dashboard/tickets")}
          variant="default"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {isMobile && (
        <div className="px-4 py-2 border-b bg-card sticky top-0 z-20"> {/* Higher z-index for mobile header */}
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/tickets")}
            className="text-sm w-full justify-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets List
          </Button>
        </div>
      )}
      <TicketDetailClient initialTicket={ticket} onUpdateTicket={handleUpdateTicket} />
    </div>
  );
}

