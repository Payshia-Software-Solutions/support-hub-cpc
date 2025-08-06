-- Schema for British National Formulary (BNF) Content

--
-- Table structure for table `bnf_chapters`
--
-- This table stores the main chapters of the BNF.
--
CREATE TABLE `bnf_chapters` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

--
-- Table structure for table `bnf_pages`
--
-- This table stores the content for each individual page within a chapter.
-- The `left_content_paragraphs` and `right_content_list` columns are designed
-- to store structured data in JSON format for flexibility.
--
CREATE TABLE `bnf_pages` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `chapter_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `index_words` TEXT COMMENT 'Comma-separated list of keywords for the index.',
  `left_content_heading` VARCHAR(255),
  `left_content_paragraphs` JSON,
  `left_content_subheading` VARCHAR(255) DEFAULT NULL,
  `right_content_list` JSON,
  `right_content_note` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`chapter_id`) REFERENCES `bnf_chapters`(`id`) ON DELETE CASCADE
);

--
-- Table structure for table `bnf_word_index`
--
-- This table provides a fast lookup for words found in the `index_words`
-- column of the `bnf_pages` table. It can be populated and maintained
-- by a script that parses the `index_words` whenever a page is created or updated.
--
CREATE TABLE `bnf_word_index` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `word` VARCHAR(255) NOT NULL,
  `page_id` INT NOT NULL,
  FOREIGN KEY (`page_id`) REFERENCES `bnf_pages`(`id`) ON DELETE CASCADE,
  INDEX `word_index` (`word`)
);


--
-- Example of JSON structure for `left_content_paragraphs`:
-- ["Paragraph one text.", "Paragraph two text."]
--

--
-- Example of JSON structure for `right_content_list`:
-- [
--   {"bold": "Pharmacokinetics:", "text": "What the body does to the drug."},
--   {"bold": "Pharmacodynamics:", "text": "What the drug does to the body."}
-- ]
--

-- Note: An alternative to the `right_content_list` JSON column is a separate
-- table, which is better for complex queries but might be overkill for this use case.
-- If needed, the structure would be:
--
-- CREATE TABLE `bnf_page_list_items` (
--   `id` INT PRIMARY KEY AUTO_INCREMENT,
--   `page_id` INT NOT NULL,
--   `bold_text` VARCHAR(255) NOT NULL,
--   `regular_text` TEXT,
--   `item_order` INT NOT NULL,
--   FOREIGN KEY (`page_id`) REFERENCES `bnf_pages`(`id`) ON DELETE CASCADE
-- );
--