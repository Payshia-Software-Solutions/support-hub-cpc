

"use client";

import { useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TicketDetailClient } from "@/components/dashboard/TicketDetailClient";
import type { Ticket, StaffMember, FullStudentData } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useMobileDetailActive } from '@/contexts/MobileDetailActiveContext';
import { toast } from "@/hooks/use-toast";
import { getTicket, updateTicket, assignTicket, unlockTicket, getStaffMembers, getStudentFullInfo } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const assignmentAttempted = useRef(false);

  const { setIsMobileDetailActive } = useMobileDetailActive();
  const isMobile = useIsMobile();

  const { data: ticket, isLoading: isLoadingTicket, isError: isErrorTicket, error: errorTicket } = useQuery<Ticket>({
    queryKey: ['ticket', ticketId],
    queryFn: () => getTicket(ticketId),
    retry: false,
  });

  const { data: staffMembers, isLoading: isLoadingStaff } = useQuery<StaffMember[]>({
    queryKey: ['staffMembers'],
    queryFn: getStaffMembers,
    staleTime: 1000 * 60 * 5, // Cache staff list for 5 minutes
  });

  const { data: studentInfo, isLoading: isLoadingStudentInfo } = useQuery<FullStudentData>({
    queryKey: ['studentFullInfo', ticket?.studentNumber],
    queryFn: () => getStudentFullInfo(ticket!.studentNumber),
    enabled: !!ticket?.studentNumber,
  });

  const updateMutation = useMutation({
    mutationFn: updateTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketMessages', data.id] });
    },
    onError: (err: Error) => {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: err.message,
        });
    }
  });

  const assignMutation = useMutation({
    mutationFn: ({ ticketId, assignedTo, assigneeAvatar, lockedByStaffId }: { ticketId: string, assignedTo: string, assigneeAvatar: string, lockedByStaffId: string }) => 
        assignTicket(ticketId, assignedTo, assigneeAvatar, lockedByStaffId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketMessages', data.id] });
      
      const assignedStaff = staffMembers?.find(s => s.username === data.assignedTo);
      const displayName = assignedStaff ? assignedStaff.name : data.assignedTo;

      toast({
        title: "Ticket Assigned",
        description: `Ticket has been assigned to ${displayName}.`,
      });
    },
    onError: (err: Error) => {
        toast({
            variant: "destructive",
            title: "Assignment Failed",
            description: err.message,
        });
    }
  });

  const unlockMutation = useMutation({
    mutationFn: unlockTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketMessages', data.id] });
      toast({
        title: "Ticket Unlocked",
        description: "This ticket is now available for other staff members.",
      });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Unlock Failed",
        description: err.message,
      });
    },
  });

  useEffect(() => {
    history.pushState(null, '', location.href);
    const handlePopState = (event: PopStateEvent) => {
        event.preventDefault();
        router.push('/admin/tickets');
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
        window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  useEffect(() => {
    if (isMobile) {
      setIsMobileDetailActive(true);
      return () => setIsMobileDetailActive(false);
    } else {
      setIsMobileDetailActive(false);
    }
  }, [isMobile, setIsMobileDetailActive]);

  const handleUpdateTicket = useCallback((updatedTicket: Partial<Ticket> & { id: string }) => {
    updateMutation.mutate(updatedTicket);
  }, [updateMutation]);

  const handleAssignTicket = useCallback((payload: { ticketId: string, assignedTo: string, assigneeAvatar: string, lockedByStaffId: string }) => {
    assignMutation.mutate(payload);
  }, [assignMutation]);
  
  const handleUnlockTicket = useCallback((ticketIdToUnlock: string) => {
    unlockMutation.mutate(ticketIdToUnlock);
  }, [unlockMutation]);

  useEffect(() => {
    if (ticket && user && user.username && !ticket.assignedTo && !assignmentAttempted.current) {
      assignmentAttempted.current = true;
      assignMutation.mutate({
        ticketId: ticket.id,
        assignedTo: user.username,
        assigneeAvatar: user.avatar,
        lockedByStaffId: user.username,
      });
    }
  }, [ticket, user, assignMutation]);

  if (isLoadingTicket || !user || isLoadingStaff || isLoadingStudentInfo) { 
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full mt-6" />
      </div>
    );
  }

  if (isErrorTicket || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 md:p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Ticket Not Found</h1>
        <p className="text-muted-foreground mb-6">
          {errorTicket?.message || `The ticket with ID "${ticketId}" could not be found.`}
        </p>
        <Button
          onClick={() => router.push("/admin/tickets")} 
          variant="default"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {isMobile && (
        <div className="shrink-0 border-b bg-card px-4 py-2">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/tickets")} 
            className="w-full justify-start text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets List
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <TicketDetailClient 
          key={ticket.id}
          initialTicket={ticket} 
          onUpdateTicket={handleUpdateTicket}
          onAssignTicket={handleAssignTicket}
          onUnlockTicket={handleUnlockTicket}
          userRole="staff" 
          staffAvatar={user.avatar}
          currentStaffUsername={user.username}
          staffMembers={staffMembers || []}
          studentInfo={studentInfo}
        />
      </div>
    </div>
  );
}
