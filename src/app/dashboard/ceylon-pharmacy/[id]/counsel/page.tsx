
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CounselPage() {
    const router = useRouter();

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
             <header>
                <Button onClick={() => router.back()} variant="ghost" className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Hub
                </Button>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Task 2: Patient Counselling</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This task is under construction.</p>
                </CardContent>
            </Card>
        </div>
    );
}
