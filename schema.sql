-- schema.sql (MySQL Format)

-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS `chat_messages`, `chats`, `ticket_messages`, `tickets`, `announcements`;

-- Announcements Table
CREATE TABLE `announcements` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `author` VARCHAR(255),
  `category` ENUM('General', 'Academic', 'Events', 'Urgent'),
  `is_new` BOOLEAN DEFAULT TRUE
);

-- Tickets Table
CREATE TABLE `tickets` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `priority` ENUM('Low', 'Medium', 'High') NOT NULL,
  `status` ENUM('Open', 'In Progress', 'Closed') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP,
  `student_name` VARCHAR(255) NOT NULL,
  `student_avatar` VARCHAR(255),
  `assigned_to` VARCHAR(255), -- staff name
  `assignee_avatar` VARCHAR(255),
  `is_locked` BOOLEAN DEFAULT FALSE,
  `locked_by_staff_id` VARCHAR(255) -- staff id, no foreign key
);

-- Ticket Messages Table
CREATE TABLE `ticket_messages` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `ticket_id` VARCHAR(255) NOT NULL,
  `from_role` ENUM('student', 'staff') NOT NULL,
  `text` TEXT NOT NULL,
  `time` VARCHAR(255) NOT NULL,
  `avatar` VARCHAR(255),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE
);

-- Chats Table
CREATE TABLE `chats` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `user_name` VARCHAR(255) NOT NULL,
  `user_avatar` VARCHAR(255),
  `last_message_preview` TEXT,
  `last_message_time` VARCHAR(255),
  `unread_count` INT DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages Table
CREATE TABLE `chat_messages` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `chat_id` VARCHAR(255) NOT NULL,
  `from_role` ENUM('student', 'staff') NOT NULL,
  `text` TEXT NOT NULL,
  `time` VARCHAR(255) NOT NULL,
  `avatar` VARCHAR(255),
  `attachment_type` ENUM('image', 'document'),
  `attachment_url` VARCHAR(255),
  `attachment_name` VARCHAR(255),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON DELETE CASCADE
);
