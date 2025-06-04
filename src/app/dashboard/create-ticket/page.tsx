"use client";

import { useState } from "react";
import { TicketForm } from "@/components/dashboard/TicketForm";
import { dummyTickets as initialDummyTickets } from "@/lib/dummy-data";
import type { Ticket } from "@/lib/types";
import { useRouter } from "next/navigation";


export default function CreateTicketPage() {
  const [tickets, setTickets] = useState<Ticket[]>(initialDummyTickets);
  const router = useRouter();

  const handleTicketSubmit = (newTicket: Ticket) => {
    // In a real app, this would be an API call.
    // For now, we're just updating local state (which won't persist across page loads without more complex state management)
    // and logging to console. The form itself handles its own toast.
    const updatedTickets = [...tickets, newTicket];
    setTickets(updatedTickets); 
    // Optionally, you could update a global store or context here.
    // For this example, the primary effect is logging and the toast from the form.
    console.log("All tickets after submission:", updatedTickets);

    // Redirect to the new ticket's detail page or the ticket list
    // router.push(`/dashboard/tickets/${newTicket.id}`);
    router.push("/dashboard/tickets"); // Or redirect to list
  };

  return (
    <div className="p-4 md:p-8 flex justify-center items-start min-h-full bg-muted/30 overflow-y-auto">
      <TicketForm onSubmitTicket={handleTicketSubmit} />
    </div>
  );
}
