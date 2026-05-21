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

$stmt = $pdo->prepare("SELECT * FROM programs WHERE user_id = ?");
$stmt->execute([$user_id]);
$program = $stmt->fetch();

$cals = $program['target_calories'] ?? 2000;
$p = $program['macros_p'] ?? 150;
$c = $program['macros_c'] ?? 200;
$f = $program['macros_f'] ?? 60;
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Diet Plan | Project Peak</title>
    <link rel="stylesheet" href="../assets/css/style.css">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <style>
        .macro-card { background: rgba(0,0,0,0.05); padding: 1.5rem; border-radius: 10px; text-align: center; border: 1px solid var(--glass-border); flex: 1; }
        .macro-val { font-size: 2rem; font-weight: 900; color: var(--accent-color); margin: 0.5rem 0; }
        .meal-section { background: #f8fafc; color: #1e293b; border-radius: 10px; overflow: hidden; margin-bottom: 1.5rem; }
        .meal-header { background: #e2e8f0; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; font-weight: 700; cursor: pointer; }
        .meal-header .macros { font-weight: 400; font-size: 0.9rem; color: #475569; }
        .meal-items { padding: 0; margin: 0; list-style: none; }
        .meal-item { padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; }
        .meal-item:hover { background: #f1f5f9; }
        .food-info { display: flex; align-items: center; gap: 1rem; flex: 2; }
        .food-portion { flex: 1; text-align: center; color: #64748b; }
        .food-cals { flex: 1; text-align: right; font-weight: 700; }
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
        <div class="main-content" style="margin-left: 0; max-width: 900px; margin: 0 auto;">
            <h2><i class="ph ph-fork-knife"></i> သင့်အတွက် Meal Plan (Diet Plan)</h2>
            
            <div style="display:flex; gap: 1.5rem; margin-top: 2rem; margin-bottom: 2rem; flex-wrap: wrap;">
                <div class="macro-card" style="flex: 2; border-color: #38bdf8;">
                    <h3>Daily Target Calories</h3>
                    <div class="macro-val" style="font-size: 2.5rem;"><?= $cals ?> <span style="font-size:1rem; color:var(--text-muted);">kcal</span></div>
                </div>
                <div class="macro-card">
                    <h3>Protein</h3>
                    <div class="macro-val"><?= $p ?>g</div>
                </div>
                <div class="macro-card">
                    <h3>Carbs</h3>
                    <div class="macro-val"><?= $c ?>g</div>
                </div>
                <div class="macro-card">
                    <h3>Fat</h3>
                    <div class="macro-val"><?= $f ?>g</div>
                </div>
            </div>

            <!-- Diet Plan Sample UI (based on user provided image) -->
            <div class="meal-section">
                <div class="meal-header">
                    <span>Breakfast</span>
                    <span class="macros">313 kcal • 15 g protein • 51 g carbs • 5 g fat</span>
                </div>
                <ul class="meal-items">
                    <li class="meal-item">
                        <div class="food-info"><i class="ph ph-apple-logo" style="color:#ef4444; font-size: 1.2rem;"></i> Mixed berries, frozen, unsweetened</div>
                        <div class="food-portion">100 g</div>
                        <div class="food-cals">51.5 kcal</div>
                    </li>
                    <li class="meal-item">
                        <div class="food-info"><i class="ph ph-bowl-food" style="color:#ef4444; font-size: 1.2rem;"></i> Yogurt, Plain, Lowfat</div>
                        <div class="food-portion">250 g</div>
                        <div class="food-cals">157.5 kcal</div>
                    </li>
                    <li class="meal-item">
                        <div class="food-info"><i class="ph ph-apple-logo" style="color:#ef4444; font-size: 1.2rem;"></i> Bananas, Raw</div>
                        <div class="food-portion">1 medium</div>
                        <div class="food-cals">103.8 kcal</div>
                    </li>
                </ul>
            </div>

            <div class="meal-section">
                <div class="meal-header">
                    <span>Lunch</span>
                    <span class="macros">615 kcal • 57 g protein • 91 g carbs • 1 g fat</span>
                </div>
                <ul class="meal-items">
                    <li class="meal-item">
                        <div class="food-info"><i class="ph ph-apple-logo" style="color:#ef4444; font-size: 1.2rem;"></i> Rice, White, Long-Grain, Cooked</div>
                        <div class="food-portion">100 g</div>
                        <div class="food-cals">365 kcal</div>
                    </li>
                    <li class="meal-item">
                        <div class="food-info"><i class="ph ph-shrimp" style="color:#ef4444; font-size: 1.2rem;"></i> Shrimp, Cooked</div>
                        <div class="food-portion">200 g</div>
                        <div class="food-cals">198 kcal</div>
                    </li>
                    <li class="meal-item">
                        <div class="food-info"><i class="ph ph-plant" style="color:#ef4444; font-size: 1.2rem;"></i> Pumpkin, Raw</div>
                        <div class="food-portion">200 g</div>
                        <div class="food-cals">52 kcal</div>
                    </li>
                </ul>
            </div>

            <div class="meal-section">
                <div class="meal-header">
                    <span>Dinner</span>
                    <span class="macros">514 kcal • 30 g protein • 66 g carbs • 11 g fat</span>
                </div>
                <ul class="meal-items">
                    <li class="meal-item">
                        <div class="food-info"><i class="ph ph-plant" style="color:#ef4444; font-size: 1.2rem;"></i> Potatoes, Flesh and Skin</div>
                        <div class="food-portion">300 g</div>
                        <div class="food-cals">231 kcal</div>
                    </li>
                    <li class="meal-item">
                        <div class="food-info"><i class="ph ph-plant" style="color:#ef4444; font-size: 1.2rem;"></i> Broccoli, Raw</div>
                        <div class="food-portion">200 g</div>
                        <div class="food-cals">68 kcal</div>
                    </li>
                    <li class="meal-item">
                        <div class="food-info"><i class="ph ph-egg" style="color:#ef4444; font-size: 1.2rem;"></i> Egg, Raw</div>
                        <div class="food-portion">2 medium</div>
                        <div class="food-cals">136.4 kcal</div>
                    </li>
                    <li class="meal-item">
                        <div class="food-info"><i class="ph ph-plant" style="color:#ef4444; font-size: 1.2rem;"></i> Cabbage, Kimchi</div>
                        <div class="food-portion">70 g</div>
                        <div class="food-cals">10.5 kcal</div>
                    </li>
                </ul>
            </div>

            <div class="meal-section">
                <div class="meal-header">
                    <span>Snacks</span>
                    <span class="macros">204 kcal • 24 g protein • 2 g carbs • 11 g fat</span>
                </div>
                <ul class="meal-items">
                    <li class="meal-item">
                        <div class="food-info"><i class="ph ph-pill" style="color:#a855f7; font-size: 1.2rem;"></i> Whey Protein Powder</div>
                        <div class="food-portion">1 scoop</div>
                        <div class="food-cals">115.7 kcal</div>
                    </li>
                </ul>
            </div>

        </div>
    </div>
</body>
</html>






