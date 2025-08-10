
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManagementCommissionsPage() {
  // This page is now effectively deprecated in favor of the tabbed view.
  // We can leave it as a simple placeholder or redirect, but for now, this is fine.
  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Page Moved</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Management Commissions are now handled under the main "Commissions Management" page.</p>
        </CardContent>
      </Card>
    </div>
  );
}

    