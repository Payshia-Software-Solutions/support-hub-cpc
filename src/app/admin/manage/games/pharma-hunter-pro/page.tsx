"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { HunterProIcon } from "@/components/icons/module-icons";

export default function PharmaHunterProSetupPage() {
    const router = useRouter();
    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Management
                </Button>
                <div className="flex items-center gap-4 mt-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500">
                        <HunterProIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-headline font-semibold">Pharma Hunter Pro Setup</h1>
                        <p className="text-muted-foreground">Configure settings and parameters for the Pharma Hunter Pro game.</p>
                    </div>
                </div>
            </header>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Game Configuration</CardTitle>
                    <CardDescription>This section is under construction. Game settings will be available here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Coming soon...</p>
                </CardContent>
            </Card>
        </div>
    );
}
