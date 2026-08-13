<?php

declare(strict_types=1);

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Credentials: true');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$envPaths = [__DIR__ . '/.env', __DIR__ . '/../.env'];
foreach ($envPaths as $envPath) {
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) continue;
            if (str_contains($line, '=')) {
                [$name, $val] = explode('=', $line, 2);
                $name = trim($name);
                $val = trim($val, " \t\n\r\0\x0B\"'");
                putenv("{$name}={$val}");
                $_ENV[$name] = $val;
            }
        }
    }
}

$host = getenv('DB_HOST') ?: 'sql213.infinityfree.com';
$port = getenv('DB_PORT') ?: '3306';
$database = getenv('DB_NAME') ?: 'if0_42649278_epiz_12345678_campusgigs';
$username = getenv('DB_USER') ?: 'if0_42649278';
$password = getenv('DB_PASSWORD') !== false && getenv('DB_PASSWORD') !== '' ? getenv('DB_PASSWORD') : '78839shopnil';

$dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

if (getenv('MYSQL_ATTR_SSL_CA')) {
    $options[PDO::MYSQL_ATTR_SSL_CA] = getenv('MYSQL_ATTR_SSL_CA');
}

try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $exception) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed. Check your database credentials and MySQL status.',
        'details' => $exception->getMessage(),
        'host' => $host,
        'database' => $database,
        'username' => $username
    ]);
    exit;
}

