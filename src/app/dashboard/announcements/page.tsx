
"use client";

import { useQuery } from '@tanstack/react-query';
import { getAnnouncements } from '@/lib/actions/announcements';
import type { Announcement } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Megaphone, AlertTriangle, FileText } from "lucide-react";
import Image from 'next/image';

export default function AnnouncementsPage() {
  const { data: announcements, isLoading, isError, error } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: getAnnouncements,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full">
           <Megaphone className="w-8 h-8 text-primary" />
        </div>
        <div>
           <h1 className="text-3xl font-headline font-semibold">Announcements</h1>
           <p className="text-muted-foreground">Important updates and news from the administration.</p>
        </div>
      </header>

      <div className="space-y-6 max-w-4xl mx-auto">
        {isLoading && (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </>
        )}
        {isError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Announcements</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        {!isLoading && !isError && announcements && (
          announcements.length > 0 ? (
            announcements.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(announcement => (
              <Card key={announcement.id} className="shadow-lg overflow-hidden">
                {announcement.imageUrl && (
                  <div className="relative aspect-[16/7] bg-muted">
                    <Image 
                      src={announcement.imageUrl}
                      alt={announcement.title}
                      layout="fill"
                      objectFit="cover"
                      data-ai-hint="announcement banner"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl font-bold">{announcement.title}</CardTitle>
                  <CardDescription className="text-xs">
                    Posted by {announcement.author} &bull; {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/90 whitespace-pre-wrap">{announcement.content}</p>
                </CardContent>
              </Card>
            ))
          ) : (
             <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                <FileText className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold">No Announcements Yet</h3>
                <p>Check back later for important updates.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
