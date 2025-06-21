
"use client";

import { useState, useRef, useEffect } from "react";
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


interface TicketDetailClientProps {
  initialTicket: Ticket;
  onUpdateTicket: (updatedTicket: Ticket) => void;
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

export function TicketDetailClient({ initialTicket, onUpdateTicket, userRole, staffAvatar = defaultStaffAvatar, currentStaffId }: TicketDetailClientProps) {
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState<'info' | 'discussion'>('info');
  
  const isTicketLockedByOther = initialTicket.isLocked && initialTicket.lockedByStaffId !== currentStaffId;
  const isTicketLockedByCurrentUser = initialTicket.isLocked && initialTicket.lockedByStaffId === currentStaffId;

  // Auto-lock ticket if viewed by staff and not already locked.
  // This effect now depends on initialTicket.id to run only once per ticket page load.
  useEffect(() => {
    if (userRole === 'staff' && currentStaffId && !initialTicket.isLocked) {
      const updatedTicket = { ...initialTicket, isLocked: true, lockedByStaffId: currentStaffId, updatedAt: new Date().toISOString() };
      onUpdateTicket(updatedTicket);
      toast({
        title: "Ticket Locked",
        description: "You have locked this ticket for editing.",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTicket.id, userRole, currentStaffId]);
  
  useEffect(() => {
    if (scrollAreaRef.current && activeMobileTab === 'discussion') {
      // @ts-ignore
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [initialTicket.messages, activeMobileTab]);

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (userRole === 'staff' && isTicketLockedByOther) return;
    const updatedTicket = { ...initialTicket, status: newStatus, updatedAt: new Date().toISOString() };
    onUpdateTicket(updatedTicket); 
    toast({
      title: "Ticket Status Updated",
      description: `Ticket "${initialTicket.subject}" is now ${newStatus}.`,
    });
  };

  const handleAssignmentChange = (staffId: string) => {
    if (userRole === 'staff' && isTicketLockedByOther) return;
    const selectedStaff = dummyStaffMembers.find(s => s.id === staffId);
    if (!selectedStaff && staffId !== "unassigned") {
      toast({ variant: "destructive", title: "Error", description: "Invalid staff member selected." });
      return;
    }

    const updatedTicket = { 
      ...initialTicket, 
      assignedTo: staffId === "unassigned" ? undefined : selectedStaff?.name, 
      assigneeAvatar: staffId === "unassigned" ? undefined : selectedStaff?.avatar,
      updatedAt: new Date().toISOString() 
    };
    onUpdateTicket(updatedTicket);
    toast({
      title: "Ticket Assignment Updated",
      description: staffId === "unassigned" ? `Ticket unassigned.` : `Ticket assigned to ${selectedStaff?.name}.`,
    });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;
    if (userRole === 'staff' && isTicketLockedByOther) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      from: userRole,
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      avatar: userRole === "student" ? initialTicket.studentAvatar : staffAvatar,
    };
    
    const updatedTicket = { 
      ...initialTicket, 
      messages: [...initialTicket.messages, message],
      updatedAt: new Date().toISOString(),
    };
    
    setNewMessage(""); // Clear the input immediately.
    onUpdateTicket(updatedTicket); // Sync with parent.

    toast({
      title: userRole === 'staff' ? "Reply Sent" : "Message Sent",
      description: "Your reply has been added to the ticket.",
    });
  };

  const handleUnlockTicket = () => {
    if (userRole === 'staff' && isTicketLockedByCurrentUser) {
      const updatedTicket = { ...initialTicket, isLocked: false, lockedByStaffId: undefined, updatedAt: new Date().toISOString() };
      onUpdateTicket(updatedTicket);
      toast({
        title: "Ticket Unlocked",
        description: "This ticket is now available for other staff members.",
      });
    }
  };
  
  const lockerName = initialTicket.lockedByStaffId ? dummyStaffMembers.find(s => s.id === initialTicket.lockedByStaffId)?.name : 'another staff member';

  const TicketInfoContent = () => (
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
        <CardTitle className="text-xl md:text-2xl font-headline">{initialTicket.subject}</CardTitle>
        <CardDescription>Ticket ID: {initialTicket.id}</CardDescription>
      </CardHeader>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="ticket-status">Status</Label>
          <Select
            value={initialTicket.status} 
            onValueChange={(value: TicketStatus) => handleStatusChange(value)}
            disabled={(userRole === 'student' && initialTicket.status === 'Closed') || (userRole === 'staff' && isTicketLockedByOther)}
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
          <Badge className={cn("text-sm", priorityColors[initialTicket.priority])}>{initialTicket.priority}</Badge>
        </div>

        {userRole === 'staff' && (
          <div>
            <Label htmlFor="ticket-assignment">Assigned To</Label>
            <Select
              value={dummyStaffMembers.find(s => s.name === initialTicket.assignedTo)?.id || "unassigned"}
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

        {initialTicket.assignedTo && (
           <div className="flex items-center gap-2 text-sm">
            <UserCog className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Assigned:</span>
            {initialTicket.assigneeAvatar && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={initialTicket.assigneeAvatar} alt={initialTicket.assignedTo} data-ai-hint="staff avatar"/>
                <AvatarFallback>{initialTicket.assignedTo.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <span>{initialTicket.assignedTo}</span>
          </div>
        )}


        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Student:</span>
          <span>{initialTicket.studentName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Created:</span>
          <span>{new Date(initialTicket.createdAt).toLocaleString()}</span>
        </div>
        {initialTicket.updatedAt && (
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Last Updated:</span>
            <span>{new Date(initialTicket.updatedAt).toLocaleString()}</span>
          </div>
        )}
        <div>
          <h4 className="text-sm font-medium mb-1">Description</h4>
          <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md whitespace-pre-line">{initialTicket.description}</p>
        </div>
      </div>
    </>
  );

  const TicketDiscussionContent = ({ isMobileContext = false }: { isMobileContext?: boolean }) => (    
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
          {initialTicket.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-end gap-2 max-w-[85%] sm:max-w-[75%]", 
                message.from === userRole ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <Avatar className="h-8 w-8">
                 <AvatarImage 
                  src={message.from === 'student' ? initialTicket.studentAvatar : (message.avatar || staffAvatar)} 
                  alt={message.from} 
                  data-ai-hint="avatar person"
                />
                <AvatarFallback>
                  {message.from === 'student' ? initialTicket.studentName.charAt(0).toUpperCase() : (message.from === 'staff' ? 'S' : '?')}
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
                  {message.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="px-4 py-3 border-t bg-card sticky bottom-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground" disabled={userRole === 'staff' && isTicketLockedByOther}>
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
  );

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
              <TicketInfoContent />
            </div>
          </ScrollArea>
        )}

        {activeMobileTab === 'discussion' && (
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            <TicketDiscussionContent isMobileContext={true} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full max-h-screen overflow-hidden">
      <div className="lg:w-1/3 lg:max-w-md xl:max-w-lg lg:border-r bg-card overflow-y-auto p-4 md:p-6">
        <TicketInfoContent />
      </div>
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <TicketDiscussionContent />
      </div>
    </div>
  );
}
