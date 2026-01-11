
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ManageAnswersPage() {
    const router = useRouter();
    
    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button variant="ghost" onClick={() => router.push('/admin/manage/games/medimind')} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to MediMind Setup
                </Button>
                 <h1 className="text-3xl font-headline font-semibold mt-2">Manage Answer Options</h1>
                <p className="text-muted-foreground">This feature is under construction.</p>
            </header>
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Answer Option Management</CardTitle>
                    <CardDescription>A form to manage the pool of possible answers for questions will be here. You will also be able to set the correct answer for a specific medicine and question pairing.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Coming soon...</p>
                </CardContent>
            </Card>
        </div>
    );
}
