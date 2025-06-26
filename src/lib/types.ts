

export interface Attachment {
  type: 'image' | 'document';
  url: string; 
  name: string;
  file?: File;
}

export interface Message {
  id: string;
  from: 'student' | 'staff';
  text: string;
  time: string; // Should be an ISO 8601 date string from the API
  avatar?: string;
  attachment?: Attachment;
}

export interface Chat {
  id:string;
  userName: string;
  userAvatar: string;
  studentNumber?: string;
  // messages are now fetched separately
  lastMessagePreview?: string;
  lastMessageTime?: string; 
  unreadCount?: number;
}

export type TicketStatus = 'Open' | 'In Progress' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High';
export type TicketCategory = 'Course' | 'Payment' | 'Games' | 'Delivery Packs' | 'Other';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: string; // ISO 8601 date string
  updatedAt?: string; // ISO 8601 date string
  studentNumber: string;
  studentName: string;
  studentAvatar: string;
  // messages are now fetched separately
  assignedTo?: string; 
  assigneeAvatar?: string;
  isLocked?: boolean;
  lockedByStaffId?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string; // ISO 8601 date string
  author?: string;
  category?: 'General' | 'Academic' | 'Events' | 'Urgent';
  isNew?: boolean; // This will be handled client-side
}

// Basic User type for admin placeholder
export interface UserProfile {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: 'student' | 'staff';
  avatar: string;
  joinedDate: string;
  lastLogin?: string;
}

// Basic Payment type for admin placeholder
export interface PaymentRecord {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  description: string;
}

export interface StaffMember {
  id: string;
  name: string;
  avatar: string;
}

export interface Course {
  id: string;
  courseCode: string;
  name: string;
}

// Client-side payloads for API calls
export type CreateTicketPayload = Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTicketPayload = Partial<Ticket> & { id: string };

export type CreateTicketMessageClientPayload = { 
  ticketId: string;
  from: 'student' | 'staff';
  text: string;
};

export type CreateChatMessageClientPayload = {
  chatId: string;
  from: 'student' | 'staff';
  text: string;
  attachment?: Attachment;
};

export interface StudentSearchResult {
  student_id: string;
  full_name: string;
}
