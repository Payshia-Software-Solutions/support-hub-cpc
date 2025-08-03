

"use client";

import * as React from "react";
import { useState, useRef, useEffect, type Dispatch, type SetStateAction, memo } from "react";
import type { Ticket, Message, TicketStatus, StaffMember, CreateTicketMessageClientPayload, Attachment, FullStudentData, StudentEnrollment, ApiPaymentRecord } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip, SendHorizonal, CalendarDays, User, ShieldCheck, MessageSquare, UserCog, Lock, Unlock, Tag, FileText, XCircle, ZoomIn, RotateCw, ZoomOut, Mail, Phone, Loader2, Building, Home, MapPin, CheckCircle, XCircle as XCircleEligibility } from "lucide-react"; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"; 
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTicketMessages, createTicketMessage, updateTicketStatus, markTicketMessagesAsRead, getStudentFullInfo } from "@/lib/api";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import Image from "next/image";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";


interface TicketDetailClientProps {
  initialTicket: Ticket;
  onUpdateTicket: (updatedTicket: Partial<Ticket> & { id: string }) => void;
  onAssignTicket?: (payload: { ticketId: string; assignedTo: string; assigneeAvatar: string; lockedByStaffId: string; }) => void;
  onUnlockTicket?: (ticketId: string) => void;
  userRole: 'student' | 'staff';
  staffAvatar?: string; 
  currentStaffUsername?: string;
  staffMembers?: StaffMember[];
}

// Local attachment type with a unique ID for state management
interface StagedAttachment extends Attachment {
  id: string; 
}


const priorityColors: Record<Ticket["priority"], string> = {
  High: "bg-red-500 hover:bg-red-600 text-white",
  Medium: "bg-yellow-500 hover:bg-yellow-600 text-white",
  Low: "bg-green-500 hover:bg-green-600 text-white",
};

const defaultStaffAvatar = "https://placehold.co/40x40.png?text=S";

// --- Sub-components for better readability ---

const ImageViewerDialog = ({ imageUrl, onOpenChange }: { imageUrl: string | null; onOpenChange: (open: boolean) => void }) => {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        // Reset state when a new image is opened
        setScale(1);
        setRotation(0);
    }, [imageUrl]);

    if (!imageUrl) return null;

    return (
        <Dialog open={!!imageUrl} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-2 sm:p-4 flex flex-col">
                <DialogHeader className="p-2 pb-0">
                     <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setScale(s => s + 0.2)}><ZoomIn className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => setScale(s => Math.max(0.2, s - 0.2))}><ZoomOut className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => setRotation(r => r + 90)}><RotateCw className="h-4 w-4" /></Button>
                    </div>
                </DialogHeader>
                <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center relative">
                    <Image
                        src={imageUrl}
                        alt="Full size image view"
                        layout="fill"
                        objectFit="contain"
                        className="transition-transform duration-200"
                        style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

