<?php
session_start();
require_once 'includes/db.php';

if (isset($_SESSION['user_id'])) {
    if ($_SESSION['role'] == 'admin') header("Location: admin/dashboard.php");
    else header("Location: user/dashboard.php");
    exit();
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = $_POST['username'];
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Check if email exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        $error = "ဤ Email သည် အသုံးပြုထားပြီးဖြစ်ပါသည်။";
    } else {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        // By default, new users are assigned to the first admin (trainer) if any
        $stmt = $pdo->query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        $admin = $stmt->fetch();
        $trainer_id = $admin ? $admin['id'] : null;

        $stmt = $pdo->prepare("INSERT INTO users (username, email, password, role, trainer_id) VALUES (?, ?, ?, 'user', ?)");
        if ($stmt->execute([$username, $email, $hashed_password, $trainer_id])) {
            $user_id = $pdo->lastInsertId();
            
            // Create default program for user (12 weeks)
            $stmt = $pdo->prepare("INSERT INTO programs (user_id, duration_weeks, start_date) VALUES (?, 12, CURDATE())");
            $stmt->execute([$user_id]);

            // Add default motivational quote
            $stmt = $pdo->prepare("INSERT INTO motivational_quotes (user_id, quote) VALUES (?, 'Believe in yourself and exceed your limits!')");
            $stmt->execute([$user_id]);

            $_SESSION['user_id'] = $user_id;
            $_SESSION['role'] = 'user';
            $_SESSION['username'] = $username;
            header("Location: user/dashboard.php");
            exit();
        } else {
            $error = "Registration လုပ်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Become a Member | Project Peak 空</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
</head>
<body>
    <div class="auth-container">
        <div class="glass-card">
            <h2><i class="ph ph-user-plus"></i> Register</h2>
            <?php if($error): ?>
                <p style="color: #ef4444; text-align: center; margin-bottom: 1rem;"><?= htmlspecialchars($error) ?></p>
            <?php endif; ?>
            <form method="POST" action="register.php">
                <div class="form-group">
                    <label>Username (အမည်)</label>
                    <input type="text" name="username" required placeholder="Alex">
                </div>
                <div class="form-group">
                    <label>Email / Phone (Gmail သို့မဟုတ် ဖုန်းနံပါတ်)</label>
                    <input type="text" name="email" required placeholder="example@gmail.com / 09xxxxxxxxx">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <div class="password-wrapper">
                        <input type="password" name="password" id="regPassword" required placeholder="********">
                        <button type="button" class="password-toggle" onclick="togglePassword('regPassword', this)">
                            <i class="ph ph-eye-slash"></i>
                        </button>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Member ဝင်မည်</button>
                <div class="text-center mt-3">
                    <a href="login.php" style="color: var(--text-muted); text-decoration: none;">အကောင့်ရှိပြီးသားလား? Login ဝင်ရန်</a>
                </div>
            </form>
        </div>
    </div>
    <script>
    function togglePassword(inputId, btn) {
        const input = document.getElementById(inputId);
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'ph ph-eye';
        } else {
            input.type = 'password';
            icon.className = 'ph ph-eye-slash';
        }
    }
    </script>
</body>
</html>
