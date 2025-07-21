
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { WinPharmaIcon } from "@/components/icons/module-icons";
import { CheckCircle, Lock, Video, FileQuestion, Upload, Timer, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";


// --- Mock Data Structure for the Game ---
interface Task {
  id: string;
  title: string;
  type: 'video' | 'quiz';
  duration?: string; // For quiz, e.g., "30 Minutes"
}

interface Level {
  id: number;
  title: string;
  tasks: Task[];
}

const generateLevels = (): Level[] => {
  const levels = [];
  for (let i = 1; i <= 20; i++) {
    const taskCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 tasks per level
    const tasks: Task[] = [];
    for (let j = 1; j <= taskCount; j++) {
      if (j === taskCount) {
        tasks.push({
          id: `l${i}t${j}`,
          title: `Level ${i} Assessment`,
          type: 'quiz',
          duration: `${Math.floor(Math.random() * 30) + 15} Minutes`,
        });
      } else {
        tasks.push({
          id: `l${i}t${j}`,
          title: `Watch Topic ${i}.${j}`,
          type: 'video',
        });
      }
    }
    levels.push({ id: i, title: `Level ${i}: Introduction to Topic ${i}`, tasks });
  }
  return levels;
};

// --- Main Page Component ---
export default function WinPharmaPage() {
  const [levels] = useState<Level[]>(generateLevels());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set(['l1t1'])); // Start with first task of first level completed
  const [activeAccordion, setActiveAccordion] = useState<string>("level-1");

  const completedLevelCount = useMemo(() => {
    return levels.filter(level => level.tasks.every(task => completedTasks.has(task.id))).length;
  }, [levels, completedTasks]);

  const progressPercentage = (completedLevelCount / levels.length) * 100;

  const handleCompleteTask = (taskId: string, levelId: number) => {
    const newCompletedTasks = new Set(completedTasks);
    newCompletedTasks.add(taskId);
    setCompletedTasks(newCompletedTasks);
    
    toast({
        title: "Task Completed!",
        description: `You've successfully completed the task.`,
    })

    // Auto-open next level if current one is finished
    const currentLevel = levels.find(l => l.id === levelId);
    const nextLevel = levels.find(l => l.id === levelId + 1);
    if(currentLevel && nextLevel && currentLevel.tasks.every(t => newCompletedTasks.has(t.id))) {
        setActiveAccordion(`level-${nextLevel.id}`);
    }
  };
  
  const isLevelUnlocked = (levelId: number): boolean => {
    if (levelId === 1) return true;
    const prevLevel = levels.find(l => l.id === levelId - 1);
    if (!prevLevel) return false;
    return prevLevel.tasks.every(task => completedTasks.has(task.id));
  };
  
  const isTaskUnlocked = (levelId: number, taskId: string): boolean => {
    if (!isLevelUnlocked(levelId)) return false;
    const level = levels.find(l => l.id === levelId);
    if (!level) return false;
    const taskIndex = level.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === 0) return true;
    const prevTask = level.tasks[taskIndex - 1];
    return completedTasks.has(prevTask.id);
  }

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg w-fit">
            <WinPharmaIcon className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-semibold">WinPharma Challenge</h1>
            <p className="text-muted-foreground">Complete all levels to earn your reward!</p>
          </div>
        </div>
        <Card className="p-4 w-full md:w-auto md:min-w-[250px] shadow-lg">
            <div className="flex justify-between items-center mb-1">
                 <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                 <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <Progress value={progressPercentage} className="h-2" indicatorClassName="bg-gradient-to-r from-green-400 to-blue-500" />
            <p className="text-xs text-muted-foreground mt-1 text-right">{completedLevelCount} of {levels.length} levels completed</p>
        </Card>
      </header>

       {progressPercentage === 100 && (
            <Alert className="bg-green-100 border-green-500 text-green-900">
                <Trophy className="h-4 w-4 !text-green-900" />
                <AlertTitle className="font-bold">Congratulations!</AlertTitle>
                <AlertDescription>
                    You have successfully completed all levels of the WinPharma Challenge.
                </AlertDescription>
            </Alert>
       )}

      <Accordion type="single" collapsible className="w-full space-y-4" value={activeAccordion} onValueChange={setActiveAccordion}>
        {levels.map((level) => {
            const unlocked = isLevelUnlocked(level.id);
            const levelCompleted = level.tasks.every(task => completedTasks.has(task.id));
            return (
                <Card key={level.id} className={cn("shadow-lg transition-all", !unlocked && "bg-muted/50 opacity-70")}>
                    <AccordionItem value={`level-${level.id}`} className="border-b-0">
                         <AccordionTrigger disabled={!unlocked} className="p-4 hover:no-underline">
                            <div className="flex items-center gap-4 w-full">
                                {unlocked ? (
                                    levelCompleted ? (
                                        <CheckCircle className="w-8 h-8 text-green-500 shrink-0"/>
                                    ) : (
                                        <span className="flex items-center justify-center w-8 h-8 text-lg font-bold rounded-full bg-primary text-primary-foreground shrink-0">{level.id}</span>
                                    )
                                ) : (
                                     <Lock className="w-8 h-8 text-muted-foreground p-1 shrink-0" />
                                )}
                                <div className="text-left">
                                    <h3 className="font-semibold text-card-foreground">{level.title}</h3>
                                    <p className="text-sm text-muted-foreground">{level.tasks.length} tasks</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="p-4 pt-0 space-y-3">
                                {level.tasks.map((task) => {
                                    const taskUnlocked = isTaskUnlocked(level.id, task.id);
                                    const taskCompleted = completedTasks.has(task.id);

                                    return (
                                        <div key={task.id} className={cn(
                                            "p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all",
                                            !taskUnlocked && "bg-muted/30 opacity-60",
                                            taskCompleted && "bg-green-500/10 border-green-500/30"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                {taskUnlocked ? (
                                                    taskCompleted ? (
                                                        <CheckCircle className="w-6 h-6 text-green-500 shrink-0"/>
                                                    ) : (
                                                        task.type === 'video' ? <Video className="w-6 h-6 text-primary shrink-0"/> : <FileQuestion className="w-6 h-6 text-primary shrink-0"/>
                                                    )
                                                ) : (
                                                     <Lock className="w-6 h-6 text-muted-foreground shrink-0"/>
                                                )}
                                                 <div className="flex-1">
                                                    <p className="font-medium text-card-foreground">{task.title}</p>
                                                    {task.type === 'quiz' && task.duration && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Timer className="w-3 h-3"/> {task.duration}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-end md:self-center">
                                                {task.type === 'video' && (
                                                    <Button disabled={!taskUnlocked || taskCompleted} onClick={() => handleCompleteTask(task.id, level.id)}>Watch Video</Button>
                                                )}
                                                 {task.type === 'quiz' && (
                                                    <>
                                                        <Button variant="outline" disabled={!taskUnlocked || taskCompleted}><Upload className="mr-2 h-4 w-4"/> Upload</Button>
                                                        <Button disabled={!taskUnlocked || taskCompleted} onClick={() => handleCompleteTask(task.id, level.id)}>Start Quiz</Button>
                                                    </>
                                                )}
                                                {!taskUnlocked && <Badge variant="secondary">Locked</Badge>}
                                                {taskCompleted && <Badge variant="default" className="bg-green-600 hover:bg-green-700">Completed</Badge>}
                                            </div>
                                        </div>
                                    )
                                })}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
            )
        })}
      </Accordion>
    </div>
  );
}
