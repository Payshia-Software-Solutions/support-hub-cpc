
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, PlusCircle } from "lucide-react";

export default function AdminAnnouncementsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
       <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-semibold">Manage Announcements</h1>
          <p className="text-muted-foreground">Create, edit, and publish announcements for all students.</p>
        </div>
        <Button disabled>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New
        </Button>
      </header>

      <div className="flex items-center justify-center min-h-[40vh] border-2 border-dashed rounded-lg">
        <Card className="w-full max-w-lg text-center shadow-none border-0">
            <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <Megaphone className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="mt-4">Under Construction</CardTitle>
            <CardDescription>The announcement management page will be available here soon.</CardDescription>
            </CardHeader>
        </Card>
      </div>
    </div>
  );
}
