
"use client";

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import type { Recording } from '@/lib/types';
import { dummyRecordings } from '@/lib/dummy-data'; // Using dummy data for now

// Helper function to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return videoId;
      }
    }
  } catch (error) {
    console.error("Invalid URL for YouTube video", error);
  }
  return null;
};


export default function RecordingPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const recordingId = params.id as string;

  // In a real app, this would be a useQuery hook to fetch data
  const recording = dummyRecordings.find(rec => rec.id === recordingId);
  const videoId = recording ? getYouTubeVideoId(recording.youtubeUrl) : null;

  if (!recording) {
    return (
      <div className="p-4 md:p-8 text-center">
        <h1 className="text-2xl font-bold">Recording Not Found</h1>
        <p className="text-muted-foreground mt-2">The video you are looking for does not exist.</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
      <header>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Recordings
        </Button>
      </header>

      <Card className="shadow-lg overflow-hidden">
        <div className="aspect-video bg-black">
          {videoId ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={recording.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-muted">
                <p className="text-destructive">Could not load video. Invalid YouTube URL.</p>
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{recording.title}</CardTitle>
          <CardDescription>{recording.description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

