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

$week_offset = isset($_GET['w']) ? (int)$_GET['w'] : 1; // Default to week 1

// Handle form submission for today
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['save_daily'])) {
    $date = $_POST['date'];
    $body_weight = !empty($_POST['body_weight']) ? $_POST['body_weight'] : null;
    $steps = !empty($_POST['steps']) ? $_POST['steps'] : null;
    $sleep_score = !empty($_POST['sleep_score']) ? $_POST['sleep_score'] : null;
    
    $water_3l = isset($_POST['water_3l']) ? 1 : 0;
    $omega_3 = isset($_POST['omega_3']) ? 1 : 0;
    $bed_phone_filter = isset($_POST['bed_phone_filter']) ? 1 : 0;
    $meal_plan_adhered = isset($_POST['meal_plan_adhered']) ? 1 : 0;
    $toilet = isset($_POST['toilet']) ? 1 : 0;

    $stmt = $pdo->prepare("INSERT INTO daily_trackers (user_id, date, body_weight, steps, sleep_score, water_3l, omega_3, bed_phone_filter, meal_plan_adhered, toilet) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                           ON DUPLICATE KEY UPDATE body_weight=?, steps=?, sleep_score=?, water_3l=?, omega_3=?, bed_phone_filter=?, meal_plan_adhered=?, toilet=?");
    $stmt->execute([$user_id, $date, $body_weight, $steps, $sleep_score, $water_3l, $omega_3, $bed_phone_filter, $meal_plan_adhered, $toilet,
                    $body_weight, $steps, $sleep_score, $water_3l, $omega_3, $bed_phone_filter, $meal_plan_adhered, $toilet]);

    // Journaling
    $diet_status = !empty($_POST['diet_status']) ? $_POST['diet_status'] : null;
    $satisfied = $_POST['satisfied_with'];
    $difficult = $_POST['difficult_with'];
    
    $stmt = $pdo->prepare("INSERT INTO journaling (user_id, date, diet_status, satisfied_with, difficult_with) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE diet_status=?, satisfied_with=?, difficult_with=?");
    $stmt->execute([$user_id, $date, $diet_status, $satisfied, $difficult, $diet_status, $satisfied, $difficult]);
    
    $client_q_amp = $is_admin_viewing ? "&client_id=" . $user_id : "";
    header("Location: daily_log.php?w=" . $week_offset . $client_q_amp);
    exit();
}

// Get program start date
$stmt = $pdo->prepare("SELECT start_date FROM programs WHERE user_id = ?");
$stmt->execute([$user_id]);
$start_date_str = $stmt->fetchColumn();
if (!$start_date_str) $start_date_str = date('Y-m-d');

$start_date = new DateTime($start_date_str);
// Adjust to the Monday of that week
$start_date->modify('Monday this week');

// Calculate dates for the selected week
$week_start = clone $start_date;
$week_start->modify('+' . ($week_offset - 1) . ' weeks');

$days = [];
$tracker_data = [];
$journal_data = [];

for ($i = 0; $i < 7; $i++) {
    $current_day = clone $week_start;
    $current_day->modify("+$i days");
    $date_str = $current_day->format('Y-m-d');
    $days[] = ['name' => $current_day->format('D'), 'date' => $date_str];

    // Fetch tracker data
    $stmt = $pdo->prepare("SELECT * FROM daily_trackers WHERE user_id = ? AND date = ?");
    $stmt->execute([$user_id, $date_str]);
    $tracker_data[$date_str] = $stmt->fetch() ?: [];

    // Fetch journal data
    $stmt = $pdo->prepare("SELECT * FROM journaling WHERE user_id = ? AND date = ?");
    $stmt->execute([$user_id, $date_str]);
    $journal_data[$date_str] = $stmt->fetch() ?: [];
}

$today = date('Y-m-d');

