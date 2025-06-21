import { NextResponse } from 'next/server';
import { dummyTickets } from '@/lib/dummy-data';
import type { Ticket } from '@/lib/types';

// Important: dummyTickets is mutable and acts as our in-memory "database"
// In a real app, you would use a proper database like PostgreSQL, MySQL, or a NoSQL DB.

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ticketId = params.id;
  const ticket = dummyTickets.find((t) => t.id === ticketId);

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  return NextResponse.json(ticket);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ticketId = params.id;
  const updatedTicketData: Ticket = await request.json();

  const ticketIndex = dummyTickets.findIndex((t) => t.id === ticketId);

  if (ticketIndex === -1) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  // Validate that the ID in the body matches the URL param
  if (updatedTicketData.id !== ticketId) {
    return NextResponse.json({ error: 'Mismatched ticket ID' }, { status: 400 });
  }

  // Update the ticket in our in-memory array
  dummyTickets[ticketIndex] = updatedTicketData;

  return NextResponse.json(dummyTickets[ticketIndex]);
}
