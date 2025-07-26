
"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { prescriptions } from "@/lib/d-pad-data";
import Link from "next/link";
import { ArrowRight, Pill, UserMd } from "lucide-react";
import { DoctorIcon } from "@/components/icons/module-icons";

export default function DPadIndexPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-headline font-semibold">D-Pad: Prescription Challenge</h1>
        <p className="text-muted-foreground">Select a prescription from the list below to start the challenge.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prescriptions.map((rx, index) => (
          <Link key={rx.id} href={`/dashboard/d-pad/${rx.id}`} className="group block h-full">
            <Card className="shadow-lg hover:shadow-xl hover:border-primary transition-all flex flex-col h-full">
              <CardHeader>
                <CardTitle>Prescription #{index + 1}</CardTitle>
                 <div className="flex items-center gap-3 pt-2">
                    <DoctorIcon className="w-10 h-10 text-primary" />
                    <div>
                        <p className="font-semibold text-card-foreground text-sm">{rx.doctor.name}</p>
                        <p className="text-xs text-muted-foreground">{rx.doctor.specialty}</p>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                 <p className="text-sm"><span className="font-semibold">Patient:</span> {rx.patient.name}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Pill className="mr-2 h-4 w-4 text-primary" />
                  <span className="font-medium text-card-foreground">{rx.correctAnswers.drugName}</span>
                </div>
              </CardContent>
              <CardContent className="mt-auto">
                 <Button variant="secondary" className="w-full">
                    Open Challenge <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