// Helper for averages
function calc_avg($data, $key) {
    $sum = 0; $count = 0;
    foreach ($data as $d) {
        if (!empty($d) && isset($d[$key]) && is_numeric($d[$key])) {
            $sum += $d[$key]; $count++;
        }
    }
    return $count > 0 ? round($sum / $count, 1) : '-';
}
function calc_checked_avg($data, $key) {
    $sum = 0;
    foreach ($data as $d) {
        if (!empty($d) && !empty($d[$key])) {
            $sum++;
        }
    }
    return round(($sum / 7) * 100) . '%';
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Daily Log | Project Peak</title>
    <link rel="stylesheet" href="../assets/css/style.css">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <style>
        .week-nav { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 1rem; margin-bottom: 1rem; }
        .week-btn { padding: 0.5rem 1rem; border-radius: 5px; background: rgba(0,0,0,0.05); color: #0f172a; text-decoration: none; border: 1px solid var(--glass-border); white-space: nowrap; }
        .week-btn.active { background: var(--btn-primary); border-color: transparent; }
        table th, table td { text-align: center; font-size: 0.9rem; }
        table th { background: rgba(0,0,0,0.05); }
        .input-mini { width: 60px; padding: 0.2rem; background: #f8fafc; border: 1px solid #cbd5e1; color: #0f172a; text-align: center; border-radius: 3px; }
        .journal-section { display: flex; flex-direction: column; gap: 1rem; }
        .journal-card { background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 10px; border: 1px solid var(--glass-border); }
        .journal-card h4 { color: var(--accent-color); margin-bottom: 0.5rem; }
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
        <div class="main-content" style="margin-left: 0;">
            <h2><i class="ph ph-calendar-check"></i> 12 Weeks Tracker</h2>
            
            <div class="week-nav mt-3">
                <?php for($w=1; $w<=12; $w++): ?>
                    <a href="?w=<?= $w ?><?= $is_admin_viewing ? '&client_id='.$user_id : '' ?>" class="week-btn <?= $w == $week_offset ? 'active' : '' ?>">Week <?= $w ?></a>
                <?php endfor; ?>
            </div>

            <div class="table-container mb-3">
                <form method="POST" action="daily_log.php?w=<?= $week_offset ?><?= $is_admin_viewing ? '&client_id='.$user_id : '' ?>">
                    <!-- Date context for form is Today -->
                    <input type="hidden" name="date" value="<?= $today ?>">
                    <table>
                        <thead>
                            <tr>
                                <th>Metrics / Habits</th>
                                <?php foreach($days as $day): ?>
                                    <th style="<?= $day['date'] == $today ? 'color:#38bdf8;' : '' ?>">
                                        <?= $day['name'] ?><br><small><?= substr($day['date'], 5) ?></small>
                                    </th>
                                <?php endforeach; ?>
                                <th>Weekly Avg</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Metrics -->
                            <tr>
                                <td style="text-align:left;">Body Weight (kg)</td>
                                <?php foreach($days as $day): $d = $day['date']; ?>
                                    <td><?= !empty($tracker_data[$d]) ? $tracker_data[$d]['body_weight'] : '-' ?></td>
                                <?php endforeach; ?>
                                <td><?= calc_avg($tracker_data, 'body_weight') ?></td>
                            </tr>
                            <tr>
                                <td style="text-align:left;">Steps</td>
                                <?php foreach($days as $day): $d = $day['date']; ?>
                                    <td><?= !empty($tracker_data[$d]) ? $tracker_data[$d]['steps'] : '-' ?></td>
                                <?php endforeach; ?>
                                <td><?= calc_avg($tracker_data, 'steps') ?></td>
                            </tr>
                            <tr>
                                <td style="text-align:left;">Sleep Score (Hrs)</td>
                                <?php foreach($days as $day): $d = $day['date']; ?>
                                    <td><?= !empty($tracker_data[$d]) ? $tracker_data[$d]['sleep_score'] : '-' ?></td>
                                <?php endforeach; ?>
                                <td><?= calc_avg($tracker_data, 'sleep_score') ?></td>
                            </tr>
                            
                            <!-- Habits -->
                            <tr>
                                <td style="text-align:left;">3L Water</td>
                                <?php foreach($days as $day): $d = $day['date']; ?>
                                    <td><?= !empty($tracker_data[$d]['water_3l']) ? '<i class="ph-bold ph-check" style="color:#22c55e;"></i>' : '-' ?></td>
                                <?php endforeach; ?>
                                <td><?= calc_checked_avg($tracker_data, 'water_3l') ?></td>
                            </tr>
                            <tr>
                                <td style="text-align:left;">Omega 3</td>
                                <?php foreach($days as $day): $d = $day['date']; ?>
                                    <td><?= !empty($tracker_data[$d]['omega_3']) ? '<i class="ph-bold ph-check" style="color:#22c55e;"></i>' : '-' ?></td>
                                <?php endforeach; ?>
                                <td><?= calc_checked_avg($tracker_data, 'omega_3') ?></td>
                            </tr>
                            <tr>
                                <td style="text-align:left;">Bed Phone Filter</td>
                                <?php foreach($days as $day): $d = $day['date']; ?>
                                    <td><?= !empty($tracker_data[$d]['bed_phone_filter']) ? '<i class="ph-bold ph-check" style="color:#22c55e;"></i>' : '-' ?></td>
                                <?php endforeach; ?>
                                <td><?= calc_checked_avg($tracker_data, 'bed_phone_filter') ?></td>
                            </tr>
                            <tr>
                                <td style="text-align:left;">Meal Plan</td>
                                <?php foreach($days as $day): $d = $day['date']; ?>
                                    <td><?= !empty($tracker_data[$d]['meal_plan_adhered']) ? '<i class="ph-bold ph-check" style="color:#22c55e;"></i>' : '-' ?></td>
                                <?php endforeach; ?>
                                <td><?= calc_checked_avg($tracker_data, 'meal_plan_adhered') ?></td>
                            </tr>
                            <tr>
                                <td style="text-align:left;">Toilet</td>
                                <?php foreach($days as $day): $d = $day['date']; ?>
                                    <td><?= !empty($tracker_data[$d]['toilet']) ? '<i class="ph-bold ph-check" style="color:#22c55e;"></i>' : '-' ?></td>
                                <?php endforeach; ?>
                                <td><?= calc_checked_avg($tracker_data, 'toilet') ?></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="glass-card mt-4" style="max-width: 100%;">
                    <h3>ယနေ့မှတ်တမ်း (Today's Entry - <?= $today ?>)</h3>
                    <div class="grid-cards mt-3">
                        <div class="form-group">
                            <label>Body Weight (kg)</label>
                            <input type="number" step="0.1" name="body_weight" value="<?= !empty($tracker_data[$today]['body_weight']) ? $tracker_data[$today]['body_weight'] : '' ?>">
                        </div>
                        <div class="form-group">
                            <label>Steps</label>
                            <input type="number" name="steps" value="<?= !empty($tracker_data[$today]['steps']) ? $tracker_data[$today]['steps'] : '' ?>">
                        </div>
                        <div class="form-group">
                            <label>Sleep Time (Hrs)</label>
                            <input type="number" step="0.5" name="sleep_score" value="<?= !empty($tracker_data[$today]['sleep_score']) ? $tracker_data[$today]['sleep_score'] : '' ?>">
                        </div>
                    </div>
                    
                    <h4>Habits</h4>
                    <div style="display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1rem;">
                        <label><input type="checkbox" name="water_3l" <?= !empty($tracker_data[$today]['water_3l']) ? 'checked' : '' ?>> 3L Water</label>
                        <label><input type="checkbox" name="omega_3" <?= !empty($tracker_data[$today]['omega_3']) ? 'checked' : '' ?>> Omega 3</label>
                        <label><input type="checkbox" name="bed_phone_filter" <?= !empty($tracker_data[$today]['bed_phone_filter']) ? 'checked' : '' ?>> Bed Phone Filter</label>
                        <label><input type="checkbox" name="meal_plan_adhered" <?= !empty($tracker_data[$today]['meal_plan_adhered']) ? 'checked' : '' ?>> Meal Plan (Ati kya nipa)</label>
                        <label><input type="checkbox" name="toilet" <?= !empty($tracker_data[$today]['toilet']) ? 'checked' : '' ?>> Toilet</label>
                    </div>

                    <h4><i class="ph ph-book-open"></i> Journaling</h4>
                    <div class="form-group">
                        <label>Diet (Over/Under/Ok)</label>
                        <select name="diet_status">
                            <option value="">ရွေးချယ်ပါ (Select)</option>
                            <option value="over" <?= (!empty($journal_data[$today]['diet_status']) && $journal_data[$today]['diet_status'] == 'over') ? 'selected' : '' ?>>Over</option>
                            <option value="under" <?= (!empty($journal_data[$today]['diet_status']) && $journal_data[$today]['diet_status'] == 'under') ? 'selected' : '' ?>>Under</option>
                            <option value="ok" <?= (!empty($journal_data[$today]['diet_status']) && $journal_data[$today]['diet_status'] == 'ok') ? 'selected' : '' ?>>Ok</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>ဒီနေ့အတွက် ကျေနပ်ခဲ့ရတဲ့ အရာတစ်ခုက ဘာလဲ? (Satisfied with)</label>
                        <textarea name="satisfied_with" rows="2"><?= !empty($journal_data[$today]['satisfied_with']) ? htmlspecialchars($journal_data[$today]['satisfied_with']) : '' ?></textarea>
                    </div>
                    <div class="form-group">
                        <label>ဒီနေ့အတွက် ခက်ခဲခဲ့တဲ့ အရာတစ်ခုက ဘာလဲ? (Difficult with)</label>
                        <textarea name="difficult_with" rows="2"><?= !empty($journal_data[$today]['difficult_with']) ? htmlspecialchars($journal_data[$today]['difficult_with']) : '' ?></textarea>
                    </div>
                    
                    <button type="submit" name="save_daily" class="btn btn-primary">မှတ်တမ်းတင်မည် (Save)</button>
                </form>
            </div>
            
            <div class="mt-4">
                <h3>ယခင်မှတ်တမ်းများ (Week's Journals)</h3>
                <div class="journal-section mt-3">
                    <?php foreach($days as $day): $d = $day['date']; if(!empty($journal_data[$d]) && (!empty($journal_data[$d]['satisfied_with']) || !empty($journal_data[$d]['difficult_with']))): ?>
                        <div class="journal-card">
                            <h4><?= $day['name'] ?> (<?= $d ?>) - Diet: <?= htmlspecialchars($journal_data[$d]['diet_status'] ?? 'N/A') ?></h4>
                            <p><strong>Satisfied:</strong> <?= htmlspecialchars($journal_data[$d]['satisfied_with']) ?></p>
                            <p><strong>Difficult:</strong> <?= htmlspecialchars($journal_data[$d]['difficult_with']) ?></p>
                        </div>
                    <?php endif; endforeach; ?>
                </div>
            </div>

        </div>
    </div>
</body>
</html>






