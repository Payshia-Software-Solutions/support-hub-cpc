"use client";

import { TicketList } from "@/components/dashboard/TicketList";
import { dummyTickets } from "@/lib/dummy-data";

export default function TicketsPage() {
  // In a real app, you'd fetch this data
  const tickets = dummyTickets;

  return (
    <div className="h-full overflow-y-auto">
      <TicketList tickets={tickets} />
    </div>
  );
}
