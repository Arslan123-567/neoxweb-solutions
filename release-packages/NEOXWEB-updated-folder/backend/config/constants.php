<?php
/*
    FILE: config/constants.php
    PURPOSE: Application constants (.env aware)
*/

require_once __DIR__ . '/../app/Bootstrap.php';

use App\Bootstrap;
use App\Config\Env;

Bootstrap::init();

define('BASE_PATH', dirname(__DIR__));
define('ADMIN_PATH', BASE_PATH . '/admin');
define('API_PATH', BASE_PATH . '/api');
define('UPLOAD_PATH', BASE_PATH . '/uploads');

$appEnv = strtolower(trim((string) (Env::get('APP_ENV', 'production') ?? 'production')));
$isProduction = in_array($appEnv, ['production', 'prod'], true);
$baseUrl = Env::get('APP_BASE_URL', 'http://localhost/time/backend') ?? 'http://localhost/time/backend';
define('BASE_URL', rtrim($baseUrl, '/'));
define('API_URL', BASE_URL . '/api');
define('FRONTEND_URL', rtrim(Env::get('FRONTEND_URL', 'http://localhost/time/project') ?? 'http://localhost/time/project', '/'));

define('APP_NAME', 'Nexura Admin');
define('APP_VERSION', '3.1.0');

$jwtSecret = trim((string) (Env::get('JWT_SECRET', '') ?? ''));
if (!$isProduction && (strlen($jwtSecret) < 32 || preg_match('/change-this|replace-with|example|nexura-jwt-secret/i', $jwtSecret))) {
    $jwtSecret = 'local-development-only-jwt-secret-do-not-deploy';
}
if (strlen($jwtSecret) < 32 || ($isProduction && preg_match('/change-this|replace-with|replace-me|example|nexura-jwt-secret/i', $jwtSecret))) {
    throw new RuntimeException('Set a unique JWT_SECRET of at least 32 characters in backend/.env.');
}
define('JWT_SECRET', $jwtSecret);
define('JWT_TTL', (int) (Env::get('JWT_TTL', '604800') ?? 604800));

define('REALTIME_URL', rtrim(Env::get('REALTIME_URL', '') ?? '', '/'));
define('REALTIME_SECRET', Env::get('REALTIME_SECRET', '') ?? '');

?>
