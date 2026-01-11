
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, ArrowLeft, ChevronRight } from "lucide-react";
import { mediMindGameData } from '@/lib/medimind-data';

export default function MediMindLevelsPage() {
    const router = useRouter();
    const levels = mediMindGameData.levels;

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button onClick={() => router.back()} variant="ghost" className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games
                </Button>
                <CardTitle className="text-3xl font-headline mt-2">MediMind Challenge</CardTitle>
                <CardDescription>Select a level to begin.</CardDescription>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {levels.map((level) => (
                    <button key={level.id} onClick={() => router.push(`/dashboard/medimind/${level.id}`)} className="group block h-full text-left">
                        <Card className="shadow-md hover:shadow-lg hover:border-primary transition-all h-full">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base group-hover:text-primary">{level.title}</CardTitle>
                                    <CardDescription className="text-xs">{level.items.length} medicines</CardDescription>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                            </CardHeader>
                        </Card>
                    </button>
                ))}
            </div>
        </div>
    );
}
