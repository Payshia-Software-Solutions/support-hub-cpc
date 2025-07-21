
"use client";

import { TicketForm } from "@/components/dashboard/TicketForm";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTicket } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import type { Ticket, Attachment } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

export default function CreateTicketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createTicketMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (newTicket: Ticket) => {
      // Invalidate both the general and the user-specific ticket queries
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

  const handleTicketSubmit = (data: Omit<Ticket, 'id' | 'createdAt' | 'status' | 'studentName' | 'studentAvatar' | 'studentNumber' | 'priority' >, attachment?: Attachment) => {
    if (!user || !user.username) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to create a ticket.",
        });
        return;
    }
    
    createTicketMutation.mutate({
      ...data,
      priority: 'Medium', // Default priority
      studentNumber: user.username,
      studentName: user.username,
      studentAvatar: user.avatar,
      status: 'Open',
      attachment: attachment,
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      <TicketForm onSubmitTicket={handleTicketSubmit} isSubmitting={createTicketMutation.isPending} />
    </div>
  );
}
