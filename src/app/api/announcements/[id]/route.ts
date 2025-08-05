
import { NextResponse } from 'next/server';
import type { Announcement } from '@/lib/types';

// This is a placeholder for where the data is stored. In a real app, this would be a database.
let announcements: Announcement[] = [
    {
        id: '1',
        title: 'Welcome to the New Student Portal!',
        content: 'We are excited to launch our new student portal. Explore the features and let us know if you have any feedback.',
        author: 'Admin Team',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
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

// GET a single announcement
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const announcement = announcements.find(a => a.id === params.id);
  if (announcement) {
    return NextResponse.json(announcement);
  }
  return NextResponse.json({ message: 'Announcement not found' }, { status: 404 });
}

// PUT (update) an announcement
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const index = announcements.findIndex(a => a.id === params.id);
  if (index === -1) {
    return NextResponse.json({ message: 'Announcement not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { title, content, author, imageUrl } = body;

    const updatedAnnouncement = { ...announcements[index] };
    if (title) updatedAnnouncement.title = title;
    if (content) updatedAnnouncement.content = content;
    if (author) updatedAnnouncement.author = author;
    if (imageUrl !== undefined) updatedAnnouncement.imageUrl = imageUrl;
    
    announcements[index] = updatedAnnouncement;

    return NextResponse.json(updatedAnnouncement);
  } catch (error) {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE an announcement
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const index = announcements.findIndex(a => a.id === params.id);
  if (index === -1) {
    return NextResponse.json({ message: 'Announcement not found' }, { status: 404 });
  }

  announcements.splice(index, 1);

  return new NextResponse(null, { status: 204 }); // No Content
}
