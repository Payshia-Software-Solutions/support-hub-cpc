
"use client";

import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, ArrowLeft, ChevronRight, CheckCircle } from "lucide-react";
import { mediMindGameData } from '@/lib/medimind-data';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export default function MediMindModulesPage() {
  const router = useRouter();
  const params = useParams();
  const levelId = params.levelId as string;

  const activeLevel = mediMindGameData.levels.find(l => l.id === levelId);

  // This would come from a context or API in a real app
  const completedModules = useMemo(() => {
    // Dummy logic: let's say a few are completed for demonstration
    const completed = new Set<string>();
    if (levelId === '1') {
        completed.add('1'); // ID of Paracetamol
    }
    return completed;
  }, [levelId]);

  if (!activeLevel) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-semibold">Level not found.</h1>
        <Button onClick={() => router.push('/dashboard/medimind')} className="mt-4">Back to Levels</Button>
      </div>
    );
  }

  const levelModules = activeLevel.items
    .map(itemId => mediMindGameData.medicine_data.find(m => m.id === itemId))
    .filter(Boolean);

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
      <header>
        <Button variant="ghost" onClick={() => router.push('/dashboard/medimind')} className="-ml-4 h-auto p-1 mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Levels
        </Button>
        <CardTitle className="text-2xl font-headline">{activeLevel.title}</CardTitle>
        <CardDescription>Select a medicine to begin the quiz.</CardDescription>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {levelModules.map((module) => {
          if (!module) return null;
          const isCompleted = completedModules.has(module.id);
          return (
            <button key={module.id} onClick={() => router.push(`/dashboard/medimind/${levelId}/${module.id}`)} className="group block h-full text-left" disabled={isCompleted}>
              <Card className={cn("shadow-md h-full", isCompleted ? "bg-muted/50 opacity-70" : "hover:shadow-lg hover:border-primary/50 transition-all")}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Pill className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-card-foreground">{module.name}</span>
                  </div>
                  {isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />}
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>
    </div>
  );
}
