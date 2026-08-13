-- CampusGigs - InfinityFree & cPanel Free Hosting Database Schema
-- Optimized for free shared hosting (triggers/procedures commented out due to cPanel permission limits)

SET FOREIGN_KEY_CHECKS = 0;
DROP VIEW IF EXISTS top_freelancers;
DROP TABLE IF EXISTS disputes, reviews, transactions, bids, gig_skill_required, gigs, user_skills, skills, users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    batch YEAR NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_flag ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    avatar_color VARCHAR(20) NOT NULL DEFAULT 'coral',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE skills (
    skill_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(80) NOT NULL UNIQUE,
    category VARCHAR(80) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE user_skills (
    user_id INT UNSIGNED NOT NULL,
    skill_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE gigs (
    gig_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id INT UNSIGNED NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    deadline DATE NOT NULL,
    status ENUM('Open', 'In Progress', 'Submitted', 'Completed', 'Disputed', 'Cancelled') NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME NULL,
    completed_at DATETIME NULL,
    FOREIGN KEY (client_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX (status), INDEX (deadline)
) ENGINE=InnoDB;

CREATE TABLE gig_skill_required (
    gig_id INT UNSIGNED NOT NULL,
    skill_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (gig_id, skill_id),
    FOREIGN KEY (gig_id) REFERENCES gigs(gig_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE bids (
    bid_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gig_id INT UNSIGNED NOT NULL,
    freelancer_id INT UNSIGNED NOT NULL,
    proposed_price DECIMAL(10,2) NOT NULL,
    message VARCHAR(500) NOT NULL,
    status ENUM('Pending', 'Accepted', 'Rejected', 'Withdrawn') NOT NULL DEFAULT 'Pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY one_bid_per_user (gig_id, freelancer_id),
    FOREIGN KEY (gig_id) REFERENCES gigs(gig_id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE transactions (
    transaction_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gig_id INT UNSIGNED NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('Pending', 'Paid', 'Refunded') NOT NULL DEFAULT 'Pending',
    completed_at DATETIME NULL,
    FOREIGN KEY (gig_id) REFERENCES gigs(gig_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reviews (
    review_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gig_id INT UNSIGNED NOT NULL,
    reviewer_id INT UNSIGNED NOT NULL,
    reviewee_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY one_review_per_direction (gig_id, reviewer_id, reviewee_id),
    CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (gig_id) REFERENCES gigs(gig_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE disputes (
    dispute_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gig_id INT UNSIGNED NOT NULL,
    raised_by INT UNSIGNED NOT NULL,
    reason VARCHAR(600) NOT NULL,
    status ENUM('Open', 'Under Review', 'Resolved', 'Rejected') NOT NULL DEFAULT 'Open',
    resolved_by INT UNSIGNED NULL,
    resolution VARCHAR(600) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    FOREIGN KEY (gig_id) REFERENCES gigs(gig_id) ON DELETE CASCADE,
    FOREIGN KEY (raised_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Note: CREATE VIEW is disabled on InfinityFree. The PHP API automatically executes the query inline as a fallback.
-- CREATE VIEW top_freelancers AS
-- SELECT u.user_id, u.name, u.department, COUNT(DISTINCT CASE WHEN g.status = 'Completed' THEN g.gig_id END) AS completed_gigs,
--        ROUND(COALESCE(AVG(r.rating), 0), 2) AS average_rating
-- FROM users u
-- LEFT JOIN bids b ON b.freelancer_id = u.user_id AND b.status = 'Accepted'
-- LEFT JOIN gigs g ON g.gig_id = b.gig_id
-- LEFT JOIN reviews r ON r.reviewee_id = u.user_id
-- WHERE u.role_flag = 'student'
-- GROUP BY u.user_id, u.name, u.department
-- ORDER BY average_rating DESC, completed_gigs DESC;

-- Seed Data
INSERT INTO users (name, email, department, batch, password_hash, role_flag, avatar_color) VALUES
('Aisha Rahman', 'aisha@campus.edu', 'Computer Science', 2026, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC9Q1bVxj9M0U6Q3u2', 'student', 'coral'),
('Rafi Hasan', 'rafi@campus.edu', 'Electrical Engineering', 2027, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC9Q1bVxj9M0U6Q3u2', 'student', 'blue'),
('Nadia Karim', 'nadia@campus.edu', 'Business Administration', 2026, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC9Q1bVxj9M0U6Q3u2', 'student', 'mint'),
('CampusGigs Admin', 'admin@campus.edu', 'Administration', 2026, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC9Q1bVxj9M0U6Q3u2', 'admin', 'navy');

INSERT INTO skills (skill_name, category) VALUES ('Web Development', 'Technology'), ('Graphic Design', 'Creative'), ('Mathematics Tutoring', 'Academic'), ('Photography', 'Creative'), ('Video Editing', 'Creative'), ('Circuit Repair', 'Technical'), ('Content Writing', 'Writing'), ('Excel & Data', 'Business');
INSERT INTO user_skills (user_id, skill_id) VALUES (1, 1), (1, 2), (1, 7), (2, 6), (2, 3), (3, 2), (3, 4), (3, 5);
INSERT INTO gigs (client_id, title, description, budget, deadline, status) VALUES
(2, 'Design a student club launch poster', 'We need a bold, print-ready poster for our fall orientation event. Include editable source files.', 35.00, '2026-08-18', 'Open'),
(1, 'Build a responsive portfolio landing page', 'Looking for a frontend developer to turn our Figma direction into a polished one-page site.', 180.00, '2026-08-28', 'Open'),
(3, 'Photograph our campus society event', 'Two hours of event coverage with 30 edited photos delivered within one week.', 75.00, '2026-08-15', 'In Progress'),
(2, 'Clean and visualize survey results', 'Transform our student survey spreadsheet into three clear charts and a short insight summary.', 60.00, '2026-07-20', 'Completed');
INSERT INTO gig_skill_required (gig_id, skill_id) VALUES (1, 2), (2, 1), (2, 2), (3, 4), (4, 8);
INSERT INTO bids (gig_id, freelancer_id, proposed_price, message, status) VALUES (1, 3, 30.00, 'I can deliver three poster directions and the editable file.', 'Pending'), (2, 1, 160.00, 'I have built similar responsive sites for campus organizations.', 'Pending'), (3, 1, 70.00, 'I can cover the event and deliver edited photos within five days.', 'Accepted'), (4, 3, 55.00, 'I work comfortably with Excel and clear data storytelling.', 'Accepted');
INSERT INTO reviews (gig_id, reviewer_id, reviewee_id, rating, comment) VALUES (4, 2, 3, 5, 'Clear brief and thoughtful feedback. Great client.');
