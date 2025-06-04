"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/types";

const ticketFormSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters.").max(100, "Subject must be at most 100 characters."),
  description: z.string().min(20, "Description must be at least 20 characters.").max(1000, "Description must be at most 1000 characters."),
  priority: z.enum(["Low", "Medium", "High"], {
    required_error: "You need to select a ticket priority.",
  }),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  onSubmitTicket: (newTicket: Ticket) => void;
}

export function TicketForm({ onSubmitTicket }: TicketFormProps) {
  const { toast } = useToast();
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      subject: "",
      description: "",
      priority: "Medium",
    },
  });

  function onSubmit(data: TicketFormValues) {
    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      subject: data.subject,
      description: data.description,
      priority: data.priority as TicketPriority,
      status: "Open" as TicketStatus,
      createdAt: new Date().toISOString(),
      studentName: "Current User", // Placeholder
      studentAvatar: "https://placehold.co/100x100.png", // Placeholder
      messages: [
        {
          id: `msg-${Date.now()}`,
          from: "student",
          text: `Ticket created with subject: ${data.subject}. Description: ${data.description}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          avatar: "https://placehold.co/40x40.png", // Placeholder
        },
      ],
    };
    
    onSubmitTicket(newTicket); // Update parent state (e.g., dummyTickets array)
    
    toast({
      title: "Ticket Submitted!",
      description: (
        <div>
          <p>Subject: {data.subject}</p>
          <p>Priority: {data.priority}</p>
        </div>
      ),
    });
    console.log("New ticket submitted:", newTicket);
    form.reset();
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Create New Support Ticket</CardTitle>
        <CardDescription>
          Please fill out the form below to submit a new support ticket. We'll get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Issue with course registration" {...field} />
                  </FormControl>
                  <FormDescription>
                    A brief summary of your issue.
                  </FormDescription>
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
                  <FormDescription>
                    Provide as much detail as possible to help us understand and resolve your issue quickly.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticket priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How urgent is this issue?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Submitting..." : "Submit Ticket"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
