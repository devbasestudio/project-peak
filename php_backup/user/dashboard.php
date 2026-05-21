<?php
session_start();
require_once '../includes/db.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: ../login.php");
    exit();
}

$is_admin_viewing = false;
$user_id = $_SESSION['user_id'];
$client_query = "";

if ($_SESSION['role'] == 'admin' && isset($_GET['client_id'])) {
    $user_id = $_GET['client_id'];
    $is_admin_viewing = true;
    $client_query = "?client_id=" . $user_id;
} else if ($_SESSION['role'] != 'user') {
    header("Location: ../login.php");
    exit();
}

// Get user info and program
$stmt = $pdo->prepare("SELECT * FROM programs WHERE user_id = ?");
$stmt->execute([$user_id]);
$program = $stmt->fetch();

// Get quote
$stmt = $pdo->prepare("SELECT quote FROM motivational_quotes WHERE user_id = ?");
$stmt->execute([$user_id]);
$quote = $stmt->fetchColumn() ?: "Believe in yourself and exceed your limits!";

// Handle quote update
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['update_quote'])) {
    $new_quote = $_POST['new_quote'];
    $stmt = $pdo->prepare("INSERT INTO motivational_quotes (user_id, quote) VALUES (?, ?) ON DUPLICATE KEY UPDATE quote = ?");
    $stmt->execute([$user_id, $new_quote, $new_quote]);
    $quote = $new_quote;
}

// Get recent weight data for chart
$stmt = $pdo->prepare("SELECT date, body_weight FROM daily_trackers WHERE user_id = ? AND body_weight IS NOT NULL ORDER BY date ASC LIMIT 14");
$stmt->execute([$user_id]);
$weight_data = $stmt->fetchAll();
$dates = [];
$weights = [];
foreach ($weight_data as $row) {
    $dates[] = date('m/d', strtotime($row['date']));
    $weights[] = $row['body_weight'];
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard | Project Peak</title>
    <link rel="stylesheet" href="../assets/css/style.css">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .quote-box {
            background: rgba(255, 255, 255, 0.05);
            padding: 1.5rem;
            border-radius: 15px;
            border-left: 4px solid var(--accent-color);
            margin-bottom: 2rem;
            position: relative;
        }
        .quote-box p {
            font-size: 1.2rem;
            font-style: italic;
        }
        .edit-quote-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
        }
    </style>
</head>
<body>

    <nav class="navbar">
        <div class="nav-brand">
            <img src="../assets/img/logo.svg" alt="PP Logo"> Project Peak
        </div>
        <div class="nav-links">
            <?php if($is_admin_viewing): ?>
                <a href="../admin/client_view.php?id=<?= $user_id ?>" style="color: #ef4444;"><i class="ph ph-arrow-left"></i> Back to Admin View</a>
            <?php endif; ?>
            <a href="dashboard.php<?= $client_query ?>" class="active"><i class="ph ph-squares-four"></i> Dashboard</a>
            <a href="../logout.php"><i class="ph ph-sign-out"></i> Logout</a>
        </div>
    </nav>

    <div class="dashboard-layout">
        <div class="main-content" style="margin-left: 0;">
            <?php if($is_admin_viewing): ?>
                <div style="background: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; padding: 1rem; border-radius: 10px; margin-bottom: 2rem;">
                    <strong><i class="ph ph-warning-circle"></i> ADMIN MODE:</strong> You are currently managing this client's dashboard. Any changes you make here will directly affect their account.
                </div>
            <?php endif; ?>
            <h2 class="mb-3">Welcome, <?= htmlspecialchars($_SESSION['username']) ?>!</h2>
            
            <div class="quote-box">
                <p id="quote-text">"<?= htmlspecialchars($quote) ?>"</p>
                <button class="edit-quote-btn" onclick="document.getElementById('quote-form').style.display='block';"><i class="ph ph-pencil-simple"></i></button>
                <form id="quote-form" method="POST" style="display:none; margin-top: 10px;">
                    <input type="text" name="new_quote" value="<?= htmlspecialchars($quote) ?>" style="width: 80%; padding: 0.5rem; border-radius: 5px; border: 1px solid #cbd5e1; background: #f8fafc; color: #0f172a;">
                    <button type="submit" name="update_quote" class="btn btn-primary" style="padding: 0.5rem 1rem;">Save</button>
                </form>
            </div>

            <div class="grid-cards mb-3">
                <a href="daily_log.php<?= $client_query ?>" class="quick-link-card">
                    <i class="ph ph-calendar-check"></i>
                    <h3>Daily Log</h3>
                    <p>Habits & Records ဖြည့်သွင်းရန်</p>
                </a>
                <a href="workout.php<?= $client_query ?>" class="quick-link-card">
                    <i class="ph ph-barbell"></i>
                    <h3>Workout</h3>
                    <p>ယနေ့လေ့ကျင့်ခန်းများ</p>
                </a>
                <a href="diet.php<?= $client_query ?>" class="quick-link-card">
                    <i class="ph ph-fork-knife"></i>
                    <h3>Diet</h3>
                    <p>Meal Plan ကြည့်ရှုရန်</p>
                </a>
                <a href="check_in.php<?= $client_query ?>" class="quick-link-card">
                    <i class="ph ph-clipboard-text"></i>
                    <h3>Check-in</h3>
                    <p>အပတ်စဉ် Report တင်ရန်</p>
                </a>
            </div>

            <div class="chart-container">
                <h3><i class="ph ph-trend-up"></i> ကိုယ်အလေးချိန် အပြောင်းအလဲ (Progress)</h3>
                <canvas id="weightChart" height="100"></canvas>
            </div>
        </div>
    </div>

    <script>
        const ctx = document.getElementById('weightChart').getContext('2d');
        const weightChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: <?= json_encode($dates) ?>,
                datasets: [{
                    label: 'Weight (kg)',
                    data: <?= json_encode($weights) ?>,
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    </script>
</body>
</html>






