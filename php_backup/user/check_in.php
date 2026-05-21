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

// Get current week number based on program start date
$stmt = $pdo->prepare("SELECT start_date FROM programs WHERE user_id = ?");
$stmt->execute([$user_id]);
$start_date_str = $stmt->fetchColumn();
if (!$start_date_str) $start_date_str = date('Y-m-d');

$start_date = new DateTime($start_date_str);
$today = new DateTime();
$interval = $start_date->diff($today);
$current_week = floor($interval->days / 7) + 1;

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['submit_checkin'])) {
    $week_number = $_POST['week_number'];
    $avg_weight = $_POST['avg_weight'];
    
    // Ratings & Notes
    $energy_workout = $_POST['energy_workout'];
    $energy_workout_notes = $_POST['energy_workout_notes'];
    
    $energy_daily = $_POST['energy_daily'];
    $energy_daily_notes = $_POST['energy_daily_notes'];
    
    $motivation = $_POST['motivation'];
    $motivation_notes = $_POST['motivation_notes'];
    
    // Extra Questions
    $struggle_notes = $_POST['struggle_notes'];
    $improvement_notes = $_POST['improvement_notes'];
    $upcoming_disruptions = $_POST['upcoming_disruptions'];
    $changes_wanted = $_POST['changes_wanted'];

    $stmt = $pdo->prepare("INSERT INTO weekly_checkins 
        (user_id, week_number, avg_weight, energy_workout, energy_workout_notes, energy_daily, energy_daily_notes, motivation, motivation_notes, struggle_notes, improvement_notes, upcoming_disruptions, changes_wanted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        avg_weight=?, energy_workout=?, energy_workout_notes=?, energy_daily=?, energy_daily_notes=?, motivation=?, motivation_notes=?, struggle_notes=?, improvement_notes=?, upcoming_disruptions=?, changes_wanted=?");
    
    $params = [
        $user_id, $week_number, $avg_weight, $energy_workout, $energy_workout_notes, $energy_daily, $energy_daily_notes, $motivation, $motivation_notes, $struggle_notes, $improvement_notes, $upcoming_disruptions, $changes_wanted,
        $avg_weight, $energy_workout, $energy_workout_notes, $energy_daily, $energy_daily_notes, $motivation, $motivation_notes, $struggle_notes, $improvement_notes, $upcoming_disruptions, $changes_wanted
    ];
    $stmt->execute($params);
    $success = "အောင်မြင်စွာ Report တင်ပြီးပါပြီ! (Check-in saved successfully!)";
}

// Check if already checked in this week
$stmt = $pdo->prepare("SELECT * FROM weekly_checkins WHERE user_id = ? AND week_number = ?");
$stmt->execute([$user_id, $current_week]);
$existing_checkin = $stmt->fetch();

// Calculate actual average weight from daily trackers for the past week
$week_ago = (new DateTime())->modify('-7 days')->format('Y-m-d');
$stmt = $pdo->prepare("SELECT AVG(body_weight) FROM daily_trackers WHERE user_id = ? AND date >= ? AND body_weight IS NOT NULL");
$stmt->execute([$user_id, $week_ago]);
$calc_avg_weight = round($stmt->fetchColumn(), 2);
if(!$calc_avg_weight) $calc_avg_weight = '';

?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Weekly Check-in | Project Peak</title>
    <link rel="stylesheet" href="../assets/css/style.css">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <style>
        .rating-group { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
        .rating-group input[type=range] { flex: 1; }
        .rating-group span { font-weight: bold; color: var(--accent-color); width: 30px; text-align: center; }
        .question-box { background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 10px; border: 1px solid var(--glass-border); margin-bottom: 1.5rem; }
        .question-box label { font-weight: 700; color: var(--text-light); font-size: 1.1rem; display: block; margin-bottom: 0.5rem; }
        .question-box p.hint { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand">Project Peak</div>
        <div class="nav-links">
            <?php if($is_admin_viewing): ?>
                <a href="../admin/client_view.php?id=<?= $user_id ?>" style="color: #ef4444;"><i class="ph ph-arrow-left"></i> Back to Admin View</a>
            <?php endif; ?>
            <a href="dashboard.php<?= $client_query ?>"><i class="ph ph-squares-four"></i> Dashboard</a>
            <a href="../logout.php"><i class="ph ph-sign-out"></i></a>
        </div>
    </nav>

    <div class="dashboard-layout">
        <div class="main-content" style="margin-left: 0; max-width: 800px; margin: 0 auto;">
            <h2><i class="ph ph-clipboard-text"></i> Weekly Check-in (Week <?= $current_week ?>)</h2>
            
            <?php if(isset($success)): ?>
                <div style="background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; padding: 1rem; border-radius: 10px; margin-top: 1rem; color: #4ade80;">
                    <?= $success ?>
                </div>
            <?php endif; ?>

            <?php if($existing_checkin && !empty($existing_checkin['admin_feedback'])): ?>
                <div style="background: rgba(156, 163, 175, 0.1); border-left: 4px solid var(--accent-color); padding: 1.5rem; margin-top: 2rem; border-radius: 0 10px 10px 0;">
                    <h3 style="color: var(--accent-color);"><i class="ph ph-chat-circle-text"></i> Trainer မှ Feedback ပြန်ထားသည် (Trainer Feedback)</h3>
                    <p style="margin-top: 1rem; white-space: pre-wrap;"><?= htmlspecialchars($existing_checkin['admin_feedback']) ?></p>
                </div>
            <?php endif; ?>

            <form method="POST" action="check_in.php<?= $client_query ?>" class="mt-4">
                <input type="hidden" name="week_number" value="<?= $current_week ?>">
                
                <div class="question-box">
                    <label>ယခုအပတ် ပျမ်းမျှကိုယ်အလေးချိန် (Avg Weight for the week)</label>
                    <input type="number" step="0.1" name="avg_weight" class="form-group" style="width: 150px; padding: 0.8rem; border-radius: 5px; background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1;" value="<?= $existing_checkin['avg_weight'] ?? $calc_avg_weight ?>" required> kg
                </div>

                <div class="question-box">
                    <label>Reflection (1-10 Ratings)</label>
                    
                    <p>လေ့ကျင့်ခန်းလုပ်စဉ် Energy အခြေအနေ (Energy level during workout)</p>
                    <div class="rating-group">
                        <input type="range" name="energy_workout" min="1" max="10" value="<?= $existing_checkin['energy_workout'] ?? 5 ?>" oninput="this.nextElementSibling.innerText = this.value">
                        <span><?= $existing_checkin['energy_workout'] ?? 5 ?></span>
                    </div>
                    <textarea name="energy_workout_notes" class="form-group" style="width:100%; padding: 0.8rem; border-radius: 5px; background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1; margin-bottom: 1.5rem;" placeholder="မှတ်စုတို (Notes)"><?= htmlspecialchars($existing_checkin['energy_workout_notes'] ?? '') ?></textarea>

                    <p>တစ်နေ့တာ Energy အခြေအနေ (Daily life energy level)</p>
                    <div class="rating-group">
                        <input type="range" name="energy_daily" min="1" max="10" value="<?= $existing_checkin['energy_daily'] ?? 5 ?>" oninput="this.nextElementSibling.innerText = this.value">
                        <span><?= $existing_checkin['energy_daily'] ?? 5 ?></span>
                    </div>
                    <textarea name="energy_daily_notes" class="form-group" style="width:100%; padding: 0.8rem; border-radius: 5px; background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1; margin-bottom: 1.5rem;" placeholder="မှတ်စုတို (Notes)"><?= htmlspecialchars($existing_checkin['energy_daily_notes'] ?? '') ?></textarea>

                    <p>Motivation Level (စိတ်အားထက်သန်မှု)</p>
                    <div class="rating-group">
                        <input type="range" name="motivation" min="1" max="10" value="<?= $existing_checkin['motivation'] ?? 5 ?>" oninput="this.nextElementSibling.innerText = this.value">
                        <span><?= $existing_checkin['motivation'] ?? 5 ?></span>
                    </div>
                    <textarea name="motivation_notes" class="form-group" style="width:100%; padding: 0.8rem; border-radius: 5px; background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1;" placeholder="မှတ်စုတို (Notes)"><?= htmlspecialchars($existing_checkin['motivation_notes'] ?? '') ?></textarea>
                </div>

                <div class="question-box">
                    <label>ဘယ်နေရာမှာ အဓိက အခက်အခဲနဲ့ လိုအပ်ချက်ရှိတယ်လို့ ထင်သလဲ?</label>
                    <p class="hint">(ဥပမာ ဗိုက်အရမ်းဆာ၊ စိတ်မပါ၊ သေချာအလေးမနိုင်၊ သေချာမအိပ်ဖြစ်)</p>
                    <textarea name="struggle_notes" rows="3" class="form-group" style="width:100%; padding: 0.8rem; border-radius: 5px; background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1;"><?= htmlspecialchars($existing_checkin['struggle_notes'] ?? '') ?></textarea>
                </div>

                <div class="question-box">
                    <label>ဒီအပတ်မှာ ဘာတွေ တိုးတက်တယ်၊ အနိုင်ရတယ်လို့ ခံစားရလဲ?</label>
                    <p class="hint">(ဥပမာ အကျင့်တွေ ပိုရလာတာ၊ နေလို့ကောင်းတာ၊ Meal Plan မပျက် စားဖြစ်တာ၊ အလေးပိုနိုင်လာတာ)</p>
                    <textarea name="improvement_notes" rows="3" class="form-group" style="width:100%; padding: 0.8rem; border-radius: 5px; background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1;"><?= htmlspecialchars($existing_checkin['improvement_notes'] ?? '') ?></textarea>
                </div>

                <div class="question-box">
                    <label>လာမယ့်အပတ်မှာ Workout နဲ့ Diet ကို ထိခိုက်စေနိုင်မယ့် ကိစ္စတွေ ရှိလား?</label>
                    <p class="hint">(ဥပမာ ခရီး၊ ပွဲ၊ စာမေးပွဲ)</p>
                    <textarea name="upcoming_disruptions" rows="3" class="form-group" style="width:100%; padding: 0.8rem; border-radius: 5px; background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1;"><?= htmlspecialchars($existing_checkin['upcoming_disruptions'] ?? '') ?></textarea>
                </div>

                <div class="question-box">
                    <label>အစားအစာနဲ့ Exercise တွေ ပြောင်းချင်တာ၊ ထပ်ထည့်ချင်တာမျိုး ရှိလား?</label>
                    <p class="hint">Any changes you want to make to food/exercise?</p>
                    <textarea name="changes_wanted" rows="3" class="form-group" style="width:100%; padding: 0.8rem; border-radius: 5px; background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1;"><?= htmlspecialchars($existing_checkin['changes_wanted'] ?? '') ?></textarea>
                </div>

                <button type="submit" name="submit_checkin" class="btn btn-primary btn-block" style="font-size: 1.1rem; padding: 1rem;">Report တင်မည် (Submit Check-in)</button>
            </form>
            <br><br>
        </div>
    </div>
</body>
</html>






