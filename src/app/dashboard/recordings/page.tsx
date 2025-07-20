
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, PlayCircle } from "lucide-react";
import Image from "next/image";

// Dummy data for courses, replace with API call in the future
const dummyCourses = [
  {
    id: "course1",
    name: "Certificate Course in Pharmacy Practice",
    thumbnailUrl: "https://placehold.co/600x400.png",
    dataAiHint: "pharmacy lab",
    recordingsCount: 12,
  },
  {
    id: "course2",
    name: "Advanced Course in Pharmacy Practice",
    thumbnailUrl: "https://placehold.co/600x400.png",
    dataAiHint: "lecture hall",
    recordingsCount: 24,
  },
  {
    id: "course3",
    name: "Diploma in Nutrition",
    thumbnailUrl: "https://placehold.co/600x400.png",
    dataAiHint: "healthy food",
    recordingsCount: 8,
  },
];

export default function CourseRecordingsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Course Recordings</h1>
        <p className="text-muted-foreground">Access recorded lectures and materials for your enrolled courses.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyCourses.map((course) => (
          <Card key={course.id} className="shadow-lg hover:shadow-xl transition-all flex flex-col">
            <CardHeader className="p-0">
                <div className="relative aspect-video">
                    <Image
                        src={course.thumbnailUrl}
                        alt={`Thumbnail for ${course.name}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-t-lg"
                        data-ai-hint={course.dataAiHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                         <CardTitle className="text-lg font-bold text-primary-foreground">{course.name}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <div className="flex items-center text-muted-foreground text-sm">
                <Video className="w-4 h-4 mr-2" />
                <span>{course.recordingsCount} recordings available</span>
              </div>
            </CardContent>
            <CardFooter className="p-4">
              <Button className="w-full">
                <PlayCircle className="w-5 h-5 mr-2" />
                View Recordings
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
