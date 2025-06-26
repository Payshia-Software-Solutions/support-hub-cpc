
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getAnnouncements } from "@/lib/api";
import type { Announcement } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryColors: Record<NonNullable<Announcement['category']>, string> = {
  General: "bg-blue-500",
  Academic: "bg-green-500",
  Events: "bg-purple-500",
  Urgent: "bg-red-500",
};

export default function AdminAnnouncementsPage() {
  const { data: announcements, isLoading, isError, error } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: getAnnouncements,
  });

  const sortedAnnouncements = announcements?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-semibold">Announcements</h1>
          <p className="text-muted-foreground">Manage and publish announcements for students.</p>
        </div>
        <Button asChild>
          <Link href="/admin/announcements/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New
          </Link>
        </Button>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Published Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          )}
          {isError && (
            <p className="text-destructive text-center">Error: {error.message}</p>
          )}
          {!isLoading && !isError && (
            <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Seen Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAnnouncements.length > 0 ? sortedAnnouncements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium">{announcement.title}</TableCell>
                    <TableCell>
                      {announcement.category && (
                        <Badge className={cn("text-white", categoryColors[announcement.category])}>
                          {announcement.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(announcement.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            {announcement.seenCount || 0}
                        </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">No announcements found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
