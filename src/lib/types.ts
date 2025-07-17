

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
  seenCount?: number;
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
  username: string;
  avatar: string;
  email: string;
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

export type CreateAnnouncementPayload = Omit<Announcement, 'id' | 'date' | 'isNew' | 'seenCount' | 'author'>;

export interface UserFullDetails {
  id: string;
  student_id: string;
  username: string;
  civil_status: string;
  first_name: string;
  last_name: string;
  gender: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  district: string;
  postal_code: string;
  telephone_1: string;
  telephone_2: string;
  nic: string;
  e_mail: string;
  birth_day: string;
  updated_by: string;
  updated_at: string;
  full_name: string;
  name_with_initials: string;
  name_on_certificate: string;
}

export interface UpdateCertificateNamePayload {
  student_number: string;
  name_on_certificate: string;
  updated_by: string;
}

export interface ConvocationRegistration {
    registration_id: string;
    reference_number: string;
    student_number: string;
    course_id: string;
    package_id: string;
    event_id: string | null;
    payment_status: string;
    payment_amount: string;
    registration_status: string;
    registered_at: string;
    updated_at: string;
    hash_value: string;
    image_path: string;
    additional_seats: string;
    session: string;
    ceremony_number: string;
    certificate_print_status: string;
    advanced_print_status: string;
    certificate_id: string;
    advanced_id: string;
    package_name: string;
    price: string;
    parent_seat_count: string;
    garland: string;
    graduation_cloth: string;
    photo_package: string;
    is_active: string;
    package_created_at: string;
    package_updated_at: string;
    name_on_certificate: string;
    telephone_1?: string;
}

export interface CertificateOrder {
  id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  course_code: string;
  mobile: string;
  address_line1: string;
  address_line2: string;
  city_id: string;
  district: string;
  type: string;
  payment: string;
  package_id: string;
  certificate_id: string;
  certificate_status: string;
  cod_amount: string;
  is_active: string;
  name_on_certificate: string;
  telephone_1?: string;
}

export interface SendSmsPayload {
  mobile: string;
  studentNameOnCertificate: string;
  studenNumber: string;
}

export interface ConvocationCourse {
  id: string;
  course_name: string;
  course_code: string;
}

export interface FilteredConvocationRegistration {
  registration_id: string;
  reference_number: string;
  student_number: string;
  course_id: string;
  package_id: string;
  event_id: string | null;
  payment_status: string;
  payment_amount: string;
  registration_status: string;
  registered_at: string;
  updated_at: string;
  hash_value: string;
  image_path: string;
  additional_seats: string;
  session: string;
  ceremony_number: string;
  certificate_print_status: string;
  advanced_print_status: string;
  certificate_id: string;
  advanced_id: string;
}

// Game Information Types from FullStudentData
export interface CeylonPharmacyInfo {
    title: string;
    userName: string;
    recoveredCount: number;
}

export interface PharmaHunterInfo {
    title: string;
    userName: string;
    correctCount: string;
    pendingCount: number;
    wrongCount: string;
    gemCount: number;
    coinCount: number;
    ProgressValue: number;
}

export interface PharmaHunterProInfo {
    "report-title": string;
    studentNumber: string;
    courseCode: string;
    progressValue: number;
    pendingCount: number;
    correctCount: number;
    gemCount: number;
    coinCount: number;
    results: {
        progressPercentage: number;
        pendingCount: number;
        correctCount: number;
        gemCount: number;
        coinCount: number;
    };
}


// Types for Student Full Info API
interface StudentInfo {
    id: string;
    student_id: string;
    username: string;
    full_name: string;
    e_mail: string;
    telephone_1: string;
    nic: string;
}
interface CriteriaDetail {
    id: string;
    list_name: string;
    moq: string;
    evaluation: {
        completed: boolean;
        currentValue: number;
        requiredValue: number;
    };
}
interface StudentEnrollment {
    id: string;
    course_code: string;
    parent_course_id: string;
    batch_name: string;
    parent_course_name: string;
    certificate_eligibility: boolean;
    criteria_details: CriteriaDetail[];
    // Add optional game properties
    ceylon_pharmacy?: CeylonPharmacyInfo;
    pharma_hunter?: PharmaHunterInfo;
    pharma_hunter_pro?: PharmaHunterProInfo;
}
export interface FullStudentData {
    studentInfo: StudentInfo;
    studentEnrollments: Record<string, StudentEnrollment>;
    studentBalance?: {
        studentBalance: number;
    };
}

export interface UpdateConvocationCoursesPayload {
  registrationId: string;
  courseIds: number[];
}

export interface UpdateCertificateOrderCoursesPayload {
  orderId: string;
  courseCodes: string;
}

export interface UserCertificatePrintStatus {
    id: string;
    student_number: string;
    certificate_id: string;
    print_date: string;
    print_status: "0" | "1";
    print_by: string;
    type: string;
    course_code: string;
    parent_course_id: string;
}

export interface GenerateCertificatePayload {
  student_number: string;
  print_status: string;
  print_by: string;
  type: string;
  parentCourseCode: number;
  referenceId: number;
  course_code: string; 
  source: string;
}

export interface DeliveryOrder {
  id: string;
  delivery_id: string;
  tracking_number: string;
  index_number: string;
  order_date: string;
  packed_date: string | null;
  send_date: string | null;
  current_status: string; // This seems to be a number code
  course_code: string;
  street_address: string;
  city: string;
  district: string;
  order_recived_status: string; // The display status
}
