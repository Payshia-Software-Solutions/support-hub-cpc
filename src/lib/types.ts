




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

export type TicketStatus = 'Open' | 'In Progress' | 'Closed' | 'Snooze';
export type TicketPriority = 'Low' | 'Medium' | 'High';
export type TicketCategory = 'Course' | 'Payment' | 'Games' | 'Study Packs' | 'Recordings' | 'Assignments' | 'Quiz' | 'Exam' | 'Other' | 'Convocation' | 'Registration' | 'English Course' | 'Technical Issue';

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
  rating?: number;
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
  print_status: string;
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
  student_id: string;
  paid_amount: string;
  discount_amount: string;
  payment_status: string;
  payment_type: string;
  paid_date: string;
  created_at: string;
  created_by: string;
}

export interface StudentBalance {
    totalPaymentAmount: number;
    TotalStudentPaymentRecords: number;
    studentBalance: number;
    TotalRegistrationFee: number;
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
    start_date?: string;
    end_date?: string;
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

export interface Book {
  book_id: string;
  book_name: string;
  author: string;
  created_by: string;
  created_at: string;
  update_by: string;
  updated_at: string;
}

export interface CreateBookPayload {
    book_name: string;
    author: string;
    created_by: string;
    update_by: string;
}

export interface Chapter {
  chapter_id: string;
  book_id: string;
  chapter_number: string;
  chapter_title: string;
  created_at: string;
  update_by: string;
  updated_at: string;
  created_by: string;
}

export interface CreateChapterPayload {
    book_id: string;
    chapter_number: string;
    chapter_title: string;
    created_by: string;
    update_by: string;
}

export interface UpdateChapterPayload extends Partial<Omit<CreateChapterPayload, 'created_by'>> {
  book_id: string;
}

export interface Section {
  section_id: string;
  chapter_id: string;
  section_order: string;
  section_heading: string;
  created_at: string;
  update_by: string;
  updated_at: string;
}

export interface CreateSectionPayload {
  chapter_id: string;
  section_order: string;
  section_heading: string;
  created_by: string;
  update_by: string;
}

export interface UpdateSectionPayload extends Partial<Omit<CreateSectionPayload, 'created_by'>> {}

export interface PageContent {
    pege_entry_id: string;
    book_id: string;
    section_id: string;
    page_number: string;
    content_order: string;
    page_type: 'text' | 'image';
    page_content_text: string | null;
    image_url: string | null;
    keywords: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePagePayload {
    book_id: string;
    chapter_id: string;
    section_id: string;
    page_number: string;
    content_order: string;
    page_type: 'text' | 'image';
    page_content_text?: string | null;
    image_file?: File | null;
    keywords?: string;
    created_by: string;
}

export interface UpdatePagePayload extends Partial<Omit<CreatePagePayload, 'created_by' | 'image_file'>> {
    image_file?: File | null;
}


export interface ParentCourseListItem {
    id: string;
    course_name: string;
}

export interface ParentCourse {
    id: string;
    course_name: string;
    course_code: string;
    instructor_id: string | null;
    course_duration: string | null;
    course_fee: string | null;
    registration_fee: string | null;
    course_img: string | null;
    mini_description: string | null;
    course_description: string | null;
    certification: string | null;
    lecture_count: string | null;
    hours_per_lecture: string | null;
    assessments: string | null;
    language: string | null;
    quizzes: string | null;
    skill_level: string | null;
    head_count: string | null;
    course_mode: string | null;
    is_active: string;
    created_at: string;
    updated_at: string;
    slug: string | null;
    criteria_list: string | null;
}

export interface Course {
  id: string;
  name: string;
  courseCode: string;
}

// BNF Specific Types
export interface BnfPage {
  id: number;
  title: string;
  indexWords: string;
  left_content: string;
  right_content: string;
}

export interface BnfChapter {
    id: number;
    title: string;
    pages: BnfPage[];
}

export interface BnfWordIndexEntry {
  keyword: string;
  page_number: string;
}


// --- Ceylon Pharmacy Game Types ---
export interface MasterProduct {
    product_id: string;
    product_code: string;
    ProductName: string;
    DisplayName: string;
    PrintName: string;
    SellingPrice: string;
    ImagePath?: string | null;
    Pos_Category: 'Vitamins' | 'First-Aid' | 'Personal Care' | 'Other';
    [key: string]: any; // Allow other properties
}

export interface GeneralStoreItem {
    id: string;
    name: string;
    price: number;
    category: 'Vitamins' | 'First-Aid' | 'Personal Care' | 'Other';
}

export interface GamePatient {
    id: string;
    prescription_id: string;
    prescription_name: string;
    prescription_status: string;
    created_at: string;
    created_by: string;
    Pres_Name: string;
    pres_date: string;
    Pres_Age: string;
    Pres_Method: string;
    doctor_name: string;
    notes: string;
    patient_description: string;
    address: string;
    start_data?: TreatmentStartRecord | null;
}

export interface PrescriptionDetail {
    cover_id: string;
    content: string;
}

export interface DispensingAnswer {
    id: string;
    answer_id: string;
    pres_id: string;
    cover_id: string;
    date: string;
    name: string;
    drug_name: string;
    drug_type: string;
    drug_qty: string;
    morning_qty: string;
    afternoon_qty: string;
    evening_qty: string;
    night_qty: string;
    meal_type: string;
    using_type: string;
    at_a_time: string;
    hour_qty: string | null;
    additional_description: string;
    created_at: string;
    created_by: string;
}

export interface FormSelectionData {
  [key: string]: string[];
}

export interface TreatmentStartRecord {
    id: string;
    student_id: string;
    PresCode: string;
    time: string; // ISO 8601 date string e.g. "2022-10-26 16:31:00.000000"
    created_at: string;
    patient_status: "Pending" | "Recovered";
}

export interface ValidateAnswerPayload {
    user_level: string;
    created_by: string;
    pres_id: string;
    cover_id: string;
    date: string;
    name: string;
    drug_name: string;
    drug_type: string;
    drug_qty: string;
    morning_qty: string;
    afternoon_qty: string;
    evening_qty: string;
    night_qty: string;
    meal_type: string;
    using_type: string;
    at_a_time: string;
    hour_qty: string | null;
    additional_description: string;
}

export interface ValidateAnswerResponse {
    status: "success" | "error";
    message: string;
    id: string;
    incorrect_values: string[];
    answer_status: "Correct" | "In-Correct";
}

export interface Instruction {
    id: string;
    pres_code: string;
    cover_id: string;
    content: string;
    created_at: string;
    instruction: string;
}

export interface SaveCounselingAnswerPayload {
  LoggedUser: string;
  PresCode: string;
  Instruction: string;
  CoverCode: string;
  ans_status: 'Correct' | 'incorrect';
}

export interface DispensingSubmissionStatus {
    answer_id: string | null;
    error?: string;
}

export interface POSCorrectAnswer {
  id: string;
  PresCode: string;
  value: string;
  created_at: string;
}

export interface POSSubmissionPayload {
  student_id: string;
  PresCode: string;
  answer: string;
  created_at: string;
  ans_status: 'Answer Correct' | 'Answer Incorrect';
}

export interface POSSubmissionStatus {
    id: string;
    student_id: string;
    PresCode: string;
    answer: string;
    created_at: string;
    ans_status: 'Answer Correct';
}
