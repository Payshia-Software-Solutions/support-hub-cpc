
import { NextResponse } from 'next/server';
import { bnfChapters, allPages, wordIndexData } from '@/lib/bnf-data';

export async function GET() {
  // In a real app, this data would come from a database.
  // Here, we're just returning the data imported from our mock data file.
  return NextResponse.json({
    chapters: bnfChapters,
    pages: allPages,
    index: wordIndexData,
  });
}
