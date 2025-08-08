

export interface ApiStaffMember {
  id: string;
  fname: string;
  lname: string;
  username: string;
  email: string;
}

export interface Attachment {
  type: 'image' | 'document';
  url: string; 
  name: string;
  file?: File;
  id?: string;
}

export interface Message {
  id: string;
  from: 'student' | 'staff';
  text: string;
  time: string; 
  avatar?: string;
  attachments?: Attachment[];
  readStatus?: 'Read' | 'Unread';
}

export interface Chat {
  id:string;
  userName: string;
  userAvatar: string;
  studentNumber?: string;
  lastMessagePreview?: string;
  lastMessageTime?: string; 
  unreadCount?: number;
}

export type TicketStatus = 'Open' | 'In Progress' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High';
export type TicketCategory = 'Course' | 'Payment' | 'Games' | 'Delivery Packs' | 'Recordings' | 'Assignments' | 'Quiz' | 'Exam' | 'Other' | 'Convocation' | 'Registration';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: string; 
  updatedAt?: string; 
  studentNumber: string;
  studentName: string;
  studentAvatar: string;
  assignedTo?: string; 
  assigneeAvatar?: string;
  isLocked?: boolean;
  lockedByStaffId?: string;
  attachments?: Attachment[];
  lastMessagePreview?: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: 'student' | 'staff';
  userlevel?: string; // e.g. "Admin", "Staff", "Student"
  avatar: string;
  joinedDate: string;
  lastLogin?: string;
}

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

export interface Batch {
  id: string;
  name: string;
  parent_course_id: string;
  courseCode: string;
  description: string;
  duration: string;
  fee: string;
  registration_fee: string;
  enroll_key: string;
  course_img?: string | null;
  certification?: string;
  mini_description?: string;
}