const EnrollmentCard = ({ enrollment }: { enrollment: StudentEnrollment }) => (
    <Card>
        <CardHeader>
            <CardTitle>{enrollment.parent_course_name}</CardTitle>
            <CardDescription>Course Code: {enrollment.course_code} | Batch: {enrollment.batch_name}</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" className="w-full">
                <AccordionItem value="assignments">
                    <AccordionTrigger>Assignment Grades (Avg: {enrollment.assignment_grades.average_grade}%)</AccordionTrigger>
                    <AccordionContent>
                        <Table>
                           <TableHeader><TableRow><TableHead>Assignment</TableHead><TableHead className="text-right">Grade</TableHead></TableRow></TableHeader>
                           <TableBody>
                                {enrollment.assignment_grades.assignments.map(a => (
                                    <TableRow key={a.assignment_id}><TableCell>{a.assignment_name}</TableCell><TableCell className="text-right">{parseFloat(a.grade).toFixed(2)}%</TableCell></TableRow>
                                ))}
                           </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="deliveries">
                    <AccordionTrigger>Delivery Orders ({enrollment.deliveryOrders.length})</AccordionTrigger>
                     <AccordionContent>
                        {/* Mobile view */}
                        <div className="md:hidden space-y-3">
                            {enrollment.deliveryOrders.map(d => (
                                <div key={d.id} className="p-3 border rounded-md text-sm space-y-1">
                                    <p className="font-medium">{d.delivery_title}</p>
                                    <p className="text-muted-foreground"><strong className="text-foreground">Tracking #:</strong> <span className="whitespace-nowrap break-all">{d.tracking_number}</span></p>
                                    <p className="text-muted-foreground"><strong className="text-foreground">Status:</strong> {d.active_status}</p>
                                </div>
                            ))}
                        </div>
                        {/* Desktop view */}
                        <div className="hidden md:block">
                            <Table>
                               <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Tracking #</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                               <TableBody>
                                    {enrollment.deliveryOrders.map(d => (
                                        <TableRow key={d.id}>
                                            <TableCell>{d.delivery_title}</TableCell>
                                            <TableCell className="whitespace-nowrap">{d.tracking_number}</TableCell>
                                            <TableCell>{d.active_status}</TableCell>
                                        </TableRow>
                                    ))}
                               </TableBody>
                            </Table>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="certificates">
                    <AccordionTrigger>Certificate Records ({enrollment.certificateRecords.length})</AccordionTrigger>
                     <AccordionContent>
                        {/* Mobile view */}
                        <div className="md:hidden space-y-3">
                            {enrollment.certificateRecords.map(c => (
                                <div key={c.id} className="p-3 border rounded-md text-sm space-y-1">
                                    <p className="font-medium">{c.type}</p>
                                    <p className="text-muted-foreground"><strong className="text-foreground">ID:</strong> {c.certificate_id}</p>
                                    <p className="text-muted-foreground"><strong className="text-foreground">Printed On:</strong> <span className="whitespace-nowrap">{new Date(c.print_date).toLocaleDateString()}</span></p>
                                </div>
                            ))}
                        </div>
                        {/* Desktop view */}
                        <div className="hidden md:block">
                            <Table>
                               <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>ID</TableHead><TableHead>Printed On</TableHead></TableRow></TableHeader>
                               <TableBody>
                                    {enrollment.certificateRecords.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell>{c.type}</TableCell>
                                            <TableCell>{c.certificate_id}</TableCell>
                                            <TableCell className="whitespace-nowrap">{new Date(c.print_date).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                               </TableBody>
                            </Table>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="eligibility">
                    <AccordionTrigger className="flex items-center gap-2">
                        Certificate Eligibility 
                        <Badge variant={enrollment.certificate_eligibility ? 'default' : 'destructive'}>
                            {enrollment.certificate_eligibility ? "Eligible" : "Not Eligible"}
                        </Badge>
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="space-y-2">
                            {enrollment.criteria_details.map(c => (
                                <li key={c.id} className="flex items-center justify-between p-2 rounded-md border">
                                    <div className="flex items-center gap-2">
                                        {c.evaluation.completed ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircleEligibility className="h-5 w-5 text-red-500" />}
                                        <span>{c.list_name}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">({c.evaluation.currentValue} / {c.evaluation.requiredValue})</span>
                                </li>
                            ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
    </Card>
);

const StudentInfoDisplay = ({ studentInfo }: { studentInfo: FullStudentData }) => {
    const { studentInfo: details, studentBalance, studentEnrollments } = studentInfo;

    const infoItem = (icon: React.ReactNode, label: string, value: string | undefined | null) => {
        if (!value) return null;
        return (
            <div className="flex items-start text-sm">
                <div className="text-muted-foreground w-6 h-6 flex items-center justify-center shrink-0">{icon}</div>
                <div className="ml-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium text-card-foreground break-all">{value}</p>
                </div>
            </div>
        );
    };

    const paymentRecordsArray = Object.values(studentBalance.paymentRecords || {});
    const enrollmentsArray = Object.values(studentEnrollments || {});

    return (
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Student Profile</CardTitle>
                        <CardDescription>{details.student_id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Personal</h4>
                            {infoItem(<User className="h-4 w-4"/>, "Full Name", details.full_name)}
                            {infoItem(<User className="h-4 w-4"/>, "Name with Initials", details.name_with_initials)}
                            {infoItem(<User className="h-4 w-4"/>, "Name on Certificate", details.name_on_certificate)}
                            {infoItem(<User className="h-4 w-4"/>, "NIC", details.nic)}
                        </div>
                        <Separator/>
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Contact</h4>
                            {infoItem(<Mail className="h-4 w-4"/>, "Email", details.e_mail)}
                            {infoItem(<Phone className="h-4 w-4"/>, "Phone 1", details.telephone_1)}
                            {infoItem(<Phone className="h-4 w-4"/>, "Phone 2", details.telephone_2)}
                        </div>
                        <Separator/>
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Address</h4>
                            {infoItem(<Home className="h-4 w-4"/>, "Address Line 1", details.address_line_1)}
                            {infoItem(<Home className="h-4 w-4"/>, "Address Line 2", details.address_line_2)}
                            {infoItem(<MapPin className="h-4 w-4"/>, "City", details.city)}
                            {infoItem(<Building className="h-4 w-4"/>, "District", details.district)}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="payments" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Paid</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">LKR {studentBalance.totalPaymentAmount.toLocaleString()}</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Outstanding</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-destructive">LKR {studentBalance.studentBalance.toLocaleString()}</p></CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader><CardTitle className="text-lg">Payment History</CardTitle></CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader><TableRow><TableHead>Receipt #</TableHead><TableHead>Course</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {paymentRecordsArray.map(rec => (
                                    <TableRow key={rec.id}>
                                        <TableCell className="font-mono text-xs">{rec.receipt_number}</TableCell>
                                        <TableCell>{rec.course_code}</TableCell>
                                        <TableCell>{parseFloat(rec.paid_amount).toLocaleString()}</TableCell>
                                        <TableCell>{rec.paid_date}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="enrollments" className="mt-4 space-y-4">
                {enrollmentsArray.map(enrollment => (
                    <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                ))}
             </TabsContent>
        </Tabs>
    );
};


const TicketInfoContent = memo(({ 
  ticket, 
  userRole, 
  isTicketLockedByOther,
  isTicketLockedByCurrentUser,
  lockerName,
  handleUnlockTicket,
  handleStatusChange,
  handleAssignmentChange,
  staffMembers = [],
  onViewImage,
}: {
  ticket: Ticket,
  userRole: 'student' | 'staff',
  isTicketLockedByOther: boolean,
  isTicketLockedByCurrentUser: boolean,
  lockerName: string | undefined,
  handleUnlockTicket: () => void,
  handleStatusChange: (newStatus: TicketStatus) => void,
  handleAssignmentChange: (staffId: string) => void,
  staffMembers?: StaffMember[];
  onViewImage: (url: string) => void;
}) => {
  
  const assignedStaffMember = staffMembers.find(s => s.username === ticket.assignedTo);
  const assignedStaffName = assignedStaffMember?.name || ticket.assignedTo;
  
  return (
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

          <div>
            <h4 className="text-sm font-medium mb-1">Category</h4>
            <Badge variant="secondary" className="text-sm">
              <Tag className="w-3 h-3 mr-1.5" />
              {ticket.category}
            </Badge>
          </div>

          {userRole === 'staff' && (
            <div>
              <Label htmlFor="ticket-assignment">Assigned To</Label>
              <Select
                value={staffMembers.find(s => s.username === ticket.assignedTo)?.username || "unassigned"}
                onValueChange={handleAssignmentChange}
                name="ticket-assignment"
                disabled={isTicketLockedByOther}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Assign to staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staffMembers.map(staff => (
                    <SelectItem key={staff.id} value={staff.username}>
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
                  <AvatarImage src={ticket.assigneeAvatar} alt={assignedStaffName || ''} data-ai-hint="staff avatar"/>
                  <AvatarFallback>{(assignedStaffName || '').split(' ').map(n => n[0]).join('').substring(0, 2) || 'S'}</AvatarFallback>
                </Avatar>
              )}
              <span>{assignedStaffName}</span>
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
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Attachments</h4>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((att, index) => (
                  <button
                    key={index}
                    onClick={() => onViewImage(att.url)}
                    className="relative group w-20 h-20 rounded-md overflow-hidden border"
                  >
                    <Image
                      src={att.url}
                      alt={att.name}
                      layout="fill"
                      objectFit="cover"
                      className="group-hover:scale-110 transition-transform duration-200"
                    />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="h-6 w-6 text-white"/>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
    </>
  );
});
TicketInfoContent.displayName = "TicketInfoContent";

const UnreadDivider = () => (
    <div className="relative my-4">
        <Separator />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-background">
            <span className="text-xs font-semibold text-destructive">Unread Messages</span>
        </div>
    </div>
);

const TicketDiscussionContent = ({ 
  ticket,
  userRole,
  staffAvatar,
  newMessage,
  setNewMessage,
  stagedAttachments,
  handleSendMessage,
  handleAttachmentClick,
  removeStagedAttachment,
  isTicketLockedByOther,
  fileInputRef,
  handleFileSelect,
  isSending,
 }: {
    ticket: Ticket,
    userRole: 'student' | 'staff',
    staffAvatar: string,
    newMessage: string,
    setNewMessage: Dispatch<SetStateAction<string>>,
    stagedAttachments: StagedAttachment[],
    handleSendMessage: () => void,
    handleAttachmentClick: () => void,
    removeStagedAttachment: (id: string) => void,
    isTicketLockedByOther: boolean,
    fileInputRef: React.RefObject<HTMLInputElement>,
    handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void,
    isSending: boolean,
 }) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const { data: messages, isLoading, isError } = useQuery<Message[]>({
        queryKey: ['ticketMessages', ticket.id],
        queryFn: () => getTicketMessages(ticket.id),
        enabled: !!ticket.id,
        refetchInterval: 3000, // Refetch every 3 seconds
    });

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages, isSending]);

    useEffect(() => {
        if (!isLoading && messages && messages.length > 0) {
            const fromRole = userRole === 'student' ? 'staff' : 'student';
            const unreadIds = messages
                .filter(m => m.readStatus === 'Unread' && m.from === fromRole)
                .map(m => String(m.id));

            if (unreadIds.length > 0) {
                markTicketMessagesAsRead(unreadIds).catch(err => {
                    console.error("Failed to mark messages as read:", err);
                });
            }
        }
    }, [messages, userRole, isLoading]);

    // Find the first unread message for the current user
    const firstUnreadIndex = messages?.findIndex(m => m.readStatus === 'Unread' && m.from !== userRole) ?? -1;

    return (
    <div className="flex flex-col h-full bg-background">
        <ImageViewerDialog imageUrl={viewingImage} onOpenChange={(open) => !open && setViewingImage(null)} />
        <header className="px-4 py-3 border-b bg-card flex items-center gap-3 shrink-0">
          <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          <h2 className="font-semibold text-md md:text-lg">Ticket Discussion</h2>
        </header>
        
        <ScrollArea className="flex-1 px-4 py-4" ref={scrollAreaRef}>
        <div className="space-y-6">
            {isLoading && (
                 <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%] mr-auto">
                    <Avatar className="h-8 w-8">
                        <AvatarImage 
                            src={userRole === 'staff' ? ticket.studentAvatar : staffAvatar}
                            alt="Typing..." 
                            data-ai-hint="avatar person"
                        />
                        <AvatarFallback>
                            {userRole === 'staff' ? (ticket.studentName?.charAt(0).toUpperCase() || 'U') : 'S'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="p-1 rounded-xl shadow-sm bg-card border rounded-bl-none">
                        <TypingIndicator />
                    </div>
                </div>
            )}
            {isError && <p className="text-destructive text-center">Failed to load messages.</p>}
            {!isLoading && messages?.map((message, index) => {
              const isStaffMessage = message.from === 'staff';
              const isCurrentUserMessage = (message.from === 'student' && userRole === 'student') || (isStaffMessage && userRole === 'staff');
              const isOptimistic = String(message.id).startsWith('optimistic-');
              const hasText = message.text && message.text.trim().length > 0;
              const hasAttachment = message.attachments && message.attachments.length > 0;
              
              if (!hasText && !hasAttachment) {
                return null;
              }

              const showUnreadDivider = firstUnreadIndex !== -1 && index === firstUnreadIndex;

              return (
                <React.Fragment key={message.id}>
                    {showUnreadDivider && <UnreadDivider />}
                    <div
                        className={cn(
                        "flex items-end gap-2 max-w-[85%] sm:max-w-[75%]", 
                        isCurrentUserMessage ? "ml-auto flex-row-reverse" : "mr-auto",
                        isOptimistic && "opacity-60"
                        )}
                    >
                        <Avatar className="h-8 w-8">
                        <AvatarImage 
                            src={isStaffMessage ? (message.avatar || staffAvatar) : ticket.studentAvatar} 
                            alt={message.from} 
                            data-ai-hint="avatar person"
                        />
                        <AvatarFallback>
                            {isStaffMessage ? 'S' : (ticket.studentName?.charAt(0).toUpperCase() || 'U')}
                        </AvatarFallback>
                        </Avatar>
                        <div
                            className={cn(
                                "rounded-xl shadow-sm",
                                isCurrentUserMessage
                                ? "bg-primary/90 text-primary-foreground rounded-br-none"
                                : "bg-card border rounded-bl-none",
                                !hasText && hasAttachment && "p-1.5"
                            )}
                        >
                        {hasAttachment && message.attachments?.map((att, index) => att.type === 'image' && att.url && (
                            <div key={index} className={cn(hasText && "mb-2", "group relative cursor-pointer")} onClick={() => setViewingImage(att.url)}>
                                <Image
                                    src={att.url}
                                    alt={att.name}
                                    width={200}
                                    height={200}
                                    className="rounded-md object-cover"
                                    data-ai-hint="attached image"
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ZoomIn className="h-8 w-8 text-white"/>
                                </div>
                            </div>
                        ))}
                        {hasText && <p className="text-sm p-3 pt-2 pb-1">{message.text}</p>}
                        <p className={cn("text-xs mt-1 text-right opacity-70", hasText ? "pr-3 pb-2" : "p-0")}>
                            {new Date(message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        </div>
                    </div>
                </React.Fragment>
              );
            })}
             {isSending && (
                <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ml-auto flex-row-reverse">
                    <Avatar className="h-8 w-8">
                       <AvatarImage 
                          src={userRole === 'staff' ? staffAvatar : ticket.studentAvatar} 
                          alt="Sending..."
                          data-ai-hint="avatar person"
                        />
                       <AvatarFallback>
                          {userRole === 'staff' ? 'S' : ticket.studentName?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className={cn("p-1 rounded-xl shadow-sm", "bg-primary/90 text-primary-foreground rounded-br-none")}>
                        <TypingIndicator />
                    </div>
                </div>
            )}
        </div>
        </ScrollArea>

        <footer className="px-4 py-3 border-t bg-card shrink-0">
          {stagedAttachments.length > 0 && (
            <ScrollArea className="max-h-32 w-full mb-2">
              <div className="flex gap-2 p-1">
                {stagedAttachments.map(att => (
                  <div key={att.id} className="relative group shrink-0">
                    <div className="p-1 border rounded-md bg-muted/50">
                        {att.type === 'image' ? (
                          <Image src={att.url} alt={att.name} width={48} height={48} className="rounded object-cover h-12 w-12" data-ai-hint="image preview"/>
                        ) : (
                          <div className="h-12 w-12 flex items-center justify-center"><FileText className="h-6 w-6 text-muted-foreground" /></div>
                        )}
                    </div>
                     <button onClick={() => removeStagedAttachment(att.id)} className="absolute -top-1 -right-1 bg-background text-destructive rounded-full p-0.5 group-hover:opacity-100 opacity-0 transition-opacity">
                        <XCircle className="h-4 w-4" />
                      </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground" disabled={(userRole === 'staff' && isTicketLockedByOther)} onClick={handleAttachmentClick}>
              <Paperclip className="h-5 w-5" />
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" multiple />
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
    </div>
    )
};


export function TicketDetailClient({ initialTicket, onUpdateTicket, onAssignTicket, onUnlockTicket, userRole, staffAvatar = defaultStaffAvatar, currentStaffUsername, staffMembers }: TicketDetailClientProps) {
  const [ticket, setTicket] = useState(initialTicket);
  const [newMessage, setNewMessage] = useState("");
  const [stagedAttachments, setStagedAttachments] = useState<StagedAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [activeMobileTab, setActiveMobileTab] = useState<'info' | 'discussion' | 'student'>('discussion');
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const [studentDetails, setStudentDetails] = useState<FullStudentData | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isStudentInfoDialogOpen, setIsStudentInfoDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  useEffect(() => {
    setTicket(initialTicket);
  }, [initialTicket]);

  const isTicketLockedByOther = userRole === 'staff' && ticket.isLocked && ticket.lockedByStaffId !== currentStaffUsername;
  const isTicketLockedByCurrentUser = userRole === 'staff' && ticket.isLocked && ticket.lockedByStaffId === currentStaffUsername;

  const sendMessageMutation = useMutation({
      mutationFn: (payload: {data: CreateTicketMessageClientPayload, ticketId: string}) => createTicketMessage(payload.data, payload.ticketId),
      onMutate: async ({data}) => {
          setIsSending(true);
          const { ticketId } = data;
          
          await queryClient.cancelQueries({ queryKey: ['ticketMessages', ticketId] });
          const previousMessages = queryClient.getQueryData<Message[]>(['ticketMessages', ticketId]) || [];
          
          setNewMessage("");
          setStagedAttachments([]);
          if (fileInputRef.current) {
              fileInputRef.current.value = "";
          }
          return { previousMessages, ticketId };
      },
      onError: (error: Error, variables, context: any) => {
           if (context?.previousMessages) {
              queryClient.setQueryData(['ticketMessages', context.ticketId], context.previousMessages);
           }
           toast({
             variant: "destructive",
             title: "Message Send Failed",
             description: error.message,
           });
      },
      onSettled: (data, error, variables) => {
          setIsSending(false);
          queryClient.invalidateQueries({ queryKey: ['ticketMessages', variables.ticketId] });
      }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ ticketId, newStatus }: { ticketId: string, newStatus: TicketStatus }) => 
      updateTicketStatus(ticketId, newStatus),
    onMutate: async ({ ticketId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['ticket', ticketId] });
      const previousTicket = queryClient.getQueryData<Ticket>(['ticket', ticketId]);
      if (previousTicket) {
        const optimisticTicket = { ...previousTicket, status: newStatus };
        queryClient.setQueryData(['ticket', ticketId], optimisticTicket);
        setTicket(optimisticTicket);
      }
      return { previousTicket };
    },
    onError: (err: Error, variables, context: any) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(['ticket', variables.ticketId], context.previousTicket);
        setTicket(context.previousTicket);
      }
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message,
      });
    },
    onSuccess: (updatedTicket, variables) => {
      queryClient.setQueryData(['ticket', variables.ticketId], updatedTicket);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketMessages', variables.ticketId] });
      setTicket(updatedTicket); 
      toast({
        title: "Ticket Status Updated",
        description: `Ticket is now '${variables.newStatus}'.`,
      });
    },
  });
  
  const handleUpdate = (updates: Partial<Ticket>) => {
      const updatedData = { ...ticket, ...updates, updatedAt: new Date().toISOString() };
      setTicket(updatedData);
      onUpdateTicket({ id: ticket.id, ...updates });
  }

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (userRole === 'staff' && isTicketLockedByOther) return;
    if (newStatus === ticket.status) return;
    updateStatusMutation.mutate({ ticketId: ticket.id, newStatus });
  };

  const handleAssignmentChange = (staffUsername: string) => {
    if (userRole === 'staff' && isTicketLockedByOther) return;

    if (staffUsername === "unassigned") {
      const updates: Partial<Ticket> = { 
        assignedTo: undefined, 
        assigneeAvatar: undefined,
        isLocked: false,
        lockedByStaffId: undefined,
      };
      handleUpdate(updates);
    } else {
        const selectedStaff = staffMembers?.find(s => s.username === staffUsername);
        if (!selectedStaff || !currentStaffUsername) {
          toast({ variant: "destructive", title: "Error", description: "Invalid staff member or user context." });
          return;
        }

        if (onAssignTicket) {
            onAssignTicket({
                ticketId: ticket.id,
                assignedTo: selectedStaff.username,
                assigneeAvatar: selectedStaff.avatar,
                lockedByStaffId: selectedStaff.username,
            });
        } else {
            console.error("onAssignTicket prop not provided");
            toast({ variant: "destructive", title: "Configuration Error", description: "Assignment functionality is not configured." });
        }
    }
  };

  const handleSendMessage = () => {
    if ((newMessage.trim() === "" && stagedAttachments.length === 0) || !user?.username) return;
    if (userRole === 'staff' && isTicketLockedByOther) return;

    sendMessageMutation.mutate({
      ticketId: ticket.id,
      data: {
        from: userRole,
        text: newMessage.trim(),
        attachments: stagedAttachments,
        time: new Date().toISOString(),
        createdBy: user.username,
      }
    });
  };

  const handleUnlockTicket = () => {
    if (userRole === 'staff' && isTicketLockedByCurrentUser && onUnlockTicket) {
      onUnlockTicket(ticket.id);
    }
  };
  
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file, index) => {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit per file
          toast({ variant: "destructive", title: "File too large", description: `"${file.name}" is over 5MB and won't be attached.` });
          return;
        }
        if (!file.type.startsWith("image/")) {
          toast({ variant: "destructive", title: "Invalid file type", description: `"${file.name}" is not an image.` });
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const newAttachment: Attachment = {
                id: `${Date.now()}-${index}-${Math.random()}`,
                type: "image",
                url: reader.result as string,
                name: file.name,
                file: file,
            };
            setStagedAttachments(prev => [...prev, newAttachment]);
        };
        reader.readAsDataURL(file);
      });

      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
    }
  };
  
  const handleFetchStudentDetails = async () => {
    if (!ticket.studentNumber) {
        toast({ variant: 'destructive', title: 'Error', description: 'No student number associated with this ticket.' });
        return;
    }
    setIsFetchingDetails(true);
    if (!isMobile) {
        setIsStudentInfoDialogOpen(true);
    }
    try {
        const data = await getStudentFullInfo(ticket.studentNumber);
        setStudentDetails(data);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to Fetch Details', description: error.message });
        setStudentDetails(null);
        if (!isMobile) {
            setIsStudentInfoDialogOpen(false);
        }
    } finally {
        setIsFetchingDetails(false);
    }
  };

  const removeStagedAttachment = (idToRemove: string) => {
    setStagedAttachments(prev => prev.filter(att => att.id !== idToRemove));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const lockerName = ticket.lockedByStaffId ? staffMembers?.find(s => s.username === ticket.lockedByStaffId)?.name : 'another staff member';

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full">
        <ImageViewerDialog imageUrl={viewingImage} onOpenChange={(open) => !open && setViewingImage(null)} />
        <div className="p-2 border-b bg-card shrink-0">
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
              className="flex-1 rounded-none border-l-0 border-r-0"
            >
              Discussion
            </Button>
            <Button
              variant={activeMobileTab === 'student' ? 'default' : 'outline'}
              onClick={() => setActiveMobileTab('student')}
              className="flex-1 rounded-l-none"
            >
              Student
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
                staffMembers={staffMembers}
                onViewImage={setViewingImage}
              />
            </div>
          </ScrollArea>
        )}
        
        {activeMobileTab === 'student' && (
             <ScrollArea className="flex-1 bg-card">
                <div className="p-4 space-y-4">
                     {!studentDetails && (
                        <Button onClick={handleFetchStudentDetails} disabled={isFetchingDetails} className="w-full">
                            {isFetchingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <User className="mr-2 h-4 w-4"/>}
                            Show Student Details
                        </Button>
                    )}
                    {isFetchingDetails && <Skeleton className="h-64 w-full" />}
                    {studentDetails && <StudentInfoDisplay studentInfo={studentDetails} />}
                </div>
            </ScrollArea>
        )}

        {activeMobileTab === 'discussion' && (
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            <TicketDiscussionContent 
                ticket={ticket}
                userRole={userRole}
                staffAvatar={staffAvatar}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                stagedAttachments={stagedAttachments}
                handleSendMessage={handleSendMessage}
                handleAttachmentClick={handleAttachmentClick}
                removeStagedAttachment={removeStagedAttachment}
                isTicketLockedByOther={isTicketLockedByOther}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                isSending={isSending}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full max-h-screen overflow-hidden">
      <ImageViewerDialog imageUrl={viewingImage} onOpenChange={(open) => !open && setViewingImage(null)} />
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
            staffMembers={staffMembers}
            onViewImage={setViewingImage}
          />
          {userRole === 'staff' && (
              <div className="mt-6">
                <Dialog open={isStudentInfoDialogOpen} onOpenChange={setIsStudentInfoDialogOpen}>
                    <DialogTrigger asChild>
                         <Button onClick={handleFetchStudentDetails} disabled={isFetchingDetails} className="w-full">
                            {isFetchingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <User className="mr-2 h-4 w-4"/>}
                            Show Student Details
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[90vh]">
                         <DialogHeader>
                            <DialogTitle>Student Details</DialogTitle>
                            {studentDetails && <DialogDescription>{studentDetails?.studentInfo.full_name} ({studentDetails?.studentInfo.student_id})</DialogDescription>}
                        </DialogHeader>
                        <div className="overflow-y-auto pr-4 -mr-4">
                            {isFetchingDetails && <div className="p-4"><Skeleton className="h-96 w-full" /></div>}
                            {studentDetails && <StudentInfoDisplay studentInfo={studentDetails} />}
                        </div>
                    </DialogContent>
                </Dialog>
              </div>
          )}
      </div>
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <TicketDiscussionContent 
            ticket={ticket}
            userRole={userRole}
            staffAvatar={staffAvatar}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            stagedAttachments={stagedAttachments}
            handleSendMessage={handleSendMessage}
            handleAttachmentClick={handleAttachmentClick}
            removeStagedAttachment={removeStagedAttachment}
            isTicketLockedByOther={isTicketLockedByOther}
            fileInputRef={fileInputRef}
            handleFileSelect={handleFileSelect}
            isSending={isSending}
        />
      </div>
    </div>
  );
}

