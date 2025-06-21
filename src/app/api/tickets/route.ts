import { NextResponse } from 'next/server';
import { dummyTickets } from '@/lib/dummy-data';

export async function GET() {
  // In a real app, you'd fetch this from a database.
  // We'll add a small delay to simulate network latency.
  await new Promise(resolve => setTimeout(resolve, 500)); 
  return NextResponse.json(dummyTickets);
}
