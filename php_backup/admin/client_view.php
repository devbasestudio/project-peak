<?php
session_start();
require_once '../includes/db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'admin') {
    header("Location: ../login.php");
    exit();
}

$client_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Verify this client belongs to this admin
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND trainer_id = ? AND role = 'user'");
$stmt->execute([$client_id, $_SESSION['user_id']]);
$client = $stmt->fetch();

if (!$client) {
    die("Client not found or access denied.");
}

// Fetch program details
$stmt = $pdo->prepare("SELECT * FROM programs WHERE user_id = ?");
$stmt->execute([$client_id]);
$program = $stmt->fetch();

// Handle program update
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['update_program'])) {
    $duration = $_POST['duration_weeks'];
    $cals = $_POST['target_calories'];
    $p = $_POST['macros_p'];
    $c = $_POST['macros_c'];
    $f = $_POST['macros_f'];
    
    $stmt = $pdo->prepare("UPDATE programs SET duration_weeks=?, target_calories=?, macros_p=?, macros_c=?, macros_f=? WHERE user_id=?");
    $stmt->execute([$duration, $cals, $p, $c, $f, $client_id]);
    
    header("Location: client_view.php?id=" . $client_id);
    exit();
}

// Handle Feedback submission
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['submit_feedback'])) {
    $checkin_id = $_POST['checkin_id'];
    $feedback = $_POST['admin_feedback'];
    
    $stmt = $pdo->prepare("UPDATE weekly_checkins SET admin_feedback=? WHERE id=?");
    $stmt->execute([$feedback, $checkin_id]);
    
    header("Location: client_view.php?id=" . $client_id);
    exit();
}

// Fetch checkins
$stmt = $pdo->prepare("SELECT * FROM weekly_checkins WHERE user_id = ? ORDER BY week_number DESC");
$stmt->execute([$client_id]);
$checkins = $stmt->fetchAll();

