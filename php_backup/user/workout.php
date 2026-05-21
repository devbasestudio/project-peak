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
$today = date('Y-m-d');

// Check if a workout exists for today
$stmt = $pdo->prepare("SELECT * FROM workouts WHERE user_id = ? AND date = ?");
$stmt->execute([$user_id, $today]);
$workout = $stmt->fetch();

if (!$workout) {
    // For demo purposes, we automatically create a workout for today
    // In a real app, Admin would assign these in the calendar
    $split_name = "Push Day (Chest, Shoulders, Triceps)";
    $stmt = $pdo->prepare("INSERT INTO workouts (user_id, date, split_name) VALUES (?, ?, ?)");
    $stmt->execute([$user_id, $today, $split_name]);
    $workout_id = $pdo->lastInsertId();

    $exercises = [
        ['name' => 'Barbell Bench Press', 'sets' => 3, 'reps' => '8-10'],
        ['name' => 'Incline Dumbbell Press', 'sets' => 3, 'reps' => '10-12'],
        ['name' => 'Overhead Press', 'sets' => 3, 'reps' => '8-10'],
        ['name' => 'Tricep Pushdown', 'sets' => 3, 'reps' => '12-15']
    ];

    foreach ($exercises as $ex) {
        $stmt = $pdo->prepare("INSERT INTO workout_exercises (workout_id, exercise_name, target_sets, target_reps) VALUES (?, ?, ?, ?)");
        $stmt->execute([$workout_id, $ex['name'], $ex['sets'], $ex['reps']]);
    }
    
    // Fetch it again
    $stmt = $pdo->prepare("SELECT * FROM workouts WHERE id = ?");
    $stmt->execute([$workout_id]);
    $workout = $stmt->fetch();
}

$workout_id = $workout['id'];

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['save_workout'])) {
    // Update exercises
    if (isset($_POST['ex_id'])) {
        foreach ($_POST['ex_id'] as $idx => $ex_id) {
            $act_w = $_POST['act_weight'][$idx];
            $act_r = $_POST['act_reps'][$idx];
            $stmt = $pdo->prepare("UPDATE workout_exercises SET actual_weight=?, actual_reps=? WHERE id=?");
            $stmt->execute([$act_w, $act_r, $ex_id]);
        }
    }
    
    // Update workout notes
    $notes = $_POST['user_notes'];
    $feelings = $_POST['user_feelings'];
    $stmt = $pdo->prepare("UPDATE workouts SET user_notes=?, user_feelings=?, completed=1 WHERE id=?");
    $stmt->execute([$notes, $feelings, $workout_id]);
    
    $success = "လေ့ကျင့်ခန်း မှတ်တမ်းတင်ပြီးပါပြီ! (Workout saved!)";
    
    // Refresh
    $stmt = $pdo->prepare("SELECT * FROM workouts WHERE id = ?");
    $stmt->execute([$workout_id]);
    $workout = $stmt->fetch();
}

// Fetch exercises
$stmt = $pdo->prepare("SELECT * FROM workout_exercises WHERE workout_id = ?");
$stmt->execute([$workout_id]);
$exercises = $stmt->fetchAll();

?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Workout | Project Peak</title>
    <link rel="stylesheet" href="../assets/css/style.css">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <style>
        .exercise-card { background: rgba(0,0,0,0.05); padding: 1.5rem; border-radius: 10px; border: 1px solid var(--glass-border); margin-bottom: 1rem; }
        .exercise-card h4 { color: var(--accent-color); margin-bottom: 1rem; font-size: 1.2rem; }
        .set-row { display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem; }
        .set-row input { background: #f8fafc; border: 1px solid #cbd5e1; padding: 0.5rem; border-radius: 5px; color: #0f172a; width: 80px; text-align: center; }
        .set-label { width: 100px; color: var(--text-muted); }
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
            <h2><i class="ph ph-barbell"></i> ယနေ့လေ့ကျင့်ခန်း (Today's Workout - <?= $today ?>)</h2>
            <h3 class="mt-3 mb-3" style="color: var(--text-muted);"><?= htmlspecialchars($workout['split_name']) ?></h3>

            <?php if(isset($success)): ?>
                <div style="background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; padding: 1rem; border-radius: 10px; margin-bottom: 1rem; color: #4ade80;">
                    <?= $success ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="workout.php<?= $client_query ?>">
                <?php foreach($exercises as $idx => $ex): ?>
                    <div class="exercise-card">
                        <h4><?= htmlspecialchars($ex['exercise_name']) ?></h4>
                        <div class="set-row">
                            <span class="set-label">Target:</span>
                            <span style="font-weight:bold;"><?= $ex['target_sets'] ?> Sets x <?= $ex['target_reps'] ?> Reps</span>
                        </div>
                        <div class="set-row mt-3">
                            <span class="set-label">Actual:</span>
                            <input type="hidden" name="ex_id[]" value="<?= $ex['id'] ?>">
                            <input type="text" name="act_weight[]" placeholder="Weight" value="<?= htmlspecialchars($ex['actual_weight'] ?? '') ?>"> kg
                            <input type="text" name="act_reps[]" placeholder="Reps" value="<?= htmlspecialchars($ex['actual_reps'] ?? '') ?>"> reps
                        </div>
                    </div>
                <?php endforeach; ?>

                <div class="glass-card mt-4" style="max-width: 100%;">
                    <h3><i class="ph ph-note-pencil"></i> မှတ်စုများ (Notes & Feelings)</h3>
                    <p style="color:var(--text-muted); font-size: 0.9rem; margin-bottom:1rem;">ဘယ်လိုခံစားရလဲ? ဘာတွေသတိထားမိလဲ? (How did it feel? What did you focus on?)</p>
                    
                    <div class="form-group">
                        <label>Feelings / Body Condition</label>
                        <textarea name="user_feelings" rows="3" placeholder="ဥပမာ: ပခုံးနည်းနည်းနာတယ်၊ အရမ်း Energy အပြည့်ရှိတယ်..."><?= htmlspecialchars($workout['user_feelings'] ?? '') ?></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Workout Notes</label>
                        <textarea name="user_notes" rows="3" placeholder="ဥပမာ: Bench press နေတုန်း Form ကို ပိုဂရုစိုက်ခဲ့တယ်..."><?= htmlspecialchars($workout['user_notes'] ?? '') ?></textarea>
                    </div>
                </div>

                <button type="submit" name="save_workout" class="btn btn-primary btn-block mt-4" style="font-size: 1.1rem; padding: 1rem;">သိမ်းဆည်းပြီး အဆုံးသတ်မည် (Save & Complete)</button>
                <br><br>
            </form>
        </div>
    </div>
</body>
</html>






