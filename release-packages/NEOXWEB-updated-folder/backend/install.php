<?php
/**
 * One-click database installer (.env aware)
 * Open: http://localhost/time/backend/install.php
 */

require_once __DIR__ . '/app/Bootstrap.php';

use App\Bootstrap;
use App\Config\Env;
use App\Core\Database;
use App\Services\SessionService;

Bootstrap::init();

header('Content-Type: text/html; charset=UTF-8');

$sessionService = new SessionService();
$sessionService->startSecure();
if (empty($_SESSION['install_csrf_token'])) {
    $_SESSION['install_csrf_token'] = bin2hex(random_bytes(32));
}

$message = '';
$success = false;
$mysqlOk = false;
$dbOk = false;
$userCount = 0;
$dbName = Env::get('DB_NAME', 'nexura_db') ?? 'nexura_db';
$appEnv = strtolower(trim((string) (Env::get('APP_ENV', 'production') ?? 'production')));
$isProduction = in_array($appEnv, ['production', 'prod'], true);
$installToken = trim((string) (Env::get('INSTALL_TOKEN', '') ?? ''));
$installerEnabled = !$isProduction || (Env::bool('APP_INSTALLER_ENABLED', false) && $installToken !== '');

function checkDatabaseStatus(string $dbName): array
{
    $status = ['mysql' => false, 'database' => false, 'users' => 0, 'error' => ''];

    try {
        $pdo = Database::serverConnection();
        $status['mysql'] = true;

        $pdo->exec('USE `' . str_replace('`', '``', $dbName) . '`');
        $status['database'] = true;
        $status['users'] = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    } catch (Throwable $e) {
        $status['error'] = $e->getMessage();
    }

    return $status;
}

