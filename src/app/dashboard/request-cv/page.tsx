
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function RequestCvPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 pb-20 flex items-center justify-center min-h-full">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <FileText className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="mt-4">Request CV</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This page is under construction. You will be able to create and edit your professional CV here soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
