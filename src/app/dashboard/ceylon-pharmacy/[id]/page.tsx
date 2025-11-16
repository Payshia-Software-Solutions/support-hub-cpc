

"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, ArrowLeft, Pill, User, ClipboardList, BookOpen, MessageCircle, PlayCircle, Loader2, RefreshCw } from 'lucide-react';
import { getCeylonPharmacyPrescriptions, getPrescriptionDetails, getTreatmentStartTime, createTreatmentStartRecord } from '@/lib/actions/games';
import type { GamePatient, PrescriptionDetail, TreatmentStartRecord } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const CountdownTimer = ({ initialTime, startTime, onTimeEnd, isPaused, patientStatus }: { 
    initialTime: number, 
    startTime: number | null, 
    onTimeEnd: () => void, 
    isPaused: boolean,
    patientStatus: 'dead' | 'active' | 'recovered' | 'pending'
}) => {
    const calculateTimeLeft = useCallback(() => {
        if (!startTime) return initialTime;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        return Math.max(0, initialTime - elapsed);
    }, [startTime, initialTime]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

    useEffect(() => {
        if (isPaused || timeLeft <= 0 || !startTime || patientStatus !== 'active') {
            if (timeLeft <= 0 && patientStatus === 'active') onTimeEnd();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeEnd, isPaused, startTime, calculateTimeLeft, patientStatus]);
    
    if (patientStatus === 'pending') {
      return null; // Don't show the timer if it hasn't started
    }

    if (patientStatus === 'dead') {
         return <Badge variant="destructive" className="text-lg"><Clock className="mr-2 h-5 w-5" />Timeout</Badge>;
    }
     if (patientStatus === 'recovered') {
        return <Badge variant="default" className="bg-green-600 text-lg"><CheckCircle className="mr-2 h-5 w-5" />Recovered</Badge>;
    }

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

const TaskCard = ({ title, description, href, status, icon: Icon, subtasks, isPatientDead }: { 
    title: string, 
    description: string, 
    href: string, 
    status: 'pending' | 'completed', 
    icon: React.ElementType,
    subtasks?: { id: string; name: string; href: string; completed: boolean; }[],
    isPatientDead?: boolean;
}) => {
    const isCompleted = status === 'completed';
    const isParentLinkDisabled = isCompleted || isPatientDead;

    const firstIncompleteSubtaskHref = subtasks?.find(t => !t.completed)?.href;

    const content = (
         <Card className={cn("shadow-md transition-all", isParentLinkDisabled ? "" : "group-hover:shadow-lg group-hover:border-primary/50", isCompleted ? "bg-green-100 border-green-300" : "", isPatientDead ? "opacity-60 bg-muted" : "")}>
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
                        <Link key={task.id} href={task.completed || isPatientDead ? '#' : task.href} className={cn("block rounded-md p-2 transition-colors", task.completed ? "bg-green-200/50 pointer-events-none" : "hover:bg-accent/50", isPatientDead && "pointer-events-none")}>
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
    const patientId = params.id as string; // This is the prescription_id
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const courseCode = 'CPCC20';
    
    const [completedDrugIds, setCompletedDrugIds] = useState<Set<string>>(new Set());

    // --- Data Fetching ---
    const { data: patient, isLoading: isLoadingPatient } = useQuery<GamePatient>({
        queryKey: ['ceylonPharmacyPatient', patientId, user?.username],
        queryFn: async () => {
            if (!user?.username) throw new Error("User not authenticated");
            const prescriptions = await getCeylonPharmacyPrescriptions(user.username, courseCode);
            const found = prescriptions.find(p => p.prescription_id === patientId);
            if (!found) throw new Error("Patient not found for this user/course");
            return found;
        },
        enabled: !!patientId && !!user?.username,
    });
    
    const { data: prescriptionDetails, isLoading: isLoadingDetails } = useQuery<PrescriptionDetail[]>({
        queryKey: ['prescriptionDetails', patientId],
        queryFn: () => getPrescriptionDetails(patientId),
        enabled: !!patient,
    });
    
    // --- Mutations ---
    const startTreatmentMutation = useMutation({
        mutationFn: () => createTreatmentStartRecord(user!.username!, patientId),
        onSuccess: () => {
            toast({ title: "Treatment Started!", description: "The timer is now running." });
            queryClient.invalidateQueries({ queryKey: ['ceylonPharmacyPatient', patientId, user?.username] });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: "Failed to Start Treatment", description: error.message });
        }
    });

    // --- Memos and State Calculations ---
    const startTime = patient?.start_data ? new Date(patient.start_data.time).getTime() : null;
    
    const patientStatus = useMemo<'active' | 'dead' | 'recovered' | 'pending'>(() => {
        if (!patient?.start_data) return 'pending';
        if (patient.start_data.patient_status === 'Recovered') return 'recovered';
        
        const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
        if (elapsed > 3600) return 'dead'; // 1 hour = 3600 seconds
        
        return 'active';
    }, [patient, startTime]);
    
    useEffect(() => {
        if (patientStatus === 'dead') {
             toast({
                variant: 'destructive',
                title: 'Patient Lost',
                description: `Time ran out for ${patient?.Pres_Name}.`,
                duration: 5000,
            });
        }
    }, [patientStatus, patient?.Pres_Name]);

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
    
    if (isLoadingPatient || isLoadingDetails || !patient) {
        return (
             <div className="p-4 md:p-8 space-y-6 pb-20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        );
    }
    
    const dispensingSubtasks = prescriptionDetails?.map(detail => ({
        id: detail.cover_id,
        name: detail.content.split(' ')[0] || 'Unknown Drug',
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
                            <CountdownTimer 
                                initialTime={3600} 
                                startTime={startTime}
                                onTimeEnd={() => {}} 
                                isPaused={allTasksCompleted}
                                patientStatus={patientStatus}
                            />
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
                                      {prescriptionDetails?.map(detail => (
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
                    {patientStatus === 'pending' && (
                         <CardFooter>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="lg" className="w-full" disabled={startTreatmentMutation.isPending}>
                                        <PlayCircle className="mr-2 h-5 w-5" /> Start Treatment
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Start Treatment?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will begin the one-hour timer for this patient. This action cannot be undone. Are you ready to proceed?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => startTreatmentMutation.mutate()} disabled={startTreatmentMutation.isPending}>
                                            {startTreatmentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                            Yes, Start Timer
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
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
                    
                    {patientStatus !== 'pending' && (
                        <div className="space-y-4 animate-in fade-in-50">
                            <TaskCard 
                                title="Task 1: Dispense Prescription"
                                description="Fill the dispensing label correctly for each item."
                                href={`/dashboard/ceylon-pharmacy/${patient.prescription_id}/dispense`}
                                status={taskCompletion.dispense ? 'completed' : 'pending'}
                                icon={ClipboardList}
                                subtasks={dispensingSubtasks}
                                isPatientDead={patientStatus === 'dead'}
                            />
                            <TaskCard 
                                title="Task 2: Patient Counselling"
                                description="Provide correct instructions."
                                href={`/dashboard/ceylon-pharmacy/${patient.prescription_id}/counsel`}
                                status={taskCompletion.counsel ? 'completed' : 'pending'}
                                icon={MessageCircle}
                                isPatientDead={patientStatus === 'dead'}
                            />
                            <TaskCard 
                                title="Task 3: POS Billing"
                                description="Use the POS system to bill the patient."
                                href={`/dashboard/ceylon-pharmacy/${patient.prescription_id}/pos`}
                                status={taskCompletion.pos ? 'completed' : 'pending'}
                                icon={BookOpen}
                                isPatientDead={patientStatus === 'dead'}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