$status = checkDatabaseStatus($dbName);
$mysqlOk = $status['mysql'];
$dbOk = $status['database'];
$userCount = $status['users'];

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $submittedCsrf = (string) ($_POST['csrf_token'] ?? '');
    if (!hash_equals((string) $_SESSION['install_csrf_token'], $submittedCsrf)) {
        http_response_code(403);
        $message = 'Installation request expired. Reload this page and try again.';
    } elseif (!$installerEnabled) {
        http_response_code(403);
        $message = 'Installer is disabled. Enable it temporarily in backend/.env with APP_INSTALLER_ENABLED=true and a unique INSTALL_TOKEN.';
    } elseif ($isProduction && !hash_equals($installToken, (string) ($_POST['install_token'] ?? ''))) {
        http_response_code(403);
        $message = 'Invalid installer token.';
    } elseif ($userCount > 0) {
        http_response_code(409);
        $message = 'Installation is locked because user accounts already exist. The installer cannot reset or replace an existing admin account.';
    } elseif (!$mysqlOk) {
        $message = 'MySQL is not running â€” start MySQL in XAMPP, then try again.';
    } else {
        try {
            $pdo = Database::serverConnection();
            $sqlFile = null;
            foreach (['abv.sql', 'abs.sql', 'nexura_complete.sql'] as $candidate) {
                $candidatePath = __DIR__ . '/database/' . $candidate;
                if (is_file($candidatePath)) {
                    $sqlFile = $candidatePath;
                    break;
                }
            }
            if ($sqlFile === null) {
                throw new RuntimeException('No database schema file is available.');
            }

            $sql = file_get_contents($sqlFile);
            if ($sql === false) {
                throw new RuntimeException('Unable to read the database schema file.');
            }
            $sql = preg_replace('/--[^\n]*\n/', "\n", $sql);
            $statements = array_filter(array_map('trim', explode(';', $sql)));

            foreach ($statements as $statement) {
                if ($statement === '') {
                    continue;
                }
                try {
                    $pdo->exec($statement);
                } catch (PDOException $e) {
                    // Ignore duplicate/non-critical during re-install
                }
            }

            require_once __DIR__ . '/includes/site-stats.php';
            $pdo->exec('USE `' . str_replace('`', '``', $dbName) . '`');
            seedDefaultSiteStats($pdo);

            $existingUserCount = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
            if ($existingUserCount > 0) {
                throw new RuntimeException('The imported schema already contains user accounts.');
            }

            $initialAdminPassword = trim((string) (Env::get('INITIAL_ADMIN_PASSWORD', '') ?? ''));
            if ($initialAdminPassword === '') {
                $initialAdminPassword = bin2hex(random_bytes(16));
            }
            if (strlen($initialAdminPassword) < 12) {
                throw new RuntimeException('INITIAL_ADMIN_PASSWORD must be at least 12 characters.');
            }
            $adminHash = password_hash($initialAdminPassword, PASSWORD_DEFAULT);
            $pdo->prepare(
                "INSERT INTO users (username, name, email, password, role, is_active, auth_provider, email_verified)
                 VALUES ('admin', 'Admin', 'admin@neoxweb.com', ?, 'admin', 1, 'email', 1)
                 "
            )->execute([$adminHash]);

            $pdo->exec("UPDATE settings SET setting_value = 'supportneoxweb@gmail.com' WHERE setting_key = 'contact_email'");
            $pdo->exec("UPDATE settings SET setting_value = '+92 314 066 6734' WHERE setting_key = 'contact_phone'");
            $pdo->exec("UPDATE settings SET setting_value = '923140666734' WHERE setting_key = 'whatsapp_number'");

            $success = true;
            $message = 'Database installed. Admin username: <strong>admin</strong>. One-time password: <code>'
                . htmlspecialchars($initialAdminPassword, ENT_QUOTES, 'UTF-8')
                . '</code>. Save it now; it will not be shown again.';
            $status = checkDatabaseStatus($dbName);
            $dbOk = $status['database'];
            $userCount = $status['users'];
            unset($_SESSION['install_csrf_token']);
        } catch (Throwable $e) {
            error_log('[Installer] ' . $e->getMessage());
            $message = 'Installation failed. Check the PHP error log and database configuration.';
        }
    }
} elseif (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET, POST');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Install Database | NEOXWEB</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
    <div class="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 class="text-2xl font-bold mb-2 text-center">NEOXWEB Database Install</h1>
        <p class="text-slate-400 text-sm mb-6 text-center">One-time database setup. Existing user accounts lock this installer.</p>
        <div class="mb-6 p-4 rounded-xl text-sm space-y-2 border <?php echo ($mysqlOk && $dbOk) ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'; ?>">
            <p class="<?php echo $mysqlOk ? 'text-emerald-300' : 'text-red-300'; ?>">
                <?php echo $mysqlOk ? 'âœ“ MySQL running' : 'âœ— MySQL OFF â€” start in XAMPP'; ?>
            </p>
            <p class="<?php echo $dbOk ? 'text-emerald-300' : 'text-amber-300'; ?>">
                <?php echo $dbOk ? "âœ“ Database <code>{$dbName}</code> connected ({$userCount} users)" : 'â—‹ Database not installed yet'; ?>
            </p>
            <p class="text-slate-400 text-xs">Config: <code>backend/.env</code> (copy from .env.example)</p>
        </div>

        <?php if ($message): ?>
            <div class="mb-6 p-4 rounded-xl text-sm <?php echo $success ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'; ?>">
                <?php echo $message; ?>
            </div>
        <?php endif; ?>

        <form method="post">
            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars((string) ($_SESSION['install_csrf_token'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>">
            <?php if ($isProduction): ?>
                <label class="block text-sm text-slate-300 mb-2" for="install-token">Temporary installer token</label>
                <input id="install-token" type="password" name="install_token" autocomplete="off" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 mb-4" required>
            <?php endif; ?>
            <?php $canInstall = $mysqlOk && $installerEnabled && $userCount === 0; ?>
            <button type="submit" <?php echo $canInstall ? '' : 'disabled'; ?>
                class="w-full py-3 rounded-xl font-semibold mb-4 <?php echo $canInstall ? 'bg-gradient-to-r from-violet-600 to-emerald-500' : 'bg-slate-700 text-slate-400 cursor-not-allowed'; ?>">
                <?php echo !$installerEnabled ? 'Installer Disabled' : ($userCount > 0 ? 'Installer Locked' : 'Install Database'); ?>
            </button>
        </form>

        <div class="text-sm text-slate-400 space-y-2 border-t border-slate-800 pt-4">
            <p>First setup displays a generated admin password once. Set <code>INITIAL_ADMIN_PASSWORD</code> in <code>.env</code> to choose your own.</p>
        </div>

        <div class="mt-6 flex flex-col gap-2 text-sm">
            <a href="index.php" class="text-violet-400 hover:underline">â†’ Admin Login</a>
            <a href="api/health.php" class="text-slate-400 hover:underline">â†’ API Health Check</a>
        </div>
    </div>
</body>
</html>
