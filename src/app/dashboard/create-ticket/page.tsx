
"use client";

import { TicketForm } from "@/components/dashboard/TicketForm";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTicket } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import type { Ticket } from "@/lib/types";

export default function CreateTicketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createTicketMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (newTicket: Ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
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

  const handleTicketSubmit = (data: Omit<Ticket, 'id' | 'createdAt' | 'status' | 'studentName' | 'studentAvatar'>) => {
    // Here you would get the current user's info
    const studentName = "Current User"; // Placeholder
    const studentAvatar = "https://placehold.co/100x100.png"; // Placeholder
    
    createTicketMutation.mutate({
      ...data,
      studentName,
      studentAvatar,
      status: 'Open',
    });
  };

  return (
    <div className="p-4 md:p-8 flex justify-center items-start min-h-full bg-muted/30 overflow-y-auto">
      <TicketForm onSubmitTicket={handleTicketSubmit} isSubmitting={createTicketMutation.isPending} />
    </div>
  );
}
