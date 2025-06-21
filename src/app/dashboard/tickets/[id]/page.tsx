
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
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  // Use a single source of truth for the tickets state on this page instance.
  // Deep copy to prevent mutations from affecting other parts of the app unexpectedly.
  const [tickets, setTickets] = useState<Ticket[]>(() => JSON.parse(JSON.stringify(initialDummyTickets)));
  const { setIsMobileDetailActive } = useMobileDetailActive();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isMobile) {
      setIsMobileDetailActive(true);
      return () => {
        setIsMobileDetailActive(false);
      };
    } else {
      setIsMobileDetailActive(false);
    }
  }, [isMobile, setIsMobileDetailActive]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 150); // Small delay to prevent flash of loading skeleton
    return () => clearTimeout(timer);
  }, [ticketId]);


  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets(prevTickets => 
      prevTickets.map(t => t.id === updatedTicket.id ? updatedTicket : t)
    );
    // Note: in a real app, this would be an API call. Here we also mutate the global
    // dummy data so that changes can be seen on other pages without a full state management solution.
     const globalTicketIndex = initialDummyTickets.findIndex(t => t.id === updatedTicket.id);
    if (globalTicketIndex !== -1) {
      initialDummyTickets[globalTicketIndex] = updatedTicket;
    }
  };

  const ticket = tickets.find((t) => t.id === ticketId);

  if (isLoading) { 
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
    <div className="h-full flex flex-col overflow-hidden w-full">
      {isMobile && (
        <div className="px-4 py-2 border-b bg-card sticky top-0 z-20">
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
      <TicketDetailClient 
        initialTicket={ticket} 
        onUpdateTicket={handleUpdateTicket} 
        userRole="student" // Specify user role
        staffAvatar={ticket.studentAvatar} // For student, staffAvatar prop is not strictly needed but pass student's own for consistency if message.avatar logic relies on it
      />
    </div>
  );
}
