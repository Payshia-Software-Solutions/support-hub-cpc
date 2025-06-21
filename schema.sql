-- This schema is a starting point for a PostgreSQL database.
-- It's designed to support the core features of the Student Support Hub application.

-- Users table to store both students and staff
-- The 'role' column is crucial for distinguishing between user types.
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY, -- Using VARCHAR for IDs to match dummy data (e.g., 'user1', 'staff1')
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    "role" VARCHAR(50) NOT NULL CHECK ("role" IN ('student', 'staff')),
    avatar_url TEXT,
    joined_date TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Staff-specific details could be in a separate table if needed,
-- but for simplicity, we keep them in the users table with a 'staff' role.

-- Tickets table for tracking support requests
CREATE TABLE tickets (
    id VARCHAR(255) PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Open', 'In Progress', 'Closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    student_id VARCHAR(255) NOT NULL,
    assigned_to_id VARCHAR(255), -- This would be a staff user's ID
    is_locked BOOLEAN DEFAULT FALSE,
    locked_by_staff_id VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (locked_by_staff_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Ticket messages table to store discussion threads for tickets
CREATE TABLE ticket_messages (
    id VARCHAR(255) PRIMARY KEY,
    ticket_id VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    text_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chats table to manage direct messaging sessions between a student and staff
CREATE TABLE chats (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    -- A chat is primarily associated with a student.
    -- Staff can be assigned to it, or any staff can reply.
    -- If you want to assign a specific staff member to a chat, you can add a staff_id column.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat messages table
CREATE TABLE chat_messages (
    id VARCHAR(255) PRIMARY KEY,
    chat_id VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    text_content TEXT,
    -- Store attachments directly in the table for simplicity
    attachment_type VARCHAR(50) CHECK (attachment_type IN ('image', 'document')),
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);


-- Announcements table
CREATE TABLE announcements (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    author_id VARCHAR(255), -- A staff user's ID
    category VARCHAR(50) CHECK (category IN ('General', 'Academic', 'Events', 'Urgent')),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Payments table
CREATE TABLE payments (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Completed', 'Pending', 'Failed')),
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance improvement on common queries
CREATE INDEX idx_tickets_student_id ON tickets(student_id);
CREATE INDEX idx_tickets_assigned_to_id ON tickets(assigned_to_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_chats_student_id ON chats(student_id);
CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
