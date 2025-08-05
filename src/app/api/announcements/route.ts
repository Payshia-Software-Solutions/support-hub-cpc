
import { NextResponse } from 'next/server';
import type { Announcement } from '@/lib/types';

// In-memory store for announcements (replace with a database in a real app)
let announcements: Announcement[] = [
    {
        id: '1',
        title: 'Welcome to the New Student Portal!',
        content: 'We are excited to launch our new student portal. Explore the features and let us know if you have any feedback.',
        author: 'Admin Team',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        imageUrl: 'https://placehold.co/800x400.png',
    },
    {
        id: '2',
        title: 'Scheduled Maintenance on Sunday',
        content: 'The portal will be temporarily unavailable on Sunday from 2 AM to 4 AM for scheduled maintenance. We apologize for any inconvenience.',
        author: 'IT Department',
        createdAt: new Date().toISOString(),
    }
];
let nextId = 3;

// GET all announcements
export async function GET() {
  return NextResponse.json(announcements);
}

// POST a new announcement
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, author, imageUrl } = body;

    if (!title || !content || !author) {
      return NextResponse.json({ message: 'Title, content, and author are required' }, { status: 400 });
    }

    const newAnnouncement: Announcement = {
      id: String(nextId++),
      title,
      content,
      author,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    announcements.push(newAnnouncement);

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}
