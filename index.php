<?php
declare(strict_types=1);
error_reporting(0);
ini_set('display_errors', '0');

/* ── Garante que uploads/ existe ── */
$uploadsDir = __DIR__ . '/uploads';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

/* ── Inicializa o banco de dados ── */
require_once __DIR__ . '/api.php';
initDB();

/* ── Serve index.html ── */
$file = __DIR__ . '/index.html';
if (file_exists($file)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($file);
} else {
    http_response_code(404);
    echo 'index.html não encontrado.';
}
