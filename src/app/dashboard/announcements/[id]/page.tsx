
"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAnnouncement, markAnnouncementAsRead } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Announcement } from '@/lib/types';
import { cn } from '@/lib/utils';

const categoryColors: Record<NonNullable<Announcement['category']>, string> = {
  General: "bg-blue-500",
  Academic: "bg-green-500",
  Events: "bg-purple-500",
  Urgent: "bg-red-500",
};

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const announcementId = params.id as string;
  const { setIsMobileDetailActive } = useMobileDetailActive();
  const isMobile = useIsMobile();

  const { data: announcement, isLoading, isError, error } = useQuery<Announcement>({
    queryKey: ['announcement', announcementId],
    queryFn: () => getAnnouncement(announcementId),
    enabled: !!announcementId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (vars: { announcementId: string, studentId: string }) => 
      markAnnouncementAsRead(vars.announcementId, vars.studentId),
  });

  useEffect(() => {
    if (isMobile) {
      setIsMobileDetailActive(true);
      return () => setIsMobileDetailActive(false);
    }
  }, [isMobile, setIsMobileDetailActive]);

  useEffect(() => {
    if (announcementId && user?.id) {
      markAsReadMutation.mutate({ announcementId, studentId: user.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcementId, user?.id]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="pt-6 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-8 text-center">
        <p className="text-destructive">Error: {error?.message}</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }
  
  if (!announcement) {
    return (
      <div className="p-4 md:p-8 text-center">
        <p>Announcement not found.</p>
         <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20 h-full overflow-y-auto">
       {isMobile && (
          <Button onClick={() => router.back()} variant="ghost" className="mb-4 -ml-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Announcements
          </Button>
       )}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-2xl md:text-3xl font-headline">{announcement.title}</CardTitle>
            {announcement.category && (
              <Badge className={cn("text-white whitespace-nowrap", categoryColors[announcement.category])}>
                {announcement.category}
              </Badge>
            )}
          </div>
          <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm pt-2">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(announcement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {announcement.author && <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {announcement.author}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-base text-card-foreground whitespace-pre-line">
          {announcement.content}
        </CardContent>
         <CardFooter>
             <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> All Announcements
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
