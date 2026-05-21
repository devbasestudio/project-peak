<?php
// Test different ports and auth
$configs = [
    ['host' => '127.0.0.1', 'port' => 3306, 'user' => 'root', 'pass' => ''],
    ['host' => 'localhost', 'port' => 3306, 'user' => 'root', 'pass' => ''],
    ['host' => '127.0.0.1', 'port' => 3307, 'user' => 'root', 'pass' => ''],
];

foreach ($configs as $c) {
    echo "Testing {$c['host']}:{$c['port']} user={$c['user']}... ";
    try {
        $pdo = new PDO("mysql:host={$c['host']};port={$c['port']};charset=utf8mb4", $c['user'], $c['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
        echo "SUCCESS!\n";
        $dbs = $pdo->query("SHOW DATABASES")->fetchAll(PDO::FETCH_COLUMN);
        echo "  Databases: " . implode(', ', $dbs) . "\n";
        break;
    } catch (PDOException $e) {
        echo "FAIL: " . $e->getMessage() . "\n";
    }
}
