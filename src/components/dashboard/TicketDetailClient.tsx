"use client";

import { useState, useRef, useEffect, type Dispatch, type SetStateAction, memo } from "react";
import type { Ticket, Message, TicketStatus, StaffMember } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip, SendHorizonal, CalendarDays, User, ShieldCheck, MessageSquare, UserCog, Lock, Unlock } from "lucide-react"; 
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; 
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { dummyStaffMembers } from "@/lib/dummy-data"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTicketMessages, createTicketMessage } from "@/lib/api";
import { Skeleton } from "../ui/skeleton";


interface TicketDetailClientProps {
  initialTicket: Ticket;
  onUpdateTicket: (updatedTicket: Partial<Ticket> & { id: string }) => void;
  userRole: 'student' | 'staff';
  staffAvatar?: string; 
  currentStaffId?: string;
}

const priorityColors: Record<Ticket["priority"], string> = {
  High: "bg-red-500 hover:bg-red-600 text-white",
  Medium: "bg-yellow-500 hover:bg-yellow-600 text-white",
  Low: "bg-green-500 hover:bg-green-600 text-white",
};

const defaultStaffAvatar = "https://placehold.co/40x40.png?text=S";

const TicketInfoContent = memo(({ 
  ticket, 
  userRole, 
  isTicketLockedByOther,
  isTicketLockedByCurrentUser,
  lockerName,
  handleUnlockTicket,
  handleStatusChange,
  handleAssignmentChange,
}: {
  ticket: Ticket,
  userRole: 'student' | 'staff',
  isTicketLockedByOther: boolean,
  isTicketLockedByCurrentUser: boolean,
  lockerName: string | undefined,
  handleUnlockTicket: () => void,
  handleStatusChange: (newStatus: TicketStatus) => void,
  handleAssignmentChange: (staffId: string) => void,
}) => (
  <>
      {userRole === 'staff' && isTicketLockedByOther && (
        <Alert variant="destructive" className="mb-4">
          <Lock className="h-4 w-4" />
          <AlertTitle>Ticket Locked</AlertTitle>
          <AlertDescription>
            This ticket is currently being handled by {lockerName}. 
            You cannot make changes until it is unlocked.
          </AlertDescription>
        </Alert>
      )}
       {userRole === 'staff' && isTicketLockedByCurrentUser && (
         <div className="mb-4">
            <Button onClick={handleUnlockTicket} variant="outline" className="w-full">
              <Unlock className="mr-2 h-4 w-4" /> Unlock Ticket
            </Button>
         </div>
      )}

      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-xl md:text-2xl font-headline">{ticket.subject}</CardTitle>
        <CardDescription>Ticket ID: {ticket.id}</CardDescription>
      </CardHeader>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="ticket-status">Status</Label>
          <Select
            value={ticket.status} 
            onValueChange={(value: TicketStatus) => handleStatusChange(value)}
            disabled={(userRole === 'student' && ticket.status === 'Closed') || (userRole === 'staff' && isTicketLockedByOther)}
            name="ticket-status"
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-1">Priority</h4>
          <Badge className={cn("text-sm", priorityColors[ticket.priority])}>{ticket.priority}</Badge>
        </div>

        {userRole === 'staff' && (
          <div>
            <Label htmlFor="ticket-assignment">Assigned To</Label>
            <Select
              value={dummyStaffMembers.find(s => s.name === ticket.assignedTo)?.id || "unassigned"}
              onValueChange={handleAssignmentChange}
              name="ticket-assignment"
              disabled={isTicketLockedByOther}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Assign to staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {dummyStaffMembers.map(staff => (
                  <SelectItem key={staff.id} value={staff.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={staff.avatar} alt={staff.name} data-ai-hint="staff avatar"/>
                        <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {staff.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {ticket.assignedTo && (
           <div className="flex items-center gap-2 text-sm">
            <UserCog className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Assigned:</span>
            {ticket.assigneeAvatar && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={ticket.assigneeAvatar} alt={ticket.assignedTo} data-ai-hint="staff avatar"/>
                <AvatarFallback>{ticket.assignedTo.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <span>{ticket.assignedTo}</span>
          </div>
        )}


        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Student:</span>
          <span>{ticket.studentName || 'Unknown Student'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Created:</span>
          <span>{new Date(ticket.createdAt).toLocaleString()}</span>
        </div>
        {ticket.updatedAt && (
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Last Updated:</span>
            <span>{new Date(ticket.updatedAt).toLocaleString()}</span>
          </div>
        )}
        <div>
          <h4 className="text-sm font-medium mb-1">Description</h4>
          <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md whitespace-pre-line">{ticket.description}</p>
        </div>
      </div>
  </>
));
TicketInfoContent.displayName = "TicketInfoContent";

const TicketDiscussionContent = ({ 
  isMobileContext = false,
  ticket,
  userRole,
  staffAvatar,
  newMessage,
  setNewMessage,
  handleSendMessage,
  isTicketLockedByOther,
 }: {
    isMobileContext?: boolean,
    ticket: Ticket,
    userRole: 'student' | 'staff',
    staffAvatar: string,
    newMessage: string,
    setNewMessage: Dispatch<SetStateAction<string>>,
    handleSendMessage: () => void,
    isTicketLockedByOther: boolean,
 }) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const { data: messages, isLoading, isError } = useQuery<Message[]>({
        queryKey: ['ticketMessages', ticket.id],
        queryFn: () => getTicketMessages(ticket.id),
        enabled: !!ticket.id,
    });

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages]);

    return (
    <>
        <header 
            className={cn(
                "px-4 py-3 border-b bg-card flex items-center gap-3",
                !isMobileContext && "sticky top-0 z-10" 
            )}
        >
        <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-primary" />
        <h2 className="font-semibold text-md md:text-lg">Ticket Discussion</h2>
        </header>
        
        <ScrollArea className="flex-1 px-4 py-4" ref={scrollAreaRef}>
        <div className="space-y-6">
            {isLoading && (
                <div className="space-y-6">
                    <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%] mr-auto"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-16 w-48 rounded-xl" /></div>
                    <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ml-auto flex-row-reverse"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-10 w-32 rounded-xl" /></div>
                </div>
            )}
            {isError && <p className="text-destructive text-center">Failed to load messages.</p>}
            {!isLoading && messages?.map((message) => (
            <div
                key={message.id}
                className={cn(
                "flex items-end gap-2 max-w-[85%] sm:max-w-[75%]", 
                message.from === userRole ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
            >
                <Avatar className="h-8 w-8">
                <AvatarImage 
                    src={message.from === 'student' ? ticket.studentAvatar : (message.avatar || staffAvatar)} 
                    alt={message.from} 
                    data-ai-hint="avatar person"
                />
                <AvatarFallback>
                    {message.from === 'student' ? (ticket.studentName?.charAt(0).toUpperCase() || 'S') : (message.from === 'staff' ? 'S' : '?')}
                </AvatarFallback>
                </Avatar>
                <div
                className={cn(
                    "p-3 rounded-xl shadow-sm",
                    message.from === userRole
                    ? "bg-primary/90 text-primary-foreground rounded-br-none"
                    : "bg-card border rounded-bl-none"
                )}
                >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs mt-1 opacity-70">
                    {new Date(message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                </div>
            </div>
            ))}
        </div>
        </ScrollArea>

        <footer className="px-4 py-3 border-t bg-card sticky bottom-0 z-10">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground" disabled={(userRole === 'staff' && isTicketLockedByOther)}>
            <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea
            placeholder="Type your reply..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
                }
            }}
            className="flex-1 rounded-lg px-4 py-2 focus-visible:ring-primary min-h-[40px] max-h-[120px] resize-none"
            rows={1}
            disabled={userRole === 'staff' && isTicketLockedByOther}
            />
            <Button size="icon" onClick={handleSendMessage} className="rounded-full bg-primary hover:bg-primary/90 self-end" disabled={userRole === 'staff' && isTicketLockedByOther}>
            <SendHorizonal className="h-5 w-5" />
            </Button>
        </div>
        </footer>
    </>
    )
};


export function TicketDetailClient({ initialTicket, onUpdateTicket, userRole, staffAvatar = defaultStaffAvatar, currentStaffId }: TicketDetailClientProps) {
  const [ticket, setTicket] = useState(initialTicket);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState<'info' | 'discussion'>('info');
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // When initialTicket from props changes (i.e., navigating to a new ticket),
    // update the local state.
    setTicket(initialTicket);
  }, [initialTicket]);

  const isTicketLockedByOther = ticket.isLocked && ticket.lockedByStaffId !== currentStaffId;
  const isTicketLockedByCurrentUser = ticket.isLocked && ticket.lockedByStaffId === currentStaffId;

  const sendMessageMutation = useMutation({
      mutationFn: createTicketMessage,
      onSuccess: (data, variables) => {
          queryClient.invalidateQueries({ queryKey: ['ticketMessages', variables.ticketId] });
          queryClient.invalidateQueries({ queryKey: ['tickets'] }); // To update last updated etc.
          queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      },
      onError: (error: Error) => {
           toast({
              variant: "destructive",
              title: "Reply Failed",
              description: error.message,
          });
      }
  });

  useEffect(() => {
    if (userRole === 'staff' && currentStaffId && !ticket.isLocked) {
      const updatedTicket = { id: ticket.id, isLocked: true, lockedByStaffId: currentStaffId };
      onUpdateTicket(updatedTicket);
    }
  }, [ticket.id, userRole, currentStaffId, ticket.isLocked, onUpdateTicket]);
  
  const handleUpdate = (updates: Partial<Ticket>) => {
      const updatedData = { ...ticket, ...updates, updatedAt: new Date().toISOString() };
      setTicket(updatedData); // Update local state immediately
      onUpdateTicket({ id: ticket.id, ...updates }); // Send only the changes to the parent/API
  }

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (userRole === 'staff' && isTicketLockedByOther) return;
    handleUpdate({ status: newStatus });
    toast({
      title: "Ticket Status Updated",
      description: `Ticket is now ${newStatus}.`,
    });
  };

  const handleAssignmentChange = (staffId: string) => {
    if (userRole === 'staff' && isTicketLockedByOther) return;
    const selectedStaff = dummyStaffMembers.find(s => s.id === staffId);
    if (!selectedStaff && staffId !== "unassigned") {
      toast({ variant: "destructive", title: "Error", description: "Invalid staff member selected." });
      return;
    }

    const updates = { 
      assignedTo: staffId === "unassigned" ? undefined : selectedStaff?.name, 
      assigneeAvatar: staffId === "unassigned" ? undefined : selectedStaff?.avatar,
    };
    handleUpdate(updates);
    toast({
      title: "Ticket Assignment Updated",
      description: staffId === "unassigned" ? `Ticket unassigned.` : `Ticket assigned to ${selectedStaff?.name}.`,
    });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;
    if (userRole === 'staff' && isTicketLockedByOther) return;

    sendMessageMutation.mutate({
      ticketId: ticket.id,
      from: userRole,
      text: newMessage.trim(),
    });
    setNewMessage("");

    toast({
      title: userRole === 'staff' ? "Reply Sent" : "Message Sent",
      description: "Your reply has been added to the ticket.",
    });
  };

  const handleUnlockTicket = () => {
    if (userRole === 'staff' && isTicketLockedByCurrentUser) {
      handleUpdate({ isLocked: false, lockedByStaffId: undefined });
      toast({
        title: "Ticket Unlocked",
        description: "This ticket is now available for other staff members.",
      });
    }
  };
  
  const lockerName = ticket.lockedByStaffId ? dummyStaffMembers.find(s => s.id === ticket.lockedByStaffId)?.name : 'another staff member';

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="p-2 border-b bg-card sticky top-0 z-10">
          <div className="flex w-full">
            <Button
              variant={activeMobileTab === 'info' ? 'default' : 'outline'}
              onClick={() => setActiveMobileTab('info')}
              className="flex-1 rounded-r-none"
            >
              Info
            </Button>
            <Button
              variant={activeMobileTab === 'discussion' ? 'default' : 'outline'}
              onClick={() => setActiveMobileTab('discussion')}
              className="flex-1 rounded-l-none border-l-0"
            >
              Discussion
            </Button>
          </div>
        </div>

        {activeMobileTab === 'info' && (
          <ScrollArea className="flex-1 bg-card">
            <div className="p-4">
              <TicketInfoContent 
                ticket={ticket}
                userRole={userRole}
                isTicketLockedByOther={isTicketLockedByOther}
                isTicketLockedByCurrentUser={isTicketLockedByCurrentUser}
                lockerName={lockerName}
                handleUnlockTicket={handleUnlockTicket}
                handleStatusChange={handleStatusChange}
                handleAssignmentChange={handleAssignmentChange}
              />
            </div>
          </ScrollArea>
        )}

        {activeMobileTab === 'discussion' && (
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            <TicketDiscussionContent 
                isMobileContext={true}
                ticket={ticket}
                userRole={userRole}
                staffAvatar={staffAvatar}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleSendMessage={handleSendMessage}
                isTicketLockedByOther={isTicketLockedByOther}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full max-h-screen overflow-hidden">
      <div className="lg:w-1/3 lg:max-w-md xl:max-w-lg lg:border-r bg-card overflow-y-auto p-4 md:p-6">
        <TicketInfoContent 
            ticket={ticket}
            userRole={userRole}
            isTicketLockedByOther={isTicketLockedByOther}
            isTicketLockedByCurrentUser={isTicketLockedByCurrentUser}
            lockerName={lockerName}
            handleUnlockTicket={handleUnlockTicket}
            handleStatusChange={handleStatusChange}
            handleAssignmentChange={handleAssignmentChange}
          />
      </div>
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <TicketDiscussionContent 
            ticket={ticket}
            userRole={userRole}
            staffAvatar={staffAvatar}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            isTicketLockedByOther={isTicketLockedByOther}
        />
      </div>
    </div>
  );
}
