<?php
/* ─────────────────────────────────────────
   Router para PHP built-in server
   php -S 0.0.0.0:5000 router.php
───────────────────────────────────────── */
$uri  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$file = __DIR__ . $uri;

/* Servir arquivos estáticos existentes */
if ($uri !== '/' && is_file($file)) {
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if ($ext !== 'php') {
        return false; /* PHP built-in server serve o arquivo diretamente */
    }
    /* Arquivo PHP — executar */
    require $file;
    exit;
}

/* api.php via qualquer rota /api.php */
if ($uri === '/api.php') {
    require __DIR__ . '/api.php';
    exit;
}

/* Qualquer outra rota → index.php (que serve index.html) */
require __DIR__ . '/index.php';
