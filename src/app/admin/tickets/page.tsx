
"use client";

import { TicketList } from "@/components/dashboard/TicketList";
import { dummyTickets, dummyStaffMembers } from "@/lib/dummy-data";

// Simulate current staff user - In a real app, this would come from auth
const CURRENT_STAFF_ID = dummyStaffMembers[0]?.id || 'staff1'; 

export default function AdminTicketsPage() {
  // For admin, all tickets are relevant. The dummyTickets array is mutated by TicketDetailClient for locks.
  const tickets = dummyTickets; 

  return (
    <div className="h-full overflow-y-auto w-full">
      <TicketList tickets={tickets} currentStaffId={CURRENT_STAFF_ID} />
    </div>
  );
}
