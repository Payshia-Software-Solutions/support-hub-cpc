
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, ArrowLeft, Pill, User, ClipboardList, BookOpen, MessageCircle } from 'lucide-react';
import { ceylonPharmacyPatients, type Patient, type PrescriptionDrug } from '@/lib/ceylon-pharmacy-data';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CountdownTimer = ({ initialTime, onTimeEnd, isPaused }: { initialTime: number, onTimeEnd: () => void, isPaused: boolean }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);

    useEffect(() => {
        if (isPaused || timeLeft <= 0) {
            if (timeLeft <= 0) onTimeEnd();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, onTimeEnd, isPaused]);

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
    const isParentLinkDisabled = isCompleted || !subtasks;

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

    if (isParentLinkDisabled) {
        return <div className="block">{content}</div>
    }

    return (
        <Link href={href} className="block group">
            {content}
        </Link>
    );
};


// --- MAIN PAGE ---
export default function CeylonPharmacyPatientPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.id as string;
    
    const [patient, setPatient] = useState<Patient | null>(null);
    const [completedDrugIds, setCompletedDrugIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const foundPatient = ceylonPharmacyPatients.find(p => p.id === patientId);
        if (foundPatient) {
            setPatient(foundPatient);
        } else {
            router.push('/dashboard/ceylon-pharmacy');
        }
    }, [patientId, router]);
    
    // In a real app, this completion state would come from a global state or API
    const [taskCompletion, setTaskCompletion] = useState({ dispense: false, counsel: false, pos: false });
    
    useEffect(() => {
        if(patient && completedDrugIds.size === patient.prescription.drugs.length) {
            setTaskCompletion(prev => ({...prev, dispense: true}));
        }
    }, [completedDrugIds, patient]);


    const allTasksCompleted = useMemo(() => {
        return taskCompletion.dispense && taskCompletion.counsel && taskCompletion.pos;
    }, [taskCompletion]);

    const handleTimeEnd = () => {
        if (patient && !allTasksCompleted) {
            // In a real app, this would be a mutation to update the backend
            setPatient(prev => prev ? { ...prev, status: 'dead' } : null);
            toast({
                variant: 'destructive',
                title: 'Patient Lost',
                description: `Time ran out for ${patient.name}.`,
            });
            router.push('/dashboard/ceylon-pharmacy');
        }
    }

    if (!patient) {
        return (
             <div className="p-4 md:p-8 space-y-6 pb-20 flex items-center justify-center">
                <p>Loading patient...</p>
             </div>
        );
    }
    
    const currentPrescription = patient.prescription;

    const dispensingSubtasks = currentPrescription.drugs.map(drug => ({
        id: drug.id,
        name: drug.correctAnswers.drugName,
        href: `/dashboard/ceylon-pharmacy/${patient.id}/dispense?drug=${drug.id}`,
        completed: completedDrugIds.has(drug.id)
    }));

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
        <Card className="shadow-xl">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <Button onClick={() => router.push('/dashboard/ceylon-pharmacy')} variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Waiting Room
                    </Button>
                    <CountdownTimer initialTime={patient.initialTime} onTimeEnd={handleTimeEnd} isPaused={allTasksCompleted} />
                </div>
                <div className="pt-4 flex items-center gap-4">
                     <User className="h-10 w-10 text-primary" />
                    <div>
                        <CardTitle className="text-2xl">Treating: {patient.name}</CardTitle>
                        <CardDescription>{patient.age} / {currentPrescription.doctor.name}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <TaskCard 
                    title="Task 1: Dispense Prescription"
                    description="Fill the dispensing label correctly for each item."
                    href={`/dashboard/ceylon-pharmacy/${patient.id}/dispense`}
                    status={taskCompletion.dispense ? 'completed' : 'pending'}
                    icon={ClipboardList}
                    subtasks={dispensingSubtasks}
                 />
                 <TaskCard 
                    title="Task 2: Patient Counselling"
                    description="Provide correct instructions."
                    href={`/dashboard/ceylon-pharmacy/${patient.id}/counsel`}
                    status={taskCompletion.counsel ? 'completed' : 'pending'}
                    icon={MessageCircle}
                 />
                 <TaskCard 
                    title="Task 3: POS Billing"
                    description="Use the POS system to bill the patient."
                    href={`/dashboard/ceylon-pharmacy/${patient.id}/pos`}
                    status={taskCompletion.pos ? 'completed' : 'pending'}
                    icon={BookOpen}
                 />
            </CardContent>
        </Card>
    </div>
    )
}
