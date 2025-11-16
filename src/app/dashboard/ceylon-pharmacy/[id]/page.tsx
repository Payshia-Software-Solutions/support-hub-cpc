
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, ArrowLeft, Pill, User, ClipboardList, BookOpen, MessageCircle, PlayCircle, Loader2 } from 'lucide-react';
import { getCeylonPharmacyPrescriptions, getPrescriptionDetails } from '@/lib/actions/games';
import type { GamePrescription, PrescriptionDetail } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const CountdownTimer = ({ initialTime, startTime, onTimeEnd, isPaused }: { initialTime: number, startTime: number | null, onTimeEnd: () => void, isPaused: boolean }) => {
    const calculateTimeLeft = useCallback(() => {
        if (!startTime) return initialTime;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        return Math.max(0, initialTime - elapsed);
    }, [startTime, initialTime]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

    useEffect(() => {
        if (isPaused || timeLeft <= 0 || !startTime) {
            if (timeLeft <= 0) onTimeEnd();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeEnd, isPaused, startTime, calculateTimeLeft]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isCritical = timeLeft < 60 && timeLeft > 0;

     return (
        <Badge variant={isCritical ? 'destructive' : 'default'} className={cn("text-lg", isCritical && "animate-pulse")}>
            <Clock className="mr-2 h-5 w-5" />
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </Badge>
    );
}

const TaskCard = ({ title, description, href, status, icon: Icon, subtasks }: { 
    title: string, 
    description: string, 
    href: string, 
    status: 'pending' | 'completed', 
    icon: React.ElementType,
    subtasks?: { id: string; name: string; href: string; completed: boolean; }[]
}) => {
    const isCompleted = status === 'completed';
    // A task is only truly disabled if it's completed AND it has no incomplete subtasks.
    const isParentLinkDisabled = isCompleted && !subtasks?.some(t => !t.completed);

    const firstIncompleteSubtaskHref = subtasks?.find(t => !t.completed)?.href;

    const content = (
         <Card className={cn("shadow-md transition-shadow", isParentLinkDisabled ? "" : "group-hover:shadow-lg group-hover:border-primary/50", isCompleted ? "bg-green-100 border-green-300" : "")}>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className='flex items-center gap-4'>
                    <Icon className={cn("w-8 h-8", isCompleted ? "text-green-600" : "text-primary")} />
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
                {isCompleted && <CheckCircle className="h-6 w-6 text-green-600" />}
            </CardHeader>
             {subtasks && (
                <CardContent className="space-y-2 pt-0 pl-10 pr-4 pb-4">
                    {subtasks.map(task => (
                        <Link key={task.id} href={task.completed ? '#' : task.href} className={cn("block rounded-md p-2 transition-colors", task.completed ? "bg-green-200/50 pointer-events-none" : "hover:bg-accent/50")}>
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Pill className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{task.name}</span>
                             </div>
                             {task.completed && <CheckCircle className="h-5 w-5 text-green-500" />}
                           </div>
                        </Link>
                    ))}
                </CardContent>
            )}
        </Card>
    );
    
    // For tasks with subtasks, the main link should go to the first incomplete subtask.
    const finalHref = firstIncompleteSubtaskHref || href;

    return (
        <Link href={isParentLinkDisabled ? '#' : finalHref} className={cn("block group", isParentLinkDisabled && "pointer-events-none")}>
            {content}
        </Link>
    );
};


// --- MAIN PAGE ---
export default function CeylonPharmacyPatientPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.id as string;
    
    const [completedDrugIds, setCompletedDrugIds] = useState<Set<string>>(new Set());
    const [treatmentStartTime, setTreatmentStartTime] = useState<number | null>(null);

    const { data: allPrescriptions, isLoading: isLoadingPrescriptions } = useQuery<GamePrescription[]>({
        queryKey: ['ceylonPharmacyPrescriptions'],
        queryFn: getCeylonPharmacyPrescriptions,
    });

    const patient = useMemo(() => {
        return allPrescriptions?.find(p => p.prescription_id === patientId);
    }, [allPrescriptions, patientId]);

    const { data: prescriptionDetails, isLoading: isLoadingDetails } = useQuery<PrescriptionDetail[]>({
        queryKey: ['prescriptionDetails', patientId],
        queryFn: () => getPrescriptionDetails(patientId),
        enabled: !!patient,
    });


    useEffect(() => {
        if (!isLoadingPrescriptions && !patient) {
             toast({ variant: 'destructive', title: 'Patient not found' });
            router.push('/dashboard/ceylon-pharmacy');
        }
    }, [patientId, router, patient, isLoadingPrescriptions]);

    useEffect(() => {
        try {
            const storedStartTime = localStorage.getItem(`treatment_start_${patientId}`);
            if (storedStartTime) {
                setTreatmentStartTime(parseInt(storedStartTime, 10));
            }
        } catch (error) {
            console.error("Failed to read from localStorage", error);
        }
    }, [patientId]);
    
    // In a real app, this completion state would come from a global state or API
    const [taskCompletion, setTaskCompletion] = useState({ dispense: false, counsel: false, pos: false });
    
    useEffect(() => {
        if(patient && prescriptionDetails && completedDrugIds.size === prescriptionDetails.length) {
            setTaskCompletion(prev => ({...prev, dispense: true}));
        }
    }, [completedDrugIds, patient, prescriptionDetails]);


    const allTasksCompleted = useMemo(() => {
        return taskCompletion.dispense && taskCompletion.counsel && taskCompletion.pos;
    }, [taskCompletion]);

    const handleTimeEnd = useCallback(() => {
        if (patient && !allTasksCompleted) {
            toast({
                variant: 'destructive',
                title: 'Patient Lost',
                description: `Time ran out for ${patient.Pres_Name}.`,
            });
            router.push('/dashboard/ceylon-pharmacy');
        }
    }, [patient, allTasksCompleted, router]);

    const handleStartTreatment = () => {
        const now = Date.now();
        setTreatmentStartTime(now);
        try {
            localStorage.setItem(`treatment_start_${patientId}`, String(now));
        } catch (error) {
            console.error("Failed to write to localStorage", error);
        }
    };
    
    if (isLoadingPrescriptions || !patient) {
        return (
             <div className="p-4 md:p-8 space-y-6 pb-20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        );
    }
    
    const dispensingSubtasks = prescriptionDetails?.map(detail => ({
        id: detail.cover_id,
        name: detail.content.split(' ')[0] || 'Unknown Drug', // Best effort name
        href: `/dashboard/ceylon-pharmacy/${patient.prescription_id}/dispense?drug=${detail.cover_id}`,
        completed: completedDrugIds.has(detail.cover_id)
    })) || [];

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                 <Button onClick={() => router.push('/dashboard/ceylon-pharmacy')} variant="outline" size="sm" className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Waiting Room
                </Button>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <CardTitle>Prescription</CardTitle>
                             {treatmentStartTime && (
                                <CountdownTimer 
                                    initialTime={3600} 
                                    startTime={treatmentStartTime}
                                    onTimeEnd={handleTimeEnd} 
                                    isPaused={allTasksCompleted} 
                                />
                             )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex justify-center p-4">
                        <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-400 w-full max-w-md shadow-sm font-sans text-gray-800">
                            <div className="text-center border-b pb-4 mb-4 border-gray-300">
                                <h2 className="text-xl font-bold">{patient.doctor_name}</h2>
                                <p className="text-sm text-gray-600">MBBS, MD</p>
                                <p className="text-sm text-gray-600">Reg. No: {patient.id}</p>
                            </div>
                            
                            <div className="flex justify-between text-sm mb-6">
                                <div>
                                <p><span className="font-semibold">Name:</span> {patient.Pres_Name}</p>
                                <p><span className="font-semibold">Age:</span> {patient.Pres_Age}</p>
                                </div>
                                <div>
                                <p><span className="font-semibold">Date:</span> {patient.pres_date}</p>
                                </div>
                            </div>

                            <div className="flex items-start min-h-[200px] pl-10 relative mb-6">
                                <div className="absolute left-0 top-0 text-6xl font-serif text-gray-700 select-none">℞</div>
                                <div className="flex-1 space-y-4 font-mono text-lg text-gray-800 pt-2">
                                     {isLoadingDetails ? <Loader2 className="animate-spin" /> : 
                                      prescriptionDetails?.map(detail => (
                                        <div key={detail.cover_id}>
                                            <p>{detail.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-right mt-8">
                                <p className="italic font-serif text-xl text-gray-700">{patient.doctor_name.split(' ').slice(1).join(' ')}</p>
                                <p className="text-xs text-muted-foreground non-italic">Signature</p>
                            </div>
                        </div>
                    </CardContent>
                    {!treatmentStartTime && (
                        <CardFooter>
                            <Button size="lg" className="w-full" onClick={handleStartTreatment}>
                                <PlayCircle className="mr-2 h-5 w-5" />
                                Start Treatment
                            </Button>
                        </CardFooter>
                    )}
                </Card>

                <div className="space-y-4">
                    <Card className="shadow-xl">
                        <CardContent className="p-4 flex flex-col items-center text-center gap-4">
                             <Avatar className="h-24 w-24 text-4xl border-4 border-primary">
                                <AvatarImage src={`https://placehold.co/100x100.png`} alt={patient.Pres_Name} data-ai-hint="person avatar" />
                                <AvatarFallback>{patient.Pres_Name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl font-headline">{patient.Pres_Name}</CardTitle>
                                <CardDescription className="text-base">{patient.Pres_Age}</CardDescription>
                                <p className="text-sm text-muted-foreground mt-1">Under care of {patient.doctor_name}</p>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {treatmentStartTime && (
                        <div className="space-y-4 animate-in fade-in-50">
                            <TaskCard 
                                title="Task 1: Dispense Prescription"
                                description="Fill the dispensing label correctly for each item."
                                href={`/dashboard/ceylon-pharmacy/${patient.prescription_id}/dispense`}
                                status={taskCompletion.dispense ? 'completed' : 'pending'}
                                icon={ClipboardList}
                                subtasks={dispensingSubtasks}
                            />
                            <TaskCard 
                                title="Task 2: Patient Counselling"
                                description="Provide correct instructions."
                                href={`/dashboard/ceylon-pharmacy/${patient.prescription_id}/counsel`}
                                status={taskCompletion.counsel ? 'completed' : 'pending'}
                                icon={MessageCircle}
                            />
                            <TaskCard 
                                title="Task 3: POS Billing"
                                description="Use the POS system to bill the patient."
                                href={`/dashboard/ceylon-pharmacy/${patient.prescription_id}/pos`}
                                status={taskCompletion.pos ? 'completed' : 'pending'}
                                icon={BookOpen}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
