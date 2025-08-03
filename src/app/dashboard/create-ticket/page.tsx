
"use client";

import Link from "next/link";
import { TicketForm } from "@/components/dashboard/TicketForm";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTicket, getTickets } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import type { Ticket, Attachment } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MAX_OPEN_TICKETS = 3;

export default function CreateTicketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: tickets, isLoading: isLoadingTickets } = useQuery<Ticket[]>({
    queryKey: ['tickets', user?.username],
    queryFn: () => getTickets(user!.username!),
    enabled: !!user?.username,
  });

  const openTickets = tickets?.filter(t => t.status === 'Open' || t.status === 'In Progress') || [];
  const canCreateTicket = openTickets.length < MAX_OPEN_TICKETS;
  const ticketsLeft = MAX_OPEN_TICKETS - openTickets.length;

  const createTicketMutation = useMutation({
    mutationFn: (formData: FormData) => createTicket(formData),
    onSuccess: (newTicket: Ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', user?.username] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      
      toast({
        title: "Ticket Submitted!",
        description: `Your ticket "${newTicket.subject}" has been created.`,
      });
      router.push(`/dashboard/tickets/${newTicket.id}`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "An unknown error occurred.",
      });
    },
  });

  const handleTicketSubmit = (data: Omit<Ticket, 'id' | 'createdAt' | 'status' | 'studentName' | 'studentAvatar' | 'studentNumber' | 'priority' | 'attachments' >, attachments: Attachment[] = []) => {
    if (!user || !user.username) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to create a ticket.",
        });
        return;
    }
    
    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('priority', 'Medium');
    formData.append('student_name', user.username);
    formData.append('student_avatar', user.avatar);
    formData.append('status', 'Open');

    if (attachments.length > 0) {
      const attachmentMetadata = attachments.map(att => ({
        type: att.type,
        name: att.name,
      }));
      formData.append('attachments', JSON.stringify(attachmentMetadata));
    }

    attachments.forEach(att => {
      if (att.file) {
        formData.append('attachments[]', att.file, att.name);
      }
    });

    createTicketMutation.mutate(formData);
  };
  
  if (isLoadingTickets) {
      return (
          <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Checking your existing tickets...</p>
          </div>
      )
  }

  return (
    <div className="w-full h-full overflow-y-auto">
       {createTicketMutation.isPending ? (
        <div className="flex h-full flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Submitting your ticket...</p>
        </div>
      ) : canCreateTicket ? (
        <>
            <div className="p-4 md:px-6">
                <Card className="border-blue-500 bg-blue-500/10">
                    <CardHeader>
                        <CardTitle className="text-blue-800">You can create {ticketsLeft} more ticket{ticketsLeft === 1 ? '' : 's'}.</CardTitle>
                        <CardDescription className="text-blue-700">Please close your existing tickets before creating new ones if possible.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
            <TicketForm onSubmitTicket={handleTicketSubmit} isSubmitting={createTicketMutation.isPending} />
        </>
      ) : (
        <div className="p-4 md:p-6">
             <Card className="w-full border-destructive bg-destructive/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle /> You have reached the maximum number of open tickets.
                    </CardTitle>
                    <CardDescription className="text-destructive/90">
                        Please wait for your existing tickets to be resolved before creating new ones.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold mb-2 text-card-foreground">Your Open Tickets:</h3>
                    <div className="space-y-3">
                        {openTickets.map(ticket => (
                            <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`} className="block">
                                <div className="p-3 border rounded-lg bg-card hover:bg-muted transition-colors flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{ticket.subject}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <Badge variant={ticket.status === 'Open' ? 'default' : 'secondary'}>{ticket.status}</Badge>
                                            <span>ID: {ticket.id}</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
