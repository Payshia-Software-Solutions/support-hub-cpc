
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, FileText, Settings, List, MessageSquare, ShoppingBasket, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { CeylonPharmacyIcon } from "@/components/icons/module-icons";

export default function CeylonPharmacySetupPage() {
    const router = useRouter();

    const managementLinks = [
        {
            title: "Manage Patients & Prescriptions",
            description: "Create and edit patient profiles and their associated prescriptions for the challenges.",
            href: "/admin/manage/games/ceylon-pharmacy/patients",
            icon: UserPlus,
        },
        {
            title: "Manage Instructions",
            description: "Add, edit, or remove the counselling instructions available during the game.",
            href: "/admin/manage/games/ceylon-pharmacy/instructions",
            icon: MessageSquare,
        },
        {
            title: "Manage Store Items",
            description: "Configure the general items available for purchase in the POS system.",
            href: "/admin/manage/games/ceylon-pharmacy/store-items",
            icon: ShoppingBasket,
        }
    ];


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
               {managementLinks.map(link => (
                    <Link key={link.href} href={link.href} className="group block h-full">
                        <Card className="shadow-lg h-full flex flex-col hover:border-primary transition-all">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary"><link.icon className="w-5 h-5"/> {link.title}</CardTitle>
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
