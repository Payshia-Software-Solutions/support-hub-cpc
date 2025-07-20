
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Search } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Recording } from "@/lib/types";
import { dummyCourses } from "@/lib/dummy-data";

// Dummy data for recordings, replace with API call
const dummyRecordings: Recording[] = [
  { id: 'rec1', courseId: 'course1', title: 'Introduction to Pharmacy', description: 'Session 1: A basic overview of the field.', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnailUrl: 'https://placehold.co/600x400.png', dataAiHint: 'lecture presentation' },
  { id: 'rec2', courseId: 'course1', title: 'Pharmacokinetics', description: 'Session 2: Understanding how drugs move through the body.', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnailUrl: 'https://placehold.co/600x400.png', dataAiHint: 'molecular structure' },
  { id: 'rec3', courseId: 'course2', title: 'Advanced Compounding', description: 'Session 1: Techniques for complex preparations.', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnailUrl: 'https://placehold.co/600x400.png', dataAiHint: 'chemistry lab' },
  { id: 'rec4', courseId: 'course3', title: 'Vitamins and Minerals', description: 'Session 1: The role of key micronutrients.', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnailUrl: 'https://placehold.co/600x400.png', dataAiHint: 'fruits vegetables' },
  { id: 'rec5', courseId: 'course1', title: 'Drug Interactions', description: 'Session 3: Common and dangerous drug interactions.', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnailUrl: 'https://placehold.co/600x400.png', dataAiHint: 'medical chart' },
];

export default function CourseRecordingsPage() {
  const [selectedCourse, setSelectedCourse] = useState(dummyCourses[0].id);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecordings = dummyRecordings.filter(rec => 
    rec.courseId === selectedCourse && 
    rec.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-headline font-semibold">Course Recordings</h1>
        <p className="text-muted-foreground">Access recorded lectures and materials for your enrolled courses.</p>
      </header>

      <Card className="shadow-lg">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {dummyCourses.map(course => (
                <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search recordings..." 
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecordings.length > 0 ? filteredRecordings.map((rec) => (
          <Card key={rec.id} className="shadow-lg hover:shadow-xl transition-all flex flex-col group">
            <CardHeader className="p-0">
              <a href={rec.youtubeUrl} target="_blank" rel="noopener noreferrer" className="block relative aspect-video">
                <Image
                  src={rec.thumbnailUrl}
                  alt={`Thumbnail for ${rec.title}`}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-t-lg"
                  data-ai-hint={rec.dataAiHint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="w-16 h-16 text-white/80"/>
                </div>
              </a>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <CardTitle className="text-base font-bold">{rec.title}</CardTitle>
              <CardDescription className="text-sm mt-1 line-clamp-2">{rec.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-4">
              <Button asChild className="w-full">
                <a href={rec.youtubeUrl} target="_blank" rel="noopener noreferrer">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Watch Video
                </a>
              </Button>
            </CardFooter>
          </Card>
        )) : (
          <p className="text-muted-foreground md:col-span-3 text-center py-10">
            No recordings found for this course or search term.
          </p>
        )}
      </div>
    </div>
  );
}
