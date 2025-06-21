-- This schema is a starting point for a PostgreSQL database.

-- Tickets Table
CREATE TABLE tickets (
    id VARCHAR(255) PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Open', 'In Progress', 'Closed')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    student_id VARCHAR(255) NOT NULL, -- Should reference your existing users table
    assigned_to_id VARCHAR(255), -- Should reference a staff member in your users table
    is_locked BOOLEAN DEFAULT FALSE,
    locked_by_staff_id VARCHAR(255) -- Should reference a staff member in your users table
);

-- Ticket Messages Table (Thread for a ticket)
CREATE TABLE ticket_messages (
    id VARCHAR(255) PRIMARY KEY,
    ticket_id VARCHAR(255) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id VARCHAR(255) NOT NULL, -- Should reference your existing users table
    message_text TEXT,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    attachment_type VARCHAR(50) -- 'image', 'document'
);

-- Chats Table
CREATE TABLE chats (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL, -- Should reference your existing users table
    staff_id VARCHAR(255), -- Should reference a staff member in your users table
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_message_preview TEXT,
    last_message_time TIMESTAMPTZ
);

-- Chat Messages Table
CREATE TABLE chat_messages (
    id VARCHAR(255) PRIMARY KEY,
    chat_id VARCHAR(255) NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id VARCHAR(255) NOT NULL, -- Should reference your existing users table
    message_text TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    attachment_type VARCHAR(50) -- 'image', 'document'
);

-- Announcements Table
CREATE TABLE announcements (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    published_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    author_id VARCHAR(255), -- Should reference a staff member in your users table
    category VARCHAR(50) CHECK (category IN ('General', 'Academic', 'Events', 'Urgent'))
);

-- Indexes for performance
CREATE INDEX idx_tickets_student_id ON tickets(student_id);
CREATE INDEX idx_tickets_assigned_to_id ON tickets(assigned_to_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_chats_student_id ON chats(student_id);
CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);
