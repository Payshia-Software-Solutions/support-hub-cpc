
"use client";

import { TicketList } from "@/components/dashboard/TicketList";
import { dummyTickets } from "@/lib/dummy-data";

export default function AdminTicketsPage() {
  // For admin, all tickets are relevant
  const tickets = dummyTickets;

  return (
    <div className="h-full overflow-y-auto w-full">
      <TicketList tickets={tickets} />
    </div>
  );
}
