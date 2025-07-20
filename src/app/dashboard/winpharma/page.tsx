
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WinPharmaIcon } from "@/components/icons/module-icons";

export default function WinPharmaPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 pb-20 flex items-center justify-center min-h-full">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <WinPharmaIcon className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="mt-4">WinPharma</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This page is under construction. The WinPharma game will be available here soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