?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Client View | Project Peak</title>
    <link rel="stylesheet" href="../assets/css/style.css">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <style>
        .split-layout { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; }
        @media (max-width: 768px) { .split-layout { grid-template-columns: 1fr; } }
        .data-box { background: rgba(0,0,0,0.05); padding: 1rem; border-radius: 5px; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand">Project Peak (Trainer Panel)</div>
        <div class="nav-links">
            <a href="dashboard.php"><i class="ph ph-users"></i> Clients</a>
            <a href="../logout.php"><i class="ph ph-sign-out"></i></a>
        </div>
    </nav>

    <div class="dashboard-layout">
        <div class="main-content" style="margin-left: 0;">
            <a href="dashboard.php" style="color:var(--text-muted); text-decoration:none;"><i class="ph ph-arrow-left"></i> နောက်သို့ (Back)</a>
            <h2 class="mt-3 mb-3"><?= htmlspecialchars($client['username']) ?>'s Profile</h2>

            <div class="split-layout">
                <!-- Program Management -->
                <div class="glass-card">
                    <h3><i class="ph ph-sliders"></i> Program Builder</h3>
                    <p class="mt-3" style="color:var(--text-muted); margin-bottom:1rem;">Target Calories & Macros</p>
                    <form method="POST">
                        <div class="form-group">
                            <label>Duration (Weeks)</label>
                            <input type="number" name="duration_weeks" value="<?= $program['duration_weeks'] ?? 12 ?>">
                        </div>
                        <div class="form-group">
                            <label>Target Calories (kcal)</label>
                            <input type="number" name="target_calories" value="<?= $program['target_calories'] ?? 2000 ?>">
                        </div>
                        <div class="form-group">
                            <label>Protein (g)</label>
                            <input type="number" name="macros_p" value="<?= $program['macros_p'] ?? 150 ?>">
                        </div>
                        <div class="form-group">
                            <label>Carbs (g)</label>
                            <input type="number" name="macros_c" value="<?= $program['macros_c'] ?? 200 ?>">
                        </div>
                        <div class="form-group">
                            <label>Fats (g)</label>
                            <input type="number" name="macros_f" value="<?= $program['macros_f'] ?? 65 ?>">
                        </div>
                        <button type="submit" name="update_program" class="btn btn-primary btn-block">Update Program</button>
                    </form>
                </div>

                <!-- Client Access Links -->
                <div>
                    <div class="glass-card mb-3" style="background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(2, 132, 199, 0.05)); border-color: var(--accent-color);">
                        <h3><i class="ph ph-user-gear"></i> Manage Client's Dashboard</h3>
                        <p class="mt-3 mb-3" style="color:var(--text-muted);">Client မြင်ရသည့်အတိုင်း အချက်အလက်များ ဝင်ရောက်ကြည့်ရှုပြင်ဆင်ရန် အောက်ပါလင့်ခ်များကို နှိပ်ပါ။</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <a href="../user/dashboard.php?client_id=<?= $client_id ?>" class="btn btn-secondary" style="justify-content:center;"><i class="ph ph-squares-four"></i> Dashboard</a>
                            <a href="../user/daily_log.php?client_id=<?= $client_id ?>" class="btn btn-secondary" style="justify-content:center;"><i class="ph ph-calendar-check"></i> Daily Log</a>
                            <a href="../user/workout.php?client_id=<?= $client_id ?>" class="btn btn-secondary" style="justify-content:center;"><i class="ph ph-barbell"></i> Workout</a>
                            <a href="../user/diet.php?client_id=<?= $client_id ?>" class="btn btn-secondary" style="justify-content:center;"><i class="ph ph-fork-knife"></i> Diet Plan</a>
                            <a href="../user/check_in.php?client_id=<?= $client_id ?>" class="btn btn-secondary" style="justify-content:center; grid-column: span 2;"><i class="ph ph-clipboard-text"></i> Weekly Check-in</a>
                        </div>
                    </div>
                    <h3><i class="ph ph-clipboard-text"></i> Weekly Check-ins</h3>
                    <?php if(count($checkins) == 0): ?>
                        <p class="mt-3" style="color:var(--text-muted);">No check-ins yet.</p>
                    <?php else: ?>
                        <?php foreach($checkins as $chk): ?>
                            <div class="glass-card mt-3" style="max-width: 100%;">
                                <h4 style="color:var(--accent-color);">Week <?= $chk['week_number'] ?> Report</h4>
                                <div class="split-layout mt-3">
                                    <div>
                                        <p><strong>Avg Weight:</strong> <?= $chk['avg_weight'] ?> kg</p>
                                        <p><strong>Energy (Workout):</strong> <?= $chk['energy_workout'] ?>/10</p>
                                        <p><strong>Energy (Daily):</strong> <?= $chk['energy_daily'] ?>/10</p>
                                        <p><strong>Motivation:</strong> <?= $chk['motivation'] ?>/10</p>
                                    </div>
                                </div>
                                <div class="mt-3">
                                    <div class="data-box">
                                        <strong>Struggles:</strong><br><?= nl2br(htmlspecialchars($chk['struggle_notes'])) ?>
                                    </div>
                                    <div class="data-box">
                                        <strong>Improvements/Wins:</strong><br><?= nl2br(htmlspecialchars($chk['improvement_notes'])) ?>
                                    </div>
                                    <div class="data-box">
                                        <strong>Upcoming Disruptions:</strong><br><?= nl2br(htmlspecialchars($chk['upcoming_disruptions'])) ?>
                                    </div>
                                    <div class="data-box">
                                        <strong>Changes Wanted:</strong><br><?= nl2br(htmlspecialchars($chk['changes_wanted'])) ?>
                                    </div>
                                </div>
                                
                                <form method="POST" class="mt-4" style="border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                                    <input type="hidden" name="checkin_id" value="<?= $chk['id'] ?>">
                                    <div class="form-group">
                                        <label>Trainer Feedback <i class="ph ph-chat-circle-text"></i></label>
                                        <textarea name="admin_feedback" rows="4" placeholder="Write your feedback here..."><?= htmlspecialchars($chk['admin_feedback'] ?? '') ?></textarea>
                                    </div>
                                    <button type="submit" name="submit_feedback" class="btn btn-secondary">Save Feedback</button>
                                </form>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</body>
</html>






