<?php
session_start();
require_once '../includes/db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'admin') {
    header("Location: ../login.php");
    exit();
}

$admin_id = $_SESSION['user_id'];

// Get all clients for this admin
$stmt = $pdo->prepare("SELECT u.id, u.username, u.email, p.duration_weeks, p.start_date FROM users u LEFT JOIN programs p ON u.id = p.user_id WHERE u.trainer_id = ? AND u.role = 'user'");
$stmt->execute([$admin_id]);
$clients = $stmt->fetchAll();

// Get recent check-ins that need feedback
$stmt = $pdo->prepare("SELECT wc.*, u.username FROM weekly_checkins wc JOIN users u ON wc.user_id = u.id WHERE u.trainer_id = ? ORDER BY wc.created_at DESC LIMIT 10");
$stmt->execute([$admin_id]);
$recent_checkins = $stmt->fetchAll();

// Get all new program registrations
$registrations = [];
try {
    $stmt = $pdo->query("SELECT * FROM program_registrations ORDER BY created_at DESC");
    if ($stmt) $registrations = $stmt->fetchAll();
} catch(Exception $e) {}

?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Admin Dashboard | Project Peak</title>
    <link rel="stylesheet" href="../assets/css/style.css">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <style>
        .client-card { background: rgba(0,0,0,0.05); border: 1px solid var(--glass-border); padding: 1.5rem; border-radius: 10px; transition: transform 0.2s; }
        .client-card:hover { transform: translateY(-5px); border-color: var(--accent-color); }
        .checkin-item { padding: 1rem; border-bottom: 1px solid var(--glass-border); }
        .checkin-item:last-child { border-bottom: none; }
        .badge { background: #ef4444; color: #fff; padding: 0.2rem 0.5rem; border-radius: 5px; font-size: 0.8rem; }
        .badge.success { background: #22c55e; }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand">Project Peak (Trainer Panel)</div>
        <div class="nav-links">
            <a href="dashboard.php" class="active"><i class="ph ph-users"></i> Clients</a>
            <a href="../logout.php"><i class="ph ph-sign-out"></i></a>
        </div>
    </nav>

    <div class="dashboard-layout">
        <div class="main-content" style="margin-left: 0;">
            <div class="glass-card mb-3" style="max-width: 100%; border-color: #22c55e;">
                <h3><i class="ph ph-user-plus" style="color:#22c55e;"></i> ပရိုဂရမ် အသစ်လျှောက်ထားသူများ (New Program Registrations)</h3>
                <?php if(count($registrations) == 0): ?>
                    <p class="mt-3" style="color:var(--text-muted);">အသစ်လျှောက်ထားသူ မရှိသေးပါ။ (No new registrations yet.)</p>
                <?php else: ?>
                    <div style="display:flex; flex-direction:column; gap:1.5rem; margin-top:1.5rem;">
                        <?php foreach($registrations as $reg): ?>
                            <div style="background: rgba(0,0,0,0.03); border: 1px solid var(--glass-border); padding: 1.5rem; border-radius: 12px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                                    <h4 style="font-size:1.2rem; color:var(--text-main); margin:0;"><?= htmlspecialchars($reg['name']) ?> <span style="font-size:0.9rem; color:var(--text-muted);">(Age: <?= $reg['age'] ?> | Height: <?= htmlspecialchars($reg['height']) ?> | Weight: <?= $reg['weight'] ?> lbs)</span></h4>
                                    <span class="badge success" style="font-size:0.85rem; padding:0.3rem 0.8rem;"><?= htmlspecialchars($reg['workout_split']) ?></span>
                                </div>
                                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin:1rem 0;">
                                    <div><strong>Email:</strong> <?= htmlspecialchars($reg['email']) ?></div>
                                    <div><strong>Phone:</strong> <?= htmlspecialchars($reg['phone']) ?></div>
                                    <div><strong>Date:</strong> <?= $reg['created_at'] ?></div>
                                </div>
                                <div style="background:#fff; padding:1rem; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:1rem;">
                                    <strong style="color:var(--accent-dark);"><i class="ph ph-note"></i> ရည်မှန်းချက် / အကြောင်းရင်း (Reason for starting):</strong>
                                    <p class="mt-2" style="margin:0; font-size:0.95rem;"><?= nl2br(htmlspecialchars($reg['notes'])) ?></p>
                                </div>
                                <div style="display:flex; gap:1rem; flex-wrap:wrap;">
                                    <?php if(!empty($reg['photo_front'])): ?>
                                        <a href="../<?= $reg['photo_front'] ?>" target="_blank" class="btn btn-secondary" style="font-size:0.85rem; padding:0.4rem 0.8rem;"><i class="ph ph-image"></i> ရှေ့ပိုင်း (Front)</a>
                                    <?php endif; ?>
                                    <?php if(!empty($reg['photo_back'])): ?>
                                        <a href="../<?= $reg['photo_back'] ?>" target="_blank" class="btn btn-secondary" style="font-size:0.85rem; padding:0.4rem 0.8rem;"><i class="ph ph-image"></i> နောက်ပိုင်း (Back)</a>
                                    <?php endif; ?>
                                    <?php if(!empty($reg['photo_side'])): ?>
                                        <a href="../<?= $reg['photo_side'] ?>" target="_blank" class="btn btn-secondary" style="font-size:0.85rem; padding:0.4rem 0.8rem;"><i class="ph ph-image"></i> ဘေးပိုင်း (Side)</a>
                                    <?php endif; ?>
                                    <?php if(!empty($reg['payment_screenshot'])): ?>
                                        <a href="../<?= $reg['payment_screenshot'] ?>" target="_blank" class="btn btn-cta" style="font-size:0.85rem; padding:0.4rem 0.8rem; background:#10b981;"><i class="ph ph-receipt"></i> ပြေစာ (Payment)</a>
                                    <?php endif; ?>
                                    <?php if(!empty($reg['user_id'])): ?>
                                        <a href="client_view.php?id=<?= $reg['user_id'] ?>" class="btn btn-primary" style="font-size:0.85rem; padding:0.4rem 0.8rem;"><i class="ph ph-user"></i> View Client Profile</a>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>

            <h2 class="mb-3"><i class="ph ph-users"></i> Client Management</h2>
            
            <div class="grid-cards mb-3">
                <?php foreach($clients as $c): ?>
                    <a href="client_view.php?id=<?= $c['id'] ?>" style="text-decoration:none; color:inherit;">
                        <div class="client-card">
                            <h3><?= htmlspecialchars($c['username']) ?></h3>
                            <p class="mt-3"><i class="ph ph-envelope"></i> <?= htmlspecialchars($c['email']) ?></p>
                            <p><i class="ph ph-calendar"></i> <?= $c['duration_weeks'] ?> Weeks Program</p>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>

            <div class="glass-card" style="max-width: 100%;">
                <h3><i class="ph ph-clipboard-text"></i> နောက်ဆုံးဝင်ထားသော Check-ins (Recent Check-ins)</h3>
                <?php if(count($recent_checkins) == 0): ?>
                    <p class="mt-3" style="color:var(--text-muted);">Check-in ဝင်ထားသူ မရှိသေးပါ။ (No check-ins yet.)</p>
                <?php else: ?>
                    <?php foreach($recent_checkins as $chk): ?>
                        <div class="checkin-item">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <h4><?= htmlspecialchars($chk['username']) ?> - Week <?= $chk['week_number'] ?></h4>
                                <?php if(empty($chk['admin_feedback'])): ?>
                                    <span class="badge">Needs Feedback</span>
                                <?php else: ?>
                                    <span class="badge success">Reviewed</span>
                                <?php endif; ?>
                            </div>
                            <p class="mt-3" style="font-size:0.9rem; color:var(--text-muted);">Submitted: <?= $chk['created_at'] ?></p>
                            <a href="client_view.php?id=<?= $chk['user_id'] ?>&week=<?= $chk['week_number'] ?>" class="btn btn-secondary mt-3" style="padding: 0.5rem 1rem; font-size:0.9rem;">View & Feedback</a>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>
</body>
</html>






