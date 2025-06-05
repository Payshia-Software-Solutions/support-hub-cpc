
export interface Attachment {
  type: 'image' | 'document';
  url: string; // For images, this can be a Data URL; for documents, a placeholder or name
  name: string;
  file?: File; // Optional: to hold the actual file object client-side if needed later
}

export interface Message {
  id: string;
  from: 'student' | 'staff';
  text: string;
  time: string;
  avatar?: string;
  attachment?: Attachment;
}

export interface Chat {
  id:string;
  userName: string;
  userAvatar: string;
  messages: Message[];
  lastMessagePreview?: string; // For ChatList display
  lastMessageTime?: string; // For ChatList display
  unreadCount?: number;
}

export type TicketStatus = 'Open' | 'In Progress' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt?: string;
  studentName: string;
  studentAvatar: string;
  messages: Message[];
  assignedTo?: string; // Staff member's name or ID
  assigneeAvatar?: string; // URL for assignee's avatar
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string; // ISO string or human-readable
  author?: string;
  category?: 'General' | 'Academic' | 'Events' | 'Urgent';
  isNew?: boolean;
}

// Basic User type for admin placeholder
export interface UserProfile {
  id: string;
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
