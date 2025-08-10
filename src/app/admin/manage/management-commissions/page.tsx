
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function ManagementCommissionsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 pb-20 flex items-center justify-center min-h-full">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <Briefcase className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="mt-4">Management Commissions</CardTitle>
           <CardDescription>This page is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The functionality to define task-based management commissions will be available here soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
