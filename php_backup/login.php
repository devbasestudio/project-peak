<?php
session_start();
require_once 'includes/db.php';

if (isset($_SESSION['user_id'])) {
    if ($_SESSION['role'] == 'admin') header("Location: admin/dashboard.php");
    else header("Location: user/dashboard.php");
    exit();
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['username'] = $user['username'];
        
        if ($user['role'] == 'admin') {
            header("Location: admin/dashboard.php");
        } else {
            header("Location: user/dashboard.php");
        }
        exit();
    } else {
        $error = "Email သို့မဟုတ် Password မှားယွင်းနေပါသည်။";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | Project Peak 空</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
</head>
<body>
    <div class="auth-container">
        <div class="glass-card">
            <h2><i class="ph ph-sign-in"></i> Login</h2>
            <?php if($error): ?>
                <p style="color: #ef4444; text-align: center; margin-bottom: 1rem;"><?= htmlspecialchars($error) ?></p>
            <?php endif; ?>
            <form method="POST" action="login.php">
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="text" name="email" required placeholder="example@gmail.com">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <div class="password-wrapper">
                        <input type="password" name="password" id="loginPassword" required placeholder="********">
                        <button type="button" class="password-toggle" onclick="togglePassword('loginPassword', this)">
                            <i class="ph ph-eye-slash"></i>
                        </button>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Login ဝင်မည်</button>
                <div class="text-center mt-3">
                    <a href="register.php" style="color: var(--text-muted); text-decoration: none;">အကောင့်မရှိသေးဘူးလား? Register လုပ်ရန်</a>
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
