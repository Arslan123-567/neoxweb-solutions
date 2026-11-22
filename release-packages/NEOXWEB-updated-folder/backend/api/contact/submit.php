<?php
/*
    FILE: api/contact/submit.php
    PURPOSE: Submit contact message from frontend
*/

require_once __DIR__ . '/../../includes/bootstrap.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/request.php';

requireMethod('POST');

$data = getJsonInput();
foreach (['name', 'email', 'phone', 'message'] as $field) {
    if (isset($data[$field]) && !is_string($data[$field])) {
        sendError('Invalid request data', 422);
    }
}

$name = sanitizeInput($data['name'] ?? '');
$email = sanitizeInput($data['email'] ?? '');
$phone = sanitizeInput($data['phone'] ?? '');
$message = sanitizeInput($data['message'] ?? '');

if (empty($name) || empty($email) || empty($message)) {
    sendError('Name, email, and message are required');
}

if (!validateEmail($email)) {
    sendError('Invalid email format');
}
if (strlen($name) > 120 || strlen($email) > 254 || strlen($phone) > 40 || strlen($message) < 10 || strlen($message) > 10000) {
    sendError('Please check the length of your contact details and message', 422);
}

$db = db();

$stmt = $db->prepare("INSERT INTO messages (name, email, phone, message, created_at) VALUES (?, ?, ?, ?, NOW())");

if ($stmt->execute([$name, $email, $phone, $message])) {
    sendSuccess('Message sent successfully');
} else {
    sendError('Failed to send message', 500);
}
?>