export interface Recording {
  id: string;
  courseId: string;
  title: string;
  description: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  dataAiHint?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export type CreateTicketPayload = Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTicketPayload = Partial<Ticket> & { id: string };

export type CreateTicketMessageClientPayload = { 
  from: 'student' | 'staff';
  text: string;
  attachments?: Attachment[];
  time: string;
  createdBy: string;
};

export type CreateChatMessageClientPayload = {
  chatId: string;
  from: 'student' | 'staff';
  text: string;
  attachments?: Attachment[];
};

export interface StudentSearchResult {
  student_id: string;
  full_name: string;
}

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

export interface TempUser {
  id: string;
  email_address: string;
  civil_status: string;
  first_name: string;
  last_name: string;
  nic_number: string;
  phone_number: string;
  whatsapp_number: string;
  address_l1: string;
  address_l2: string;
  city: string;
  district: string;
  postal_code: string;
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

export interface CreateCertificateOrderPayload {
  created_by: string;
  mobile: string;
  address_line1: string;
  address_line2?: string;
  city_id: string;
  district: string;
  type: 'courier' | 'in-person';
  payment_amount: string;
  package_id: string;
  certificate_id: string;
  certificate_status: 'Pending' | 'Printed' | 'Delivered';
  course_code: string;
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


// --- Types for Find Student Page ---
export interface StudentInfo {
    id: string;
    student_id: string;
    username: string;
    full_name: string;
    name_with_initials: string;
    name_on_certificate: string;
    e_mail: string;
    telephone_1: string;
    telephone_2: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    district: string;
    postal_code: string;
    nic: string;
    gender: string;
}

export interface ApiPaymentRecord {
    id: string;
    receipt_number: string;
    course_code: string;
    paid_amount: string;
    payment_status: string;
    payment_type: string;
    paid_date: string;
}

export interface StudentBalance {
    totalPaymentAmount: number;
    TotalStudentPaymentRecords: number;
    studentBalance: number;
    paymentRecords: Record<string, ApiPaymentRecord>;
}

export interface AssignmentGrade {
    assignment_id: string;
    assignment_name: string;
    grade: string;
}

export interface DeliveryOrder {
  id: string;
  delivery_id: string;
  tracking_number: string;
  order_date: string;
  current_status: string;
  delivery_title: string;
  active_status: string;
  order_recived_status?: 'Received' | 'Not Received' | null;
  received_date?: string | null;
  course_code?: string;
}

export interface CertificateRecord {
    id: string;
    certificate_id: string;
    print_date: string;
    print_status: string;
    type: string;
    course_code: string;
    parent_course_id: string;
}

export interface CriteriaDetail {
    id: string;
    list_name: string;
    moq: string;
    evaluation: {
        completed: boolean;
        currentValue: number;
        requiredValue: number;
    };
}

export interface StudentEnrollment {
    id: string;
    course_code: string;
    batch_name: string;
    parent_course_name: string;
    parent_course_id: string;
    assignment_grades: {
        assignments: AssignmentGrade[];
        average_grade: string;
    };
    deliveryOrders: DeliveryOrder[];
    certificateRecords: CertificateRecord[];
    studentBalance: number;
    certificate_eligibility: boolean;
    criteria_details: CriteriaDetail[];
    ceylon_pharmacy?: CeylonPharmacyInfo;
    pharma_hunter?: PharmaHunterInfo;
    pharma_hunter_pro?: PharmaHunterProInfo;
}

export interface FullStudentData {
    studentInfo: StudentInfo;
    studentBalance: StudentBalance;
    studentEnrollments: Record<string, StudentEnrollment>;
}
// --- End Types for Find Student Page ---


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


export interface StudentInBatch {
    student_course_id: string;
    course_code: string;
    student_id: string;
    username: string;
    full_name: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    telephone_1: string;
}

export interface DeliverySetting {
    id: string;
    course_id: string;
    delivery_title: string;
    is_active: string;
    icon: string;
    value: string;
}

export interface CreateDeliveryOrderPayload {
    studentNumber: string;
    courseCode: string;
    deliverySetting: DeliverySetting;
    notes: string;
    address: string;
    fullName: string;
    phone: string;
    currentStatus: string;
    trackingNumber?: string;
}

export interface ApiCourse {
    id: string;
    course_name: string;
    parent_course_id: string;
    course_code: string;
    course_fee: string;
    course_description: string;
    course_duration: string;
    registration_fee: string;
    enroll_key: string;
    course_img: string | null;
    certification: string;
    mini_description: string;
}

export interface ApiCourseResponse {
    [courseCode: string]: ApiCourse;
}

export interface DeliveryOrderPayload {
    delivery_id: string;
    tracking_number: string;
    index_number: string;
    order_date: string;
    packed_date: string | null;
    send_date: string | null;
    removed_date: string | null;
    current_status: string;
    delivery_partner: string;
    value: string;
    payment_method: string;
    course_code: string;
    estimate_delivery: string | null;
    full_name: string;
    street_address: string;
    city: string;
    district: string;
    phone_1: string;
    phone_2: string;
    is_active: string;
    received_date: string | null;
    cod_amount: string;
    package_weight: string;
    delivery_title: string; 
    notes?: string;
}

export interface PaymentRequest {
    id: string;
    unique_number: string;
    number_type: "student_number" | "ref_number";
    payment_reson: string;
    paid_amount: string;
    payment_reference: string;
    bank: string;
    branch: string;
    slip_path: string;
    paid_date: string; 
    created_at: string; 
    is_active: "1" | "0";
    hash_value: string;
    payment_status: "Pending" | "Approved" | "Rejected";
}

export interface StudentEnrollmentInfo {
  student_course_id: string;
  course_code: string;
  student_id: string;
  username: string;
  full_name: string;
  name_on_certificate: string;
}

export interface CreatePaymentPayload {
  course_code: string;
  student_id: string;
  paid_amount: string;
  discount_amount: string;
  payment_status: 'Paid' | 'Pending' | 'Failed';
  payment_type: string;
  paid_date: string; // "YYYY-MM-DD"
  created_by: string;
}

interface ApiPaymentRecord {
  id: string;
  receipt_number: string;
  course_code: string;
  student_id: string;
  paid_amount: string;
  discount_amount: string;
  payment_status: string;
  payment_type: string;
  paid_date: string;
  created_at: string;
  created_by: string;
}

export interface StudentBalanceData {
  title: string;
  userName: string;
  totalPaymentAmount: number;
  TotalStudentPaymentRecords: number;
  studentBalance: number;
  TotalRegistrationFee: number;
  paymentRecords: Record<string, ApiPaymentRecord>;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  imageUrl?: string;
}

export interface BnfPage {
  id: number;
  chapter_id: number;
  title: string;
  index_words: string;
  left_content: string; // Storing as HTML string
  right_content: string; // Storing as HTML string
}

export interface BnfChapter {
    id: number;
    title: string;
}

export interface BnfWordIndexEntry {
    id: number;
    word: string;
    page_id: number;
}
export interface ParentCourseListItem {
    id: string;
    course_name: string;
}

export interface Course {
  id: string;
  name: string;
  courseCode: string;
}
