
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, FileText, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { CeylonPharmacyIcon } from "@/components/icons/module-icons";

export default function CeylonPharmacySetupPage() {
    const router = useRouter();
    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button variant="ghost" onClick={() => router.push('/admin/manage')} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Management
                </Button>
                <div className="flex items-center gap-4 mt-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-400 to-sky-500">
                        <CeylonPharmacyIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-headline font-semibold">Ceylon Pharmacy Setup</h1>
                        <p className="text-muted-foreground">Configure patients, prescriptions, and game parameters.</p>
                    </div>
                </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserPlus/> Manage Patients</CardTitle>
                        <CardDescription>Create and edit patient profiles for the game scenarios.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Define patient names, ages, and other details used in the challenges.</p>
                        <Button variant="outline" className="w-full" disabled>Manage Patients</Button>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText/> Manage Prescriptions</CardTitle>
                        <CardDescription>Design prescriptions with specific drugs, dosages, and correct answers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">This is the core of the challenge. Define what the student needs to enter correctly.</p>
                        <Button variant="outline" className="w-full" disabled>Manage Prescriptions</Button>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Settings/> Game Settings</CardTitle>
                        <CardDescription>Adjust global settings like timers and scoring rules.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Set the time limit for each patient and define how points are awarded.</p>
                        <Button variant="outline" className="w-full" disabled>Adjust Settings</Button>
                    </CardContent>
                </Card>
            </div>
             <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Under Construction</CardTitle>
                    <CardDescription>The full functionality for managing game content will be available here soon.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
