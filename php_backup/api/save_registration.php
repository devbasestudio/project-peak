<?php
session_start();
require_once '../includes/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method.']);
    exit();
}

try {
    // Ensure table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS `program_registrations` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `user_id` int(11) DEFAULT NULL,
        `name` varchar(100) NOT NULL,
        `age` int(11) NOT NULL,
        `height` varchar(50) NOT NULL,
        `weight` decimal(5,2) NOT NULL,
        `email` varchar(100) NOT NULL,
        `phone` varchar(50) NOT NULL,
        `workout_split` varchar(50) NOT NULL,
        `notes` text NOT NULL,
        `photo_front` varchar(255) DEFAULT NULL,
        `photo_back` varchar(255) DEFAULT NULL,
        `photo_side` varchar(255) DEFAULT NULL,
        `payment_screenshot` varchar(255) DEFAULT NULL,
        `status` enum('pending','approved') DEFAULT 'pending',
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $name = $_POST['username'] ?? '';
    $age = (int)($_POST['age'] ?? 0);
    $height = $_POST['height'] ?? '';
    $weight = (float)($_POST['weight'] ?? 0);
    $email = $_POST['email'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $split = $_POST['workout_split'] ?? '';
    $notes = $_POST['notes'] ?? '';

    // Handle file uploads
    $upload_dir = '../user/uploads/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    function uploadFile($fileInputName, $upload_dir) {
        if (isset($_FILES[$fileInputName]) && $_FILES[$fileInputName]['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES[$fileInputName]['name'], PATHINFO_EXTENSION);
            $filename = uniqid($fileInputName . '_') . '.' . $ext;
            if (move_uploaded_file($_FILES[$fileInputName]['tmp_name'], $upload_dir . $filename)) {
                return 'user/uploads/' . $filename;
            }
        }
        return null;
    }

    $photo_front = uploadFile('photo_front', $upload_dir);
    $photo_back = uploadFile('photo_back', $upload_dir);
    $photo_side = uploadFile('photo_side', $upload_dir);
    $payment_screenshot = uploadFile('payment_screenshot', $upload_dir);

    // Check if email already exists in users table
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $existing = $stmt->fetch();
    $user_id = $existing ? $existing['id'] : null;

    if (!$user_id) {
        // Create new user account automatically
        $hashed_password = password_hash($phone, PASSWORD_DEFAULT); // use phone as default password
        $stmt = $pdo->query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        $admin = $stmt->fetch();
        $trainer_id = $admin ? $admin['id'] : null;

        $stmt = $pdo->prepare("INSERT INTO users (username, email, password, role, trainer_id) VALUES (?, ?, ?, 'user', ?)");
        if ($stmt->execute([$name, $email, $hashed_password, $trainer_id])) {
            $user_id = $pdo->lastInsertId();
            
            // Create default program for user (12 weeks)
            $stmt = $pdo->prepare("INSERT INTO programs (user_id, duration_weeks, start_date) VALUES (?, 12, CURDATE())");
            $stmt->execute([$user_id]);

            // Add default motivational quote
            $stmt = $pdo->prepare("INSERT INTO motivational_quotes (user_id, quote) VALUES (?, 'Believe in yourself and exceed your limits!')");
            $stmt->execute([$user_id]);
        }
    }

    // Insert into program_registrations
    $stmt = $pdo->prepare("INSERT INTO program_registrations 
        (user_id, name, age, height, weight, email, phone, workout_split, notes, photo_front, photo_back, photo_side, payment_screenshot) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->execute([$user_id, $name, $age, $height, $weight, $email, $phone, $split, $notes, $photo_front, $photo_back, $photo_side, $payment_screenshot]);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
