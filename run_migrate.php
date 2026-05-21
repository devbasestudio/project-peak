<?php
// Run migration via PHP PDO
$host = '127.0.0.1';
$port = '3306';
$db   = 'project_peak';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "Connected to database.\n";
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage() . "\n");
}

$sql = file_get_contents(__DIR__ . '/migrate.sql');
$statements = array_filter(array_map('trim', explode(';', $sql)));

$success = 0;
$errors = 0;
foreach ($statements as $stmt) {
    if (empty($stmt) || strpos($stmt, '--') === 0) continue;
    try {
        $pdo->exec($stmt);
        $success++;
    } catch (PDOException $e) {
        $msg = $e->getMessage();
        // Ignore "already exists" and "duplicate column" errors
        if (strpos($msg, 'already exists') !== false || strpos($msg, 'Duplicate column') !== false || strpos($msg, 'Duplicate key name') !== false) {
            echo "SKIP: " . substr($stmt, 0, 60) . "... (already exists)\n";
        } else {
            echo "ERROR: " . $msg . "\n";
            echo "  SQL: " . substr($stmt, 0, 80) . "...\n";
            $errors++;
        }
    }
}
echo "\nDone! $success statements executed, $errors errors.\n";

// Verify tables
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "\nTables in project_peak:\n";
foreach ($tables as $t) echo "  - $t\n";
echo "\nExercise count: " . $pdo->query("SELECT COUNT(*) FROM exercise_library")->fetchColumn() . "\n";
echo "Nutrition count: " . $pdo->query("SELECT COUNT(*) FROM nutrition_items")->fetchColumn() . "\n";
