"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Layers, LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { WinPharmaIcon } from "@/components/icons/module-icons";

export default function WinPharmaSetupPage() {
    const router = useRouter();

    const managementLinks = [
        {
            title: "Level Creation",
            description: "Create and configure the different levels that players will progress through.",
            href: "/admin/manage/games/winpharma/levels",
            icon: Layers,
        },
    ];

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20">
            <header>
                <Button variant="ghost" onClick={() => router.push('/admin/manage')} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Management
                </Button>
                <div className="flex items-center gap-4 mt-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500">
                        <WinPharmaIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-headline font-semibold">WinPharma Setup</h1>
                        <p className="text-muted-foreground">Configure levels and tasks for the WinPharma game.</p>
                    </div>
                </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {managementLinks.map(link => (
                    <Link key={link.href} href={link.href} className="group block h-full">
                        <Card className="shadow-lg h-full flex flex-col hover:border-primary transition-all">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-lg group-hover:text-primary"><link.icon className="w-6 h-6"/> {link.title}</CardTitle>
                                <CardDescription>{link.description}</CardDescription>
                            </CardHeader>
                             <CardFooter className="mt-auto">
                                <Button variant="outline" className="w-full">
                                    Manage <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </Link>
               ))}
            </div>
        </div>
    );
}
