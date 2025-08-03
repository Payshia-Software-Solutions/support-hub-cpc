
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export default function AnnouncementsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 pb-20 flex items-center justify-center min-h-full">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <Megaphone className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="mt-4">Announcements</CardTitle>
          <CardDescription>Important updates and news from the administration.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This page is under construction. Announcements will be shown here soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
