-- This is an example SQL schema based on the application's data types.
-- It is intended as a starting point and should be reviewed and adapted for a production database.
-- This schema uses PostgreSQL syntax but can be adapted for other SQL databases.

-- Users can be students or staff
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'staff')),
    avatar_url VARCHAR(255),
    joined_date TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Tickets created by students and assigned to staff
CREATE TABLE tickets (
    id VARCHAR(255) PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(50) CHECK (status IN ('Open', 'In Progress', 'Closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    student_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_by_staff_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL
);

-- Messages can belong to a ticket.
-- A similar table could be created for chat messages.
CREATE TABLE ticket_messages (
    id VARCHAR(255) PRIMARY KEY,
    ticket_id VARCHAR(255) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text_content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    attachment_url VARCHAR(255),
    attachment_name VARCHAR(255),
    attachment_type VARCHAR(50) -- e.g., 'image', 'document'
);

-- Announcements posted by staff
CREATE TABLE announcements (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(50) CHECK (category IN ('General', 'Academic', 'Events', 'Urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments made by users
CREATE TABLE payments (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    amount_cents INTEGER NOT NULL, -- Storing money as integers (in cents) is best practice
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('Completed', 'Pending', 'Failed')),
    description TEXT,
    created_at TIMESTAMTz DEFAULT NOW()
);

-- Example Indexing for performance
CREATE INDEX idx_tickets_student_id ON tickets(student_id);
CREATE INDEX idx_tickets_assigned_to_id ON tickets(assigned_to_id);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
