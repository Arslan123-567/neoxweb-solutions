<?php
/*
    FILE: config/cors.php
    PURPOSE: Restrict browser API access to configured frontend origins
*/

require_once __DIR__ . '/../app/Bootstrap.php';
\App\Bootstrap::init();

$origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
$configuredOrigins = \App\Config\Env::get(
    'CORS_ALLOWED_ORIGINS',
    'https://neoxweb.com,https://www.neoxweb.com,http://localhost,http://127.0.0.1'
);
$allowedOrigins = array_values(array_filter(array_map(
    static fn(string $value): string => rtrim(trim($value), '/'),
    explode(',', (string) $configuredOrigins)
)));

header('Vary: Origin');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
header('Access-Control-Max-Age: 600');

if ($origin !== '' && in_array(rtrim($origin, '/'), $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} elseif ($origin !== '' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(403);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
?>
