
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { TicketCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Book, CreditCard, Gamepad2, Truck, MoreHorizontal, ArrowLeft, Video, ClipboardList, ClipboardCheck, Award } from "lucide-react";

const ticketFormSchema = z.object({
  subject: z.string().min(5, "Topic must be at least 5 characters.").max(20, "Topic must be 20 characters or less."),
  category: z.enum(["Course", "Payment", "Games", "Delivery Packs", "Recordings", "Assignments", "Quiz", "Exam", "Other"], {
    required_error: "You need to select a ticket category.",
  }),
  description: z.string().min(1, "Description cannot be empty.").max(1000, "Description must be at most 1000 characters."),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  onSubmitTicket: (data: Omit<TicketFormValues, "priority">) => void;
  isSubmitting: boolean;
}

const categoryOptions: { name: TicketCategory; icon: React.ElementType }[] = [
    { name: "Course", icon: Book },
    { name: "Payment", icon: CreditCard },
    { name: "Games", icon: Gamepad2 },
    { name: "Delivery Packs", icon: Truck },
    { name: "Recordings", icon: Video },
    { name: "Assignments", icon: ClipboardList },
    { name: "Quiz", icon: ClipboardCheck },
    { name: "Exam", icon: Award },
    { name: "Other", icon: MoreHorizontal },
];

export function TicketForm({ onSubmitTicket, isSubmitting }: TicketFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      subject: "",
      description: "",
    },
  });

  function onSubmit(data: TicketFormValues) {
    onSubmitTicket(data);
    form.reset();
    setSelectedCategory(null);
  }

  const handleCategorySelect = (category: TicketCategory) => {
    setSelectedCategory(category);
    form.setValue("category", category);
  };
  
  const handleGoBack = () => {
    setSelectedCategory(null);
    form.resetField("subject");
    form.resetField("description");
  }

  return (
    <Card className="w-full border-0 rounded-none bg-transparent">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader className="p-4 md:p-6">
                    {!selectedCategory ? (
                        <>
                            <CardTitle className="text-2xl font-headline">Create New Support Ticket</CardTitle>
                            <CardDescription>Step 1: Choose a category for your issue.</CardDescription>
                        </>
                    ) : (
                         <>
                            <Button variant="ghost" onClick={handleGoBack} className="w-fit h-auto mb-2 text-sm text-muted-foreground hover:text-foreground p-0">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Change Category
                            </Button>
                            <CardTitle className="text-2xl font-headline">Describe Your Issue</CardTitle>
                            <CardDescription>Step 2: Provide details about your '{selectedCategory}' issue.</CardDescription>
                         </>
                    )}
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                    {!selectedCategory ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {categoryOptions.map((cat) => (
                                <button
                                    key={cat.name}
                                    type="button"
                                    onClick={() => handleCategorySelect(cat.name)}
                                    className="p-4 border rounded-lg flex flex-col items-center justify-center text-center gap-2 hover:bg-accent hover:text-accent-foreground hover:border-primary transition-all duration-200"
                                >
                                    <cat.icon className="w-8 h-8 text-primary" />
                                    <span className="text-sm font-medium">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <FormField
                                control={form.control}
                                name="subject"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Topic</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., Issue with course registration" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                    <Textarea
                                        placeholder="Please describe your issue in detail..."
                                        className="min-h-[150px]"
                                        {...field}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    )}
                </CardContent>
                {selectedCategory && (
                     <CardFooter className="p-4 md:p-6 pt-0">
                        <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Ticket"}
                        </Button>
                    </CardFooter>
                )}
            </form>
        </Form>
    </Card>
  );
}
