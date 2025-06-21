-- SQL schema for a MySQL database

-- Table for staff members
CREATE TABLE staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url VARCHAR(255),
    -- other staff-related fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for tickets
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL, -- Corresponds to your external user ID system
    student_name VARCHAR(255) NOT NULL,
    student_avatar_url VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Open', 'In Progress', 'Closed') NOT NULL DEFAULT 'Open',
    priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
    assigned_to_staff_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to_staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

-- Table for messages within a ticket
CREATE TABLE ticket_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    sender_id VARCHAR(255) NOT NULL, -- Can be student_id or staff_id
    sender_type ENUM('student', 'staff') NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Table for chats
CREATE TABLE chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL, -- Corresponds to your external user ID system
    student_name VARCHAR(255) NOT NULL,
    student_avatar_url VARCHAR(255),
    staff_id INT,
    last_message_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

-- Table for messages within a chat
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT NOT NULL,
    sender_id VARCHAR(255) NOT NULL, -- Can be student_id or staff_id
    sender_type ENUM('student', 'staff') NOT NULL,
    message TEXT,
    attachment_url VARCHAR(255),
    attachment_type VARCHAR(50), -- e.g., 'image', 'document'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Table for announcements
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255),
    category ENUM('General', 'Academic', 'Events', 'Urgent'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to_staff_id);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_chats_student_id ON chats(student_id);
CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);
