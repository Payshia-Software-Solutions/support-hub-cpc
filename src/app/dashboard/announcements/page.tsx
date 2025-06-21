
"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnnouncements } from "@/contexts/AnnouncementsContext";
import type { Announcement } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const categoryColors: Record<NonNullable<Announcement['category']>, string> = {
  General: "bg-blue-500 hover:bg-blue-600",
  Academic: "bg-green-500 hover:bg-green-600",
  Events: "bg-purple-500 hover:bg-purple-600",
  Urgent: "bg-red-500 hover:bg-red-600",
};

export default function AnnouncementsPage() {
  const { announcements, isLoading, isError, error, markAnnouncementsAsRead } = useAnnouncements();

  useEffect(() => {
    markAnnouncementsAsRead();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const sortedAnnouncements = announcements ? [...announcements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  return (
    <div className="p-0 md:p-6 space-y-6 h-full overflow-y-auto">
      <div className="p-4 md:p-0">
        <h1 className="text-2xl md:text-3xl font-headline font-semibold">Announcements</h1>
      </div>
      
      {isLoading && (
        <div className="grid gap-6 px-4 md:px-0 pb-4 md:pb-0">
          {[...Array(3)].map((_, i) => (
             <Card key={i} className="shadow-md">
               <CardHeader>
                 <Skeleton className="h-6 w-3/4" />
                 <Skeleton className="h-4 w-1/2 mt-2" />
               </CardHeader>
               <CardContent>
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-full mt-2" />
                 <Skeleton className="h-4 w-2/3 mt-2" />
               </CardContent>
             </Card>
          ))}
        </div>
      )}

      {isError && (
         <div className="flex items-center justify-center h-full">
            <p className="text-destructive p-4">Error: {error.message}</p>
        </div>
      )}

      {!isLoading && !isError && sortedAnnouncements.length > 0 ? (
        <div className="grid gap-6 px-4 md:px-0 pb-4 md:pb-0">
          {sortedAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="shadow-md hover:shadow-lg transition-shadow bg-card">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center">
                    <CardTitle className="text-lg md:text-xl">{announcement.title}</CardTitle>
                    {announcement.isNew && (
                      <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5">New</Badge>
                    )}
                  </div>
                  {announcement.category && (
                    <Badge 
                      className={cn(
                        "text-xs text-white whitespace-nowrap shrink-0",
                        categoryColors[announcement.category]
                      )}
                    >
                      {announcement.category}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  Posted on: {new Date(announcement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  {announcement.author && ` by ${announcement.author}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-card-foreground whitespace-pre-line">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !isLoading && !isError && <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground p-4">No announcements at this time.</p>
        </div>
      )}
    </div>
  );
}
