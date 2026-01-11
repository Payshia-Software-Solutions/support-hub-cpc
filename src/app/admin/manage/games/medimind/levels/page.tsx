
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ManageLevelsPage() {
    const router = useRouter();
    
    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button variant="ghost" onClick={() => router.push('/admin/manage/games/medimind')} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to MediMind Setup
                </Button>
                 <h1 className="text-3xl font-headline font-semibold mt-2">Manage Game Levels</h1>
                <p className="text-muted-foreground">This feature is under construction.</p>
            </header>
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Level Management</CardTitle>
                    <CardDescription>A form to add levels with a name and description will be here, along with functionality to add items and questions to each level.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Coming soon...</p>
                </CardContent>
            </Card>
        </div>
    );
}
