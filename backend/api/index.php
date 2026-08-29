<?php

declare(strict_types=1);
require __DIR__ . '/config.php';

session_start();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$body = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$userId = (int) ($_SESSION['user_id'] ?? ($body['user_id'] ?? 1));

function respond(mixed $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function requireFields(array $body, array $fields): void {
    foreach ($fields as $field) if (!isset($body[$field]) || trim((string) $body[$field]) === '') respond(['error' => "Missing field: {$field}"], 422);
}

try {
    if ($action === 'ping') {
        respond(['status' => 'ok', 'timestamp' => time(), 'service' => 'CampusGigs API']);
    }

    if ($action === 'register' && $method === 'POST') {
        requireFields($body, ['name', 'email', 'department', 'batch', 'password']);
        if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) respond(['error' => 'Invalid email address.'], 422);
        
        $stmt = $pdo->prepare('SELECT user_id FROM users WHERE email = ?');
        $stmt->execute([$body['email']]);
        if ($stmt->fetch()) respond(['error' => 'An account with this email already exists.'], 422);

        $colors = ['coral', 'blue', 'mint', 'yellow', 'navy'];
        $color = $colors[array_rand($colors)];
        $hash = password_hash((string) $body['password'], PASSWORD_DEFAULT);

        $stmt = $pdo->prepare('INSERT INTO users (name, email, department, batch, password_hash, role_flag, avatar_color) VALUES (?, ?, ?, ?, ?, "student", ?)');
        $stmt->execute([$body['name'], $body['email'], $body['department'], (int) $body['batch'], $hash, $color]);
        $newId = (int) $pdo->lastInsertId();

        $stmt = $pdo->prepare('SELECT user_id, name, email, department, batch, role_flag, avatar_color FROM users WHERE user_id = ?');
        $stmt->execute([$newId]);
        $user = $stmt->fetch();
        $_SESSION['user_id'] = $newId;
        respond(['message' => 'Student account created successfully!', 'user' => $user], 201);
    }

    if ($action === 'login' && $method === 'POST') {
        requireFields($body, ['email', 'password']);
        $stmt = $pdo->prepare('SELECT user_id, name, email, department, batch, role_flag, avatar_color, password_hash FROM users WHERE email = ?');
        $stmt->execute([$body['email']]);
        $user = $stmt->fetch();
        if (!$user || !password_verify((string) $body['password'], $user['password_hash'])) respond(['error' => 'Invalid student email or password.'], 401);
        unset($user['password_hash']);
        $_SESSION['user_id'] = (int) $user['user_id'];
        respond(['message' => 'Logged in successfully.', 'user' => $user]);
    }

    if ($action === 'users') {
        $stmt = $pdo->query('SELECT user_id, name, email, department, batch, role_flag, avatar_color FROM users ORDER BY user_id ASC');
        respond(['users' => $stmt->fetchAll()]);
    }

    if ($action === 'me') {
        $stmt = $pdo->prepare('SELECT user_id, name, email, department, batch, role_flag, avatar_color FROM users WHERE user_id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        if (!$user) respond(['error' => 'User not found.'], 404);

        $skillsStmt = $pdo->prepare('SELECT s.skill_id, s.skill_name, s.category FROM user_skills us JOIN skills s ON s.skill_id = us.skill_id WHERE us.user_id = ? ORDER BY s.category, s.skill_name');
        $skillsStmt->execute([$userId]);
        $user['skills'] = $skillsStmt->fetchAll();

        try {
            $ratingStmt = $pdo->prepare('CALL freelancer_average_rating(?, @avg)');
            $ratingStmt->execute([$userId]);
            $ratingStmt->closeCursor();
            $avgRow = $pdo->query('SELECT @avg AS average')->fetch();
            $user['average_rating'] = $avgRow && $avgRow['average'] !== null ? (float)$avgRow['average'] : 0.0;
        } catch (Throwable) {
            $avgStmt = $pdo->prepare('SELECT ROUND(COALESCE(AVG(rating), 0), 2) AS average FROM reviews WHERE reviewee_id = ?');
            $avgStmt->execute([$userId]);
            $user['average_rating'] = (float)($avgStmt->fetchColumn() ?: 0.0);
        }
        respond(['user' => $user]);
    }

    if ($action === 'update_skills' && $method === 'POST') {
        requireFields($body, ['skills']);
        $skillIds = (array) $body['skills'];
        $pdo->beginTransaction();
        $pdo->prepare('DELETE FROM user_skills WHERE user_id = ?')->execute([$userId]);
        $insertStmt = $pdo->prepare('INSERT INTO user_skills (user_id, skill_id) VALUES (?, ?)');
        foreach ($skillIds as $sid) {
            if ((int)$sid > 0) {
                $insertStmt->execute([$userId, (int)$sid]);
            }
        }
        $pdo->commit();
        respond(['message' => 'Skills updated successfully.']);
    }

    if ($action === 'transactions') {
        $userStmt = $pdo->prepare('SELECT role_flag FROM users WHERE user_id = ?');
        $userStmt->execute([$userId]);
        $role = $userStmt->fetchColumn();

        if ($role === 'admin') {
            $sql = "SELECT t.transaction_id, t.gig_id, t.amount, t.payment_status, DATE_FORMAT(t.completed_at, '%b %d, %Y') completed_at, g.title gig_title, uc.name client_name, uc.user_id client_id, uf.name freelancer_name, uf.user_id freelancer_id FROM transactions t JOIN gigs g ON g.gig_id = t.gig_id JOIN users uc ON uc.user_id = g.client_id LEFT JOIN bids b ON b.gig_id = g.gig_id AND b.status = 'Accepted' LEFT JOIN users uf ON uf.user_id = b.freelancer_id ORDER BY t.transaction_id DESC";
            $stmt = $pdo->query($sql);
        } else {
            $sql = "SELECT t.transaction_id, t.gig_id, t.amount, t.payment_status, DATE_FORMAT(t.completed_at, '%b %d, %Y') completed_at, g.title gig_title, uc.name client_name, uc.user_id client_id, uf.name freelancer_name, uf.user_id freelancer_id FROM transactions t JOIN gigs g ON g.gig_id = t.gig_id JOIN users uc ON uc.user_id = g.client_id LEFT JOIN bids b ON b.gig_id = g.gig_id AND b.status = 'Accepted' LEFT JOIN users uf ON uf.user_id = b.freelancer_id WHERE g.client_id = ? OR b.freelancer_id = ? ORDER BY t.transaction_id DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId, $userId]);
        }
        respond(['transactions' => $stmt->fetchAll()]);
    }

    if ($action === 'my_gigs') {
        $stmt = $pdo->prepare('SELECT g.gig_id, g.title, g.description, g.budget, DATE_FORMAT(g.deadline, "%b %d, %Y") deadline, g.status, g.created_at, COUNT(DISTINCT b.bid_id) bid_count, GROUP_CONCAT(DISTINCT s.skill_name ORDER BY s.skill_name SEPARATOR ", ") skills, MAX(CASE WHEN b.status = "Accepted" THEN b.freelancer_id END) accepted_freelancer_id, MAX(CASE WHEN b.status = "Accepted" THEN u.name END) accepted_freelancer_name, MAX(CASE WHEN b.status = "Accepted" THEN u.email END) accepted_freelancer_email FROM gigs g LEFT JOIN bids b ON b.gig_id = g.gig_id LEFT JOIN users u ON u.user_id = b.freelancer_id LEFT JOIN gig_skill_required gsr ON gsr.gig_id = g.gig_id LEFT JOIN skills s ON s.skill_id = gsr.skill_id WHERE g.client_id = ? GROUP BY g.gig_id ORDER BY g.created_at DESC');
        $stmt->execute([$userId]);
        respond(['gigs' => $stmt->fetchAll()]);
    }

    if ($action === 'my_bids') {
        $stmt = $pdo->prepare('SELECT b.bid_id, b.gig_id, b.proposed_price, b.message, b.status, b.status bid_status, b.submitted_at, g.title gig_title, g.budget gig_budget, g.status gig_status, g.deadline, u.name client_name, u.email client_email, u.department client_department FROM bids b JOIN gigs g ON g.gig_id = b.gig_id JOIN users u ON u.user_id = g.client_id WHERE b.freelancer_id = ? ORDER BY b.submitted_at DESC');
        $stmt->execute([$userId]);
        respond(['bids' => $stmt->fetchAll()]);
    }

    if ($action === 'user_profile' && $method === 'GET') {
        $targetUserId = (int) ($_GET['user_id'] ?? 0);
        $stmt = $pdo->prepare('SELECT user_id, name, email, department, batch, role_flag, avatar_color, created_at FROM users WHERE user_id = ?');
        $stmt->execute([$targetUserId]);
        $targetUser = $stmt->fetch();
        if (!$targetUser) respond(['error' => 'User not found.'], 404);

        $skStmt = $pdo->prepare('SELECT s.skill_id, s.skill_name, s.category FROM user_skills us JOIN skills s ON s.skill_id = us.skill_id WHERE us.user_id = ? ORDER BY s.category, s.skill_name');
        $skStmt->execute([$targetUserId]);
        $targetUser['skills'] = $skStmt->fetchAll();

        $avgStmt = $pdo->prepare('SELECT ROUND(COALESCE(AVG(rating), 5.0), 1) AS average FROM reviews WHERE reviewee_id = ?');
        $avgStmt->execute([$targetUserId]);
        $targetUser['average_rating'] = (float)($avgStmt->fetchColumn() ?: 5.0);

        $compFreeStmt = $pdo->prepare('SELECT COUNT(DISTINCT g.gig_id) FROM gigs g JOIN bids b ON b.gig_id = g.gig_id WHERE b.freelancer_id = ? AND b.status = "Accepted" AND g.status = "Completed"');
        $compFreeStmt->execute([$targetUserId]);
        $targetUser['completed_gigs'] = (int)$compFreeStmt->fetchColumn();

        $revStmt = $pdo->prepare('SELECT r.rating, r.comment, r.created_at, u.name reviewer_name FROM reviews r JOIN users u ON u.user_id = r.reviewer_id WHERE r.reviewee_id = ? ORDER BY r.created_at DESC LIMIT 10');
        $revStmt->execute([$targetUserId]);
        $targetUser['reviews'] = $revStmt->fetchAll();

        respond(['user' => $targetUser]);
    }

    if ($action === 'dashboard') {
        $status = $_GET['status'] ?? 'Open';
        $skill = (int) ($_GET['skill_id'] ?? 0);
        $search = trim($_GET['search'] ?? '');
        $where = [];
        $params = [];

        if ($status && $status !== 'All') {
            $where[] = 'g.status = ?';
            $params[] = $status;
        }
        if ($skill) {
            $where[] = 'EXISTS (SELECT 1 FROM gig_skill_required gsr WHERE gsr.gig_id = g.gig_id AND gsr.skill_id = ?)';
            $params[] = $skill;
        }
        if ($search) {
            $where[] = '(LOWER(g.title) LIKE ? OR LOWER(g.description) LIKE ? OR LOWER(u.name) LIKE ? OR LOWER(u.department) LIKE ?)';
            $searchPattern = '%' . strtolower(trim((string)$search)) . '%';
            $params[] = $searchPattern;
            $params[] = $searchPattern;
            $params[] = $searchPattern;
            $params[] = $searchPattern;
        }
        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql = "SELECT g.gig_id, g.title, g.description, g.budget, DATE_FORMAT(g.deadline, '%b %d, %Y') deadline, g.status, g.created_at, u.user_id client_id, u.name client_name, u.department, COUNT(DISTINCT b.bid_id) bid_count, GROUP_CONCAT(DISTINCT s.skill_name ORDER BY s.skill_name SEPARATOR ', ') skills FROM gigs g JOIN users u ON u.user_id = g.client_id LEFT JOIN bids b ON b.gig_id = g.gig_id LEFT JOIN gig_skill_required gsr ON gsr.gig_id = g.gig_id LEFT JOIN skills s ON s.skill_id = gsr.skill_id {$whereClause} GROUP BY g.gig_id, g.title, g.description, g.budget, g.deadline, g.status, g.created_at, u.user_id, u.name, u.department ORDER BY g.created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $gigs = $stmt->fetchAll();
        $skills = $pdo->query('SELECT skill_id, skill_name, category FROM skills ORDER BY category, skill_name')->fetchAll();
        $stats = $pdo->query("SELECT COUNT(*) total, SUM(status = 'Open') open_count, SUM(status = 'Completed') completed_count, ROUND(SUM(status = 'Completed') / NULLIF(COUNT(*), 0) * 100) completion_rate FROM gigs")->fetch();
        respond(['gigs' => $gigs, 'skills' => $skills, 'stats' => $stats, 'user_id' => $userId]);
    }

    if ($action === 'gig' && $method === 'GET') {
        $gigId = (int) ($_GET['id'] ?? 0);
        $stmt = $pdo->prepare('SELECT g.*, u.name client_name, u.email client_email, u.department, u.batch FROM gigs g JOIN users u ON u.user_id = g.client_id WHERE g.gig_id = ?');
        $stmt->execute([$gigId]);
        $gig = $stmt->fetch();
        if (!$gig) respond(['error' => 'Gig not found.'], 404);
        
        $stmt = $pdo->prepare('SELECT b.*, u.name freelancer_name, u.email freelancer_email, u.department, u.batch, u.avatar_color, ROUND(COALESCE((SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.user_id), 5.0), 1) freelancer_rating FROM bids b JOIN users u ON u.user_id = b.freelancer_id WHERE b.gig_id = ? ORDER BY b.submitted_at DESC');
        $stmt->execute([$gigId]);
        $bids = $stmt->fetchAll();

        foreach ($bids as &$bid) {
            $skStmt = $pdo->prepare('SELECT s.skill_name FROM user_skills us JOIN skills s ON s.skill_id = us.skill_id WHERE us.user_id = ?');
            $skStmt->execute([(int)$bid['freelancer_id']]);
            $bid['skills'] = $skStmt->fetchAll(PDO::FETCH_COLUMN);

            if ($bid['status'] === 'Accepted') {
                $gig['accepted_freelancer_id'] = (int) $bid['freelancer_id'];
                $gig['accepted_freelancer_name'] = $bid['freelancer_name'];
                $gig['accepted_freelancer_email'] = $bid['freelancer_email'];
            }
        }
        unset($bid);

        $reviews = $pdo->prepare('SELECT r.*, u.name reviewer_name FROM reviews r JOIN users u ON u.user_id = r.reviewer_id WHERE r.gig_id = ?');
        $reviews->execute([$gigId]);
        respond(['gig' => $gig, 'bids' => $bids, 'reviews' => $reviews->fetchAll()]);
    }

    if ($action === 'create_gig' && $method === 'POST') {
        requireFields($body, ['title', 'description', 'budget', 'deadline', 'skills']);
        $deadline = trim((string)($body['deadline'] ?? ''));
        if ($deadline !== '') {
            $ts = strtotime($deadline);
            if ($ts !== false) {
                $deadline = date('Y-m-d', $ts);
            }
        }
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('INSERT INTO gigs (client_id, title, description, budget, deadline) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$userId, $body['title'], $body['description'], $body['budget'], $deadline]);
        $gigId = (int) $pdo->lastInsertId();
        $skillStmt = $pdo->prepare('INSERT INTO gig_skill_required (gig_id, skill_id) VALUES (?, ?)');
        foreach ((array) $body['skills'] as $skillId) {
            if ((int)$skillId > 0) {
                $skillStmt->execute([$gigId, (int) $skillId]);
            }
        }
        $pdo->commit();
        respond(['message' => 'Gig posted successfully.', 'gig_id' => $gigId], 201);
    }

    if ($action === 'edit_gig' && $method === 'POST') {
        requireFields($body, ['gig_id', 'title', 'description', 'budget', 'deadline']);
        $gigId = (int) $body['gig_id'];
        $stmt = $pdo->prepare('SELECT client_id FROM gigs WHERE gig_id = ?');
        $stmt->execute([$gigId]);
        $gig = $stmt->fetch();
        if (!$gig || ((int)$gig['client_id'] !== $userId && ($body['user_role'] ?? '') !== 'admin')) {
            respond(['error' => 'You are not authorized to edit this gig.'], 403);
        }
        $deadline = trim((string)($body['deadline'] ?? ''));
        if ($deadline !== '') {
            $ts = strtotime($deadline);
            if ($ts !== false) {
                $deadline = date('Y-m-d', $ts);
            }
        }
        $pdo->beginTransaction();
        $updateStmt = $pdo->prepare('UPDATE gigs SET title = ?, description = ?, budget = ?, deadline = ? WHERE gig_id = ?');
        $updateStmt->execute([$body['title'], $body['description'], $body['budget'], $deadline, $gigId]);

        if (isset($body['skills']) && is_array($body['skills'])) {
            $pdo->prepare('DELETE FROM gig_skill_required WHERE gig_id = ?')->execute([$gigId]);
            $skillStmt = $pdo->prepare('INSERT INTO gig_skill_required (gig_id, skill_id) VALUES (?, ?)');
            foreach ($body['skills'] as $skillId) {
                if ((int)$skillId > 0) {
                    $skillStmt->execute([$gigId, (int) $skillId]);
                }
            }
        }
        $pdo->commit();
        respond(['message' => 'Gig updated successfully.']);
    }

    if ($action === 'delete_gig' && $method === 'POST') {
        requireFields($body, ['gig_id']);
        $gigId = (int) $body['gig_id'];
        $stmt = $pdo->prepare('SELECT client_id FROM gigs WHERE gig_id = ?');
        $stmt->execute([$gigId]);
        $gig = $stmt->fetch();
        if (!$gig || ((int)$gig['client_id'] !== $userId && ($body['user_role'] ?? '') !== 'admin')) {
            respond(['error' => 'You are not authorized to delete this gig.'], 403);
        }
        $pdo->prepare('DELETE FROM gigs WHERE gig_id = ?')->execute([$gigId]);
        respond(['message' => 'Gig deleted successfully.']);
    }

    if ($action === 'delete_bid' && $method === 'POST') {
        requireFields($body, ['bid_id']);
        $bidId = (int) $body['bid_id'];
        $stmt = $pdo->prepare('SELECT freelancer_id FROM bids WHERE bid_id = ?');
        $stmt->execute([$bidId]);
        $bid = $stmt->fetch();
        if (!$bid || ((int)$bid['freelancer_id'] !== $userId && ($body['user_role'] ?? '') !== 'admin')) {
            respond(['error' => 'You are not authorized to withdraw this bid.'], 403);
        }
        $pdo->prepare('DELETE FROM bids WHERE bid_id = ?')->execute([$bidId]);
        respond(['message' => 'Proposal withdrawn successfully.']);
    }

    if ($action === 'create_bid' && $method === 'POST') {
        requireFields($body, ['gig_id', 'proposed_price', 'message']); $stmt = $pdo->prepare("INSERT INTO bids (gig_id, freelancer_id, proposed_price, message) SELECT ?, ?, ?, ? FROM gigs WHERE gig_id = ? AND status = 'Open' AND client_id <> ?"); $stmt->execute([(int) $body['gig_id'], $userId, $body['proposed_price'], $body['message'], (int) $body['gig_id'], $userId]); if (!$stmt->rowCount()) respond(['error' => 'This gig is unavailable or belongs to you.'], 422); respond(['message' => 'Proposal submitted successfully.'], 201);
    }

    if ($action === 'accept_bid' && $method === 'POST') {
        requireFields($body, ['bid_id']);
        $pdo->beginTransaction();
        $bidId = (int) $body['bid_id'];
        $stmt = $pdo->prepare('SELECT b.gig_id FROM bids b JOIN gigs g ON g.gig_id = b.gig_id WHERE b.bid_id = ? AND g.client_id = ? FOR UPDATE');
        $stmt->execute([$bidId, $userId]);
        $bid = $stmt->fetch();
        if (!$bid) { $pdo->rollBack(); respond(['error' => 'You cannot accept this bid.'], 403); }
        $pdo->prepare("UPDATE bids SET status = 'Rejected' WHERE gig_id = ? AND bid_id <> ? AND status = 'Pending'")->execute([(int) $bid['gig_id'], $bidId]);
        $pdo->prepare("UPDATE bids SET status = 'Accepted' WHERE bid_id = ?")->execute([$bidId]);
        $pdo->prepare("UPDATE gigs SET status = 'In Progress' WHERE gig_id = ?")->execute([(int) $bid['gig_id']]);
        $pdo->commit();
        respond(['message' => 'Bid accepted and competing proposals rejected.']);
    }

    if ($action === 'update_status' && $method === 'POST') {
        requireFields($body, ['gig_id', 'status']);
        $allowed = ['Submitted', 'Completed', 'Disputed', 'Cancelled'];
        if (!in_array($body['status'], $allowed, true)) respond(['error' => 'Invalid status.'], 422);
        $gigId = (int) $body['gig_id'];
        $newStatus = (string) $body['status'];

        $checkStmt = $pdo->prepare('SELECT client_id, budget, status FROM gigs WHERE gig_id = ?');
        $checkStmt->execute([$gigId]);
        $gig = $checkStmt->fetch();
        if (!$gig) respond(['error' => 'Gig not found.'], 404);

        $isClient = ((int)$gig['client_id'] === $userId);
        $bidCheck = $pdo->prepare('SELECT freelancer_id, proposed_price FROM bids WHERE gig_id = ? AND status = "Accepted"');
        $bidCheck->execute([$gigId]);
        $acceptedBid = $bidCheck->fetch();
        $isFreelancer = ($acceptedBid && (int)$acceptedBid['freelancer_id'] === $userId);

        if (!$isClient && !$isFreelancer && ($body['user_role'] ?? '') !== 'admin') {
            respond(['error' => 'You are not authorized to update this gig status.'], 403);
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('UPDATE gigs SET status = ?, submitted_at = CASE WHEN ? = "Submitted" THEN NOW() ELSE submitted_at END, completed_at = CASE WHEN ? = "Completed" THEN NOW() ELSE completed_at END WHERE gig_id = ?');
            $stmt->execute([$newStatus, $newStatus, $newStatus, $gigId]);
        } catch (Throwable) {
            $stmt = $pdo->prepare('UPDATE gigs SET status = ? WHERE gig_id = ?');
            $stmt->execute([$newStatus, $gigId]);
        }

        if ($newStatus === 'Completed') {
            try {
                $amount = $acceptedBid ? (float)$acceptedBid['proposed_price'] : (float)$gig['budget'];
                $txStmt = $pdo->prepare("INSERT INTO transactions (gig_id, amount, payment_status, completed_at) VALUES (?, ?, 'Paid', NOW()) ON DUPLICATE KEY UPDATE amount = VALUES(amount), payment_status = 'Paid', completed_at = NOW()");
                $txStmt->execute([$gigId, $amount]);
            } catch (Throwable) {
                // Ignore duplicate or trigger handled
            }
        }
        $pdo->commit();

        respond(['message' => 'Gig marked ' . $newStatus . '.']);
    }

    if ($action === 'review' && $method === 'POST') {
        requireFields($body, ['gig_id', 'rating', 'comment']);
        $reviewGigId = (int) $body['gig_id'];
        $rating = (int) $body['rating'];
        if ($rating < 1 || $rating > 5) respond(['error' => 'Rating must be between 1 and 5.'], 422);

        $stmt = $pdo->prepare('SELECT g.client_id, (SELECT freelancer_id FROM bids WHERE gig_id = g.gig_id AND status = "Accepted" LIMIT 1) accepted_freelancer_id, g.status FROM gigs g WHERE g.gig_id = ?');
        $stmt->execute([$reviewGigId]);
        $gigRow = $stmt->fetch();
        if (!$gigRow || $gigRow['status'] !== 'Completed') {
            respond(['error' => 'Reviews are only available after gig completion.'], 422);
        }

        $clientId = (int) $gigRow['client_id'];
        $freelancerId = (int) ($gigRow['accepted_freelancer_id'] ?? 0);

        $revieweeId = 0;
        if ($userId === $clientId) {
            $revieweeId = (int) ($body['reviewee_id'] ?? $freelancerId);
            if ($revieweeId === 0 && $freelancerId > 0) $revieweeId = $freelancerId;
        } elseif ($userId === $freelancerId) {
            $revieweeId = $clientId;
        } else {
            respond(['error' => 'Only the client or accepted freelancer can review this gig.'], 403);
        }

        if ($revieweeId === 0 || $revieweeId === $userId) {
            respond(['error' => 'Invalid review recipient.'], 422);
        }

        $stmt = $pdo->prepare("INSERT INTO reviews (gig_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)");
        $stmt->execute([$reviewGigId, $userId, $revieweeId, $rating, $body['comment']]);
        respond(['message' => 'Review published successfully.'], 201);
    }

    if ($action === 'dispute' && $method === 'POST') {
        requireFields($body, ['gig_id', 'reason']); $stmt = $pdo->prepare('INSERT INTO disputes (gig_id, raised_by, reason) VALUES (?, ?, ?)'); $stmt->execute([(int) $body['gig_id'], $userId, $body['reason']]); $pdo->prepare("UPDATE gigs SET status = 'Disputed' WHERE gig_id = ?")->execute([(int) $body['gig_id']]); respond(['message' => 'Dispute raised and submitted to admin.'], 201);
    }

    if ($action === 'resolve_dispute' && $method === 'POST') {
        requireFields($body, ['dispute_id', 'resolution']);
        $stmt = $pdo->prepare("UPDATE disputes SET status = 'Resolved', resolution = ?, resolved_by = ?, resolved_at = NOW() WHERE dispute_id = ?");
        $stmt->execute([$body['resolution'], $userId, (int) $body['dispute_id']]);
        respond(['message' => 'Dispute resolved by admin.']);
    }

    if ($action === 'admin') {
        $disputes = $pdo->query('SELECT d.*, g.title, u.name raised_by_name FROM disputes d JOIN gigs g ON g.gig_id = d.gig_id JOIN users u ON u.user_id = d.raised_by ORDER BY d.created_at DESC')->fetchAll();
        try {
            $top = $pdo->query('SELECT * FROM top_freelancers LIMIT 5')->fetchAll();
        } catch (PDOException $e) {
            $top = $pdo->query("SELECT u.user_id, u.name, u.department, COUNT(DISTINCT CASE WHEN g.status = 'Completed' THEN g.gig_id END) AS completed_gigs, ROUND(COALESCE(AVG(r.rating), 0), 2) AS average_rating FROM users u LEFT JOIN bids b ON b.freelancer_id = u.user_id AND b.status = 'Accepted' LEFT JOIN gigs g ON g.gig_id = b.gig_id LEFT JOIN reviews r ON r.reviewee_id = u.user_id WHERE u.role_flag = 'student' GROUP BY u.user_id, u.name, u.department ORDER BY average_rating DESC, completed_gigs DESC LIMIT 5")->fetchAll();
        }
        respond(['disputes' => $disputes, 'top_freelancers' => $top]);
    }

    respond(['error' => 'Unknown action.'], 404);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Request failed. Check the database schema and submitted values.',
        'details' => $e->getMessage()
    ]);
    exit;
}