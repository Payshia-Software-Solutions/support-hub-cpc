
"use client";

import { TicketForm } from "@/components/dashboard/TicketForm";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTicket } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import type { Ticket, Attachment } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Preloader } from "@/components/ui/preloader";

export default function CreateTicketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createTicketMutation = useMutation({
    mutationFn: (formData: FormData) => createTicket(formData),
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

    // Append a JSON string of attachment metadata
    if (attachments.length > 0) {
      const attachmentMetadata = attachments.map(att => ({
        type: att.type,
        name: att.name,
      }));
      formData.append('attachments', JSON.stringify(attachmentMetadata));
    }

    // Append each file with a key like `attachments[]`
    attachments.forEach(att => {
      if (att.file) {
        formData.append('attachments[]', att.file, att.name);
      }
    });

    createTicketMutation.mutate(formData);
  };
  
  if (createTicketMutation.isPending) {
    return <Preloader message="Submitting your ticket..." />;
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <TicketForm onSubmitTicket={handleTicketSubmit} isSubmitting={createTicketMutation.isPending} />
    </div>
  );
}
