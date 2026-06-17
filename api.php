<?php
declare(strict_types=1);
error_reporting(0);
ini_set('display_errors', '0');

/* ═══════════════════════════════════════════════════════
   meu4patas — API principal (PHP 8 + SQLite + PDO)
   Endpoint único: api.php?action=...
═══════════════════════════════════════════════════════ */

/* Evita que avisos PHP quebrem o JSON */
set_error_handler(function() { return true; });

/* Inicia sessão apenas se não iniciada */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/* Cabeçalho padrão JSON — sempre */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/* ═══════════════════════════════════════════════════════
   CONEXÃO PDO
═══════════════════════════════════════════════════════ */
function getPDO(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dbPath = __DIR__ . '/banco.db';
    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON;');
    $pdo->exec('PRAGMA journal_mode = WAL;');
    return $pdo;
}

/* ═══════════════════════════════════════════════════════
   INICIALIZAÇÃO DO BANCO
═══════════════════════════════════════════════════════ */
function initDB(): void {
    $pdo = getPDO();

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS usuarios (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_completo         TEXT NOT NULL,
            cpf                   TEXT NOT NULL UNIQUE,
            cpf_limpo             TEXT NOT NULL UNIQUE,
            email                 TEXT NOT NULL UNIQUE,
            telefone              TEXT NOT NULL,
            data_nascimento       TEXT NOT NULL,
            idade                 INTEGER NOT NULL,
            maior21               INTEGER NOT NULL DEFAULT 0,
            cidade                TEXT NOT NULL,
            uf                    TEXT NOT NULL,
            bairro                TEXT NOT NULL DEFAULT '',
            tipo_cadastro         TEXT NOT NULL DEFAULT 'adotar',
            tipo_moradia          TEXT NOT NULL DEFAULT '',
            possui_outros_animais TEXT NOT NULL DEFAULT 'nao',
            ja_adotou_antes       TEXT NOT NULL DEFAULT 'nao',
            senha_hash            TEXT NOT NULL,
            aceita_termos         INTEGER NOT NULL DEFAULT 0,
            criado_em             TEXT DEFAULT CURRENT_TIMESTAMP,
            atualizado_em         TEXT
        )
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS adotantes (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id    INTEGER,
            nome_completo TEXT NOT NULL,
            telefone      TEXT NOT NULL,
            endereco      TEXT,
            cidade        TEXT NOT NULL,
            uf            TEXT NOT NULL,
            bairro        TEXT,
            tipo_moradia  TEXT,
            criado_em     TEXT DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TEXT,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
        )
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS pets (
            id                      INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_pet                TEXT NOT NULL,
            especie                 TEXT NOT NULL,
            raca                    TEXT NOT NULL,
            idade_aproximada        TEXT NOT NULL,
            idade_meses             INTEGER NOT NULL DEFAULT 0,
            sexo                    TEXT NOT NULL,
            cidade                  TEXT NOT NULL,
            uf                      TEXT NOT NULL,
            bairro                  TEXT DEFAULT '',
            status                  TEXT NOT NULL DEFAULT 'Disponível',
            descricao               TEXT NOT NULL,
            temperamento            TEXT DEFAULT '',
            lar_ideal               TEXT DEFAULT '',
            imagem                  TEXT NOT NULL DEFAULT '',
            responsavel_nome        TEXT NOT NULL,
            responsavel_telefone    TEXT NOT NULL,
            responsavel_tipo        TEXT NOT NULL DEFAULT 'Pessoa física',
            tipo_cadastro           TEXT NOT NULL DEFAULT 'Pet individual',
            quantidade              INTEGER DEFAULT 1,
            leishmaniose            TEXT DEFAULT 'Não testado',
            vermifugo               INTEGER DEFAULT 0,
            v8_v10                  INTEGER DEFAULT 0,
            antirrabica             INTEGER DEFAULT 0,
            gripe_canina            INTEGER DEFAULT 0,
            giardia                 INTEGER DEFAULT 0,
            v4_v5                   INTEGER DEFAULT 0,
            felv                    INTEGER DEFAULT 0,
            castrado                INTEGER DEFAULT 0,
            condicao_especial       TEXT DEFAULT '',
            observacoes_veterinarias TEXT DEFAULT '',
            usuario_doador_id       INTEGER,
            adotante_id             INTEGER NULL,
            criado_em               TEXT DEFAULT CURRENT_TIMESTAMP,
            atualizado_em           TEXT,
            FOREIGN KEY(usuario_doador_id) REFERENCES usuarios(id) ON DELETE SET NULL,
            FOREIGN KEY(adotante_id)       REFERENCES adotantes(id) ON DELETE SET NULL
        )
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS interesses (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id  INTEGER NOT NULL,
            pet_id      INTEGER NOT NULL,
            status      TEXT NOT NULL DEFAULT 'Interesse enviado',
            mensagem    TEXT,
            criado_em   TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY(pet_id)     REFERENCES pets(id)     ON DELETE CASCADE,
            UNIQUE(usuario_id, pet_id)
        )
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS recusas (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            pet_id     INTEGER NOT NULL,
            criado_em  TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
            FOREIGN KEY(pet_id)     REFERENCES pets(id)     ON DELETE CASCADE
        )
    ");

    /* Seed de dados de teste */
    seedData($pdo);
}

function seedData(PDO $pdo): void {
    $count = (int) $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();
    if ($count > 0) return;

    /* Usuários */
    $users = [
        ['admin@meu4patas.local',  'Admin meu4patas',  '111.111.111-11', '11111111111', '1990-01-15', 'adotar',  'Casa',       'nao', 'sim', 'Belo Horizonte', 'MG', 'Centro'],
        ['ana@meu4patas.local',    'Ana Silva',         '222.222.222-22', '22222222222', '1995-05-20', 'adotar',  'Apartamento','nao', 'nao', 'Belo Horizonte', 'MG', 'Savassi'],
        ['doador@meu4patas.local', 'Carlos Doador',     '333.333.333-33', '33333333333', '1988-08-10', 'doar',    'Casa',       'sim', 'sim', 'Contagem',       'MG', 'Eldorado'],
    ];
    $senha = password_hash('123456', PASSWORD_DEFAULT);
    $stmtU = $pdo->prepare("
        INSERT OR IGNORE INTO usuarios
            (nome_completo, cpf, cpf_limpo, email, telefone, data_nascimento, idade, maior21,
             cidade, uf, bairro, tipo_cadastro, tipo_moradia, possui_outros_animais, ja_adotou_antes,
             senha_hash, aceita_termos)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
    ");
    foreach ($users as $u) {
        $idade  = calcularIdade($u[5]);
        $stmtU->execute([$u[1],$u[2],$u[3],$u[0],'(31)99999-0000',$u[5],$idade,($idade>=21?1:0),
                         $u[9],$u[10],$u[11],$u[6],$u[7],$u[8],$u[9],$senha]);
    }

    /* Adotantes */
    $adminId = (int) $pdo->query("SELECT id FROM usuarios WHERE email='admin@meu4patas.local'")->fetchColumn();
    $anaId   = (int) $pdo->query("SELECT id FROM usuarios WHERE email='ana@meu4patas.local'")->fetchColumn();

    $stmtA = $pdo->prepare("
        INSERT OR IGNORE INTO adotantes (usuario_id, nome_completo, telefone, cidade, uf, bairro, tipo_moradia)
        VALUES (?,?,?,?,?,?,?)
    ");
    $stmtA->execute([$anaId,   'Ana Silva',     '(31)99999-1111', 'Belo Horizonte','MG','Savassi','Apartamento']);
    $stmtA->execute([$adminId, 'Arthur Santos', '(31)99999-2222', 'Belo Horizonte','MG','Centro', 'Casa']);

    $anaAdotanteId = (int) $pdo->query("SELECT id FROM adotantes WHERE usuario_id=$anaId")->fetchColumn();

    /* Pets */
    $doadorId = (int) $pdo->query("SELECT id FROM usuarios WHERE email='doador@meu4patas.local'")->fetchColumn();
    $pets = [
        ['Luna',    'Cão',  'Sem raça definida (SRD)', '2 anos',      24, 'Fêmea', 'Belo Horizonte','MG','Santa Efigênia','Disponível',   'assets/luna-hero.png', $doadorId, null,         'ONG meu4patas',   '(31)99999-9999','ONG','Negativo',1,1,1,0,0,0,0,1,'','Sem observações.',           'Dócil,Brincalhona,Sociável',       'Casa com quintal,Família paciente'],
        ['Thor',    'Cão',  'Pastor Alemão',           '1 ano',       12, 'Macho', 'Belo Horizonte','MG','Savassi',       'Disponível',   'assets/pet-thor.jpg',  $doadorId, null,         'Abrigo Recomeço', '(31)98888-7777','ONG','Negativo',1,1,1,1,0,0,0,0,'','Castração agendada.',        'Energético,Leal,Carinhoso',        'Espaço amplo,Família ativa'],
        ['Mel',     'Gato', 'Sem raça definida (SRD)', '8 meses',      8, 'Fêmea', 'Belo Horizonte','MG','Funcionários',  'Disponível',   'assets/pet-mel.jpg',   $doadorId, null,         'Gatil Solidário', '(31)96666-5555','ONG','Não testado',1,0,1,0,0,1,1,0,'','FeLV negativo.',             'Dócil,Curiosa,Tranquila',          'Apartamento com tela,Ambiente calmo'],
        ['Nina',    'Gato', 'Siamês',                  '1 ano e 6 meses',18,'Fêmea','São Paulo',    'SP','Pinheiros',     'Indisponível', 'assets/pet-nina.jpg',  $doadorId, null,         'ONG Gatil SP',    '(11)95555-4444','ONG','Não testado',1,0,1,0,0,1,1,1,'','Em tratamento.',             'Independente,Afetuosa',            'Lar com janelas teladas'],
        ['Bolinha', 'Cão',  'Sem raça definida (SRD)', '3 anos',      36, 'Macho', 'Belo Horizonte','MG','Pampulha',      'Adotado',      'assets/luna-hero.png', $doadorId, $anaAdotanteId,'ONG meu4patas', '(31)99999-9999','ONG','Negativo',1,1,1,0,0,0,0,1,'','Adotado com sucesso.',       'Dócil,Sociável',                   'Família responsável'],
    ];

    $stmtP = $pdo->prepare("
        INSERT OR IGNORE INTO pets
            (nome_pet,especie,raca,idade_aproximada,idade_meses,sexo,cidade,uf,bairro,
             status,imagem,usuario_doador_id,adotante_id,responsavel_nome,responsavel_telefone,
             responsavel_tipo,leishmaniose,vermifugo,v8_v10,antirrabica,gripe_canina,giardia,
             v4_v5,felv,castrado,condicao_especial,observacoes_veterinarias,temperamento,lar_ideal)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ");
    foreach ($pets as $p) {
        $stmtP->execute($p);
    }
}

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function ok(mixed $data = null, string $msg = 'Operação realizada com sucesso'): void {
    echo json_encode(['success'=>true,'message'=>$msg,'data'=>$data], JSON_UNESCAPED_UNICODE);
    exit;
}

function err(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success'=>false,'message'=>$msg,'data'=>null], JSON_UNESCAPED_UNICODE);
    exit;
}

function sessaoAtiva(): array {
    if (empty($_SESSION['usuario_id'])) {
        err('Você precisa estar logado para realizar esta ação.', 401);
    }
    return ['id' => (int)$_SESSION['usuario_id'], 'nome' => $_SESSION['usuario_nome'] ?? ''];
}

function calcularIdade(string $dataNasc): int {
    try {
        $nasc  = new DateTime($dataNasc);
        $hoje  = new DateTime();
        return (int) $nasc->diff($hoje)->y;
    } catch (Exception $e) {
        return 0;
    }
}

function validarCPF(string $cpf): bool {
    $cpf = preg_replace('/\D/', '', $cpf);
    if (strlen($cpf) !== 11) return false;
    if (preg_match('/^(\d)\1{10}$/', $cpf)) return false;

    $soma = 0;
    for ($i = 0; $i < 9; $i++) $soma += (int)$cpf[$i] * (10 - $i);
    $r = $soma % 11;
    $d1 = $r < 2 ? 0 : 11 - $r;
    if ((int)$cpf[9] !== $d1) return false;

    $soma = 0;
    for ($i = 0; $i < 10; $i++) $soma += (int)$cpf[$i] * (11 - $i);
    $r = $soma % 11;
    $d2 = $r < 2 ? 0 : 11 - $r;
    return (int)$cpf[10] === $d2;
}

function sanitize(string $v): string {
    return trim(strip_tags($v));
}

function input(string $key, mixed $default = ''): mixed {
    /* Suporte a JSON body e form-data */
    static $json = null;
    if ($json === null) {
        $raw = file_get_contents('php://input');
        $json = json_decode($raw ?: '{}', true) ?? [];
    }
    if (isset($json[$key])) return $json[$key];
    if (isset($_POST[$key])) return $_POST[$key];
    if (isset($_GET[$key]))  return $_GET[$key];
    return $default;
}

/* ═══════════════════════════════════════════════════════
   ROTEADOR — só executa quando chamado diretamente
═══════════════════════════════════════════════════════ */
if (basename(__FILE__) !== basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    /* Arquivo incluído por index.php — só roda initDB() */
    return;
}

initDB();

$action = sanitize((string)($_GET['action'] ?? $_POST['action'] ?? input('action')));

try {
    switch ($action) {

        /* ─── HEALTH ─── */
        case 'health':
            ok(['status'=>'ok','version'=>'1.0','banco'=>file_exists(__DIR__.'/banco.db')],
               'API meu4patas funcionando.');

        /* ─── SESSÃO ─── */
        case 'sessao':
            if (!empty($_SESSION['usuario_id'])) {
                $u = getPDO()->prepare("SELECT id,nome_completo,cpf,email,telefone,data_nascimento,idade,maior21,cidade,uf,bairro,tipo_cadastro,tipo_moradia,possui_outros_animais,ja_adotou_antes,aceita_termos FROM usuarios WHERE id=?");
                $u->execute([(int)$_SESSION['usuario_id']]);
                $row = $u->fetch();
                ok($row ?: null, $row ? 'Sessão ativa.' : 'Sessão expirada.');
            }
            ok(null, 'Não autenticado.');

        /* ─── REGISTRAR USUÁRIO ─── */
        case 'registrar_usuario': {
            $nome        = sanitize((string)input('nome'));
            $cpf         = sanitize((string)input('cpf'));
            $email       = strtolower(sanitize((string)input('email')));
            $tel         = sanitize((string)input('telefone'));
            $nascimento  = sanitize((string)input('data_nascimento'));
            $senha       = (string)input('senha');
            $tipo        = sanitize((string)input('tipo_cadastro', 'adotar'));
            $moradia     = sanitize((string)input('tipo_moradia', ''));
            $animais     = sanitize((string)input('possui_outros_animais', 'nao'));
            $adotou      = sanitize((string)input('ja_adotou_antes', 'nao'));
            $cidade      = sanitize((string)input('cidade', ''));
            $uf          = sanitize((string)input('uf', ''));
            $bairro      = sanitize((string)input('bairro', ''));
            $termos      = (int)(bool)input('aceita_termos');

            if (!$nome || !$email || !$senha || !$nascimento)
                err('Preencha todos os campos obrigatórios.');
            if (!filter_var($email, FILTER_VALIDATE_EMAIL))
                err('E-mail inválido.');
            if (strlen($senha) < 6)
                err('A senha deve ter no mínimo 6 caracteres.');
            if (!$termos)
                err('Você deve aceitar os termos de uso.');

            $cpfLimpo = preg_replace('/\D/', '', $cpf);
            if ($cpf && !validarCPF($cpf))
                err('CPF inválido.');

            $idade   = calcularIdade($nascimento);
            $maior21 = $idade >= 21 ? 1 : 0;
            $hash    = password_hash($senha, PASSWORD_DEFAULT);

            $pdo = getPDO();
            /* Verificar e-mail duplicado */
            $ck = $pdo->prepare("SELECT id FROM usuarios WHERE email=?");
            $ck->execute([$email]);
            if ($ck->fetch()) err('Este e-mail já está cadastrado.');

            $stmt = $pdo->prepare("
                INSERT INTO usuarios
                    (nome_completo,cpf,cpf_limpo,email,telefone,data_nascimento,idade,maior21,
                     cidade,uf,bairro,tipo_cadastro,tipo_moradia,possui_outros_animais,ja_adotou_antes,
                     senha_hash,aceita_termos)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ");
            $stmt->execute([$nome,$cpf,$cpfLimpo,$email,$tel,$nascimento,$idade,$maior21,
                            $cidade,$uf,$bairro,$tipo,$moradia,$animais,$adotou,$hash,$termos]);

            $id = (int)$pdo->lastInsertId();
            $_SESSION['usuario_id']   = $id;
            $_SESSION['usuario_nome'] = $nome;
            ok(['id'=>$id,'nome_completo'=>$nome,'email'=>$email,'maior21'=>$maior21], 'Cadastro realizado com sucesso!');
        }

        /* ─── LOGIN ─── */
        case 'login': {
            $email = strtolower(sanitize((string)input('email')));
            $senha = (string)input('senha');
            if (!$email || !$senha) err('Informe e-mail e senha.');

            $stmt = getPDO()->prepare("SELECT * FROM usuarios WHERE email=?");
            $stmt->execute([$email]);
            $u = $stmt->fetch();

            if (!$u || !password_verify($senha, $u['senha_hash']))
                err('E-mail ou senha incorretos.');

            $_SESSION['usuario_id']   = $u['id'];
            $_SESSION['usuario_nome'] = $u['nome_completo'];
            unset($u['senha_hash']);
            ok($u, 'Login realizado com sucesso!');
        }

        /* ─── LOGOUT ─── */
        case 'logout':
            $_SESSION = [];
            session_destroy();
            ok(null, 'Logout realizado.');

        /* ─── ATUALIZAR USUÁRIO ─── */
        case 'atualizar_usuario': {
            $s = sessaoAtiva();
            $pdo = getPDO();

            $nome    = sanitize((string)input('nome'));
            $tel     = sanitize((string)input('telefone', ''));
            $cidade  = sanitize((string)input('cidade', ''));
            $uf      = sanitize((string)input('uf', ''));
            $bairro  = sanitize((string)input('bairro', ''));
            $moradia = sanitize((string)input('tipo_moradia', ''));
            $animais = sanitize((string)input('possui_outros_animais', 'nao'));
            $adotou  = sanitize((string)input('ja_adotou_antes', 'nao'));

            if (!$nome) err('Nome é obrigatório.');

            $stmt = $pdo->prepare("
                UPDATE usuarios SET nome_completo=?,telefone=?,cidade=?,uf=?,bairro=?,
                    tipo_moradia=?,possui_outros_animais=?,ja_adotou_antes=?,atualizado_em=CURRENT_TIMESTAMP
                WHERE id=?
            ");
            $stmt->execute([$nome,$tel,$cidade,$uf,$bairro,$moradia,$animais,$adotou,$s['id']]);
            $_SESSION['usuario_nome'] = $nome;

            /* Verificar nova senha */
            $novaSenha = (string)input('nova_senha', '');
            if ($novaSenha) {
                if (strlen($novaSenha) < 6) err('Nova senha deve ter ao menos 6 caracteres.');
                $hash = password_hash($novaSenha, PASSWORD_DEFAULT);
                $pdo->prepare("UPDATE usuarios SET senha_hash=? WHERE id=?")->execute([$hash,$s['id']]);
            }

            $u = $pdo->prepare("SELECT id,nome_completo,email,tipo_cadastro,maior21,cidade,uf,bairro,telefone FROM usuarios WHERE id=?");
            $u->execute([$s['id']]);
            ok($u->fetch(), 'Dados atualizados com sucesso.');
        }

        /* ─── LISTAR ADOTANTES ─── */
        case 'listar_adotantes': {
            $rows = getPDO()->query("SELECT a.*,u.email FROM adotantes a LEFT JOIN usuarios u ON u.id=a.usuario_id ORDER BY a.nome_completo")->fetchAll();
            ok($rows);
        }

        /* ─── CRIAR ADOTANTE ─── */
        case 'criar_adotante': {
            sessaoAtiva();
            $nome    = sanitize((string)input('nome_completo'));
            $tel     = sanitize((string)input('telefone'));
            $cidade  = sanitize((string)input('cidade'));
            $uf      = sanitize((string)input('uf'));
            $bairro  = sanitize((string)input('bairro', ''));
            $moradia = sanitize((string)input('tipo_moradia', ''));
            $uid     = (int)input('usuario_id', 0) ?: null;
            if (!$nome || !$cidade || !$uf) err('Preencha nome, cidade e UF.');

            $stmt = getPDO()->prepare("INSERT INTO adotantes (usuario_id,nome_completo,telefone,cidade,uf,bairro,tipo_moradia) VALUES (?,?,?,?,?,?,?)");
            $stmt->execute([$uid,$nome,$tel,$cidade,$uf,$bairro,$moradia]);
            ok(['id'=>(int)getPDO()->lastInsertId()], 'Adotante criado.');
        }

        /* ─── ATUALIZAR ADOTANTE ─── */
        case 'atualizar_adotante': {
            sessaoAtiva();
            $id      = (int)input('id');
            $nome    = sanitize((string)input('nome_completo'));
            $tel     = sanitize((string)input('telefone', ''));
            $cidade  = sanitize((string)input('cidade', ''));
            $uf      = sanitize((string)input('uf', ''));
            $bairro  = sanitize((string)input('bairro', ''));
            $moradia = sanitize((string)input('tipo_moradia', ''));
            if (!$id || !$nome) err('Dados inválidos.');

            getPDO()->prepare("UPDATE adotantes SET nome_completo=?,telefone=?,cidade=?,uf=?,bairro=?,tipo_moradia=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?")
                     ->execute([$nome,$tel,$cidade,$uf,$bairro,$moradia,$id]);
            ok(null, 'Adotante atualizado.');
        }

        /* ─── EXCLUIR ADOTANTE ─── */
        case 'excluir_adotante': {
            sessaoAtiva();
            $id = (int)input('id');
            if (!$id) err('ID inválido.');
            getPDO()->prepare("UPDATE pets SET adotante_id=NULL WHERE adotante_id=?")->execute([$id]);
            getPDO()->prepare("DELETE FROM adotantes WHERE id=?")->execute([$id]);
            ok(null, 'Adotante removido.');
        }

        /* ─── LISTAR PETS ─── */
        case 'listar_pets': {
            $sql = "
                SELECT p.*,
                       a.nome_completo AS adotante_nome,
                       u.nome_completo AS doador_nome
                FROM pets p
                LEFT JOIN adotantes a ON a.id = p.adotante_id
                LEFT JOIN usuarios  u ON u.id = p.usuario_doador_id
                ORDER BY p.criado_em DESC
            ";
            $rows = getPDO()->query($sql)->fetchAll();
            /* Formata campos JSON-like */
            foreach ($rows as &$r) {
                $r['temperamento_arr'] = array_filter(array_map('trim', explode(',', $r['temperamento'] ?? '')));
                $r['lar_ideal_arr']    = array_filter(array_map('trim', explode(',', $r['lar_ideal'] ?? '')));
            }
            ok($rows);
        }

        /* ─── LISTAR PETS DISPONÍVEIS ─── */
        case 'listar_pets_disponiveis': {
            $rows = getPDO()->query("SELECT * FROM pets WHERE status='Disponível' ORDER BY criado_em DESC")->fetchAll();
            ok($rows);
        }

        /* ─── LISTAR PETS ADOTADOS ─── */
        case 'listar_pets_adotados': {
            $rows = getPDO()->query("SELECT p.*,a.nome_completo AS adotante_nome FROM pets p LEFT JOIN adotantes a ON a.id=p.adotante_id WHERE p.status='Adotado'")->fetchAll();
            ok($rows);
        }

        /* ─── OBTER PET ─── */
        case 'obter_pet': {
            $id = (int)($_GET['id'] ?? input('id'));
            if (!$id) err('ID inválido.');
            $stmt = getPDO()->prepare("SELECT p.*,a.nome_completo AS adotante_nome FROM pets p LEFT JOIN adotantes a ON a.id=p.adotante_id WHERE p.id=?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) err('Pet não encontrado.', 404);
            ok($row);
        }

        /* ─── CRIAR PET ─── */
        case 'criar_pet': {
            $s = sessaoAtiva();
            $pdo = getPDO();

            $nome    = sanitize((string)input('nome_pet'));
            $especie = sanitize((string)input('especie'));
            $raca    = sanitize((string)input('raca', 'Sem raça definida (SRD)'));
            $idadeAp = sanitize((string)input('idade_aproximada', ''));
            $idadeMeses = (int)input('idade_meses', 0);
            $sexo    = sanitize((string)input('sexo', ''));
            $cidade  = sanitize((string)input('cidade', ''));
            $uf      = sanitize((string)input('uf', ''));
            $bairro  = sanitize((string)input('bairro', ''));
            $status  = sanitize((string)input('status', 'Disponível'));
            $descricao = sanitize((string)input('descricao', ''));
            $temp    = sanitize((string)input('temperamento', ''));
            $lar     = sanitize((string)input('lar_ideal', ''));
            $resNome = sanitize((string)input('responsavel_nome', ''));
            $resTel  = sanitize((string)input('responsavel_telefone', ''));
            $resTipo = sanitize((string)input('responsavel_tipo', 'Pessoa física'));
            $tipoCad = sanitize((string)input('tipo_cadastro', 'Pet individual'));
            $qtd     = (int)input('quantidade', 1);

            $lish   = sanitize((string)input('leishmaniose', 'Não testado'));
            $verm   = (int)(bool)input('vermifugo');
            $v8     = (int)(bool)input('v8_v10');
            $anti   = (int)(bool)input('antirrabica');
            $grip   = (int)(bool)input('gripe_canina');
            $giar   = (int)(bool)input('giardia');
            $v4     = (int)(bool)input('v4_v5');
            $felv   = (int)(bool)input('felv');
            $cast   = (int)(bool)input('castrado');
            $cond   = sanitize((string)input('condicao_especial', ''));
            $obs    = sanitize((string)input('observacoes_veterinarias', ''));

            if (!$nome || !$especie) err('Nome e espécie são obrigatórios.');
            /* Impedir usuário comum de cadastrar como Adotado */
            if ($status === 'Adotado') $status = 'Disponível';

            /* Upload de imagem */
            $imagem = '';
            if (!empty($_FILES['imagem']['tmp_name'])) {
                $allowed = ['jpg','jpeg','png','webp'];
                $ext = strtolower(pathinfo($_FILES['imagem']['name'], PATHINFO_EXTENSION));
                if (!in_array($ext, $allowed)) err('Formato de imagem inválido. Use jpg, jpeg, png ou webp.');
                if ($_FILES['imagem']['size'] > 5 * 1024 * 1024) err('Imagem muito grande. Máximo 5MB.');

                $uploadsDir = __DIR__ . '/uploads';
                if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);

                $filename = 'pet_' . uniqid() . '.' . $ext;
                $dest = $uploadsDir . '/' . $filename;
                if (!move_uploaded_file($_FILES['imagem']['tmp_name'], $dest))
                    err('Erro ao salvar imagem.');
                $imagem = 'uploads/' . $filename;
            } else {
                /* Imagem padrão por espécie */
                $imagem = $especie === 'Gato' ? 'assets/pet-mel.jpg' : 'assets/luna-hero.png';
            }

            $stmt = $pdo->prepare("
                INSERT INTO pets
                    (nome_pet,especie,raca,idade_aproximada,idade_meses,sexo,cidade,uf,bairro,
                     status,descricao,temperamento,lar_ideal,imagem,
                     responsavel_nome,responsavel_telefone,responsavel_tipo,tipo_cadastro,quantidade,
                     leishmaniose,vermifugo,v8_v10,antirrabica,gripe_canina,giardia,v4_v5,felv,castrado,
                     condicao_especial,observacoes_veterinarias,usuario_doador_id)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ");
            $stmt->execute([$nome,$especie,$raca,$idadeAp,$idadeMeses,$sexo,$cidade,$uf,$bairro,
                            $status,$descricao,$temp,$lar,$imagem,
                            $resNome,$resTel,$resTipo,$tipoCad,$qtd,
                            $lish,$verm,$v8,$anti,$grip,$giar,$v4,$felv,$cast,
                            $cond,$obs,$s['id']]);
            ok(['id'=>(int)$pdo->lastInsertId(),'imagem'=>$imagem], 'Pet cadastrado com sucesso!');
        }

        /* ─── ATUALIZAR PET ─── */
        case 'atualizar_pet': {
            $s = sessaoAtiva();
            $pdo = getPDO();
            $id = (int)input('id');
            if (!$id) err('ID inválido.');

            $pet = $pdo->prepare("SELECT * FROM pets WHERE id=?");
            $pet->execute([$id]);
            $existing = $pet->fetch();
            if (!$existing) err('Pet não encontrado.', 404);

            $nome    = sanitize((string)input('nome_pet', $existing['nome_pet']));
            $especie = sanitize((string)input('especie', $existing['especie']));
            $raca    = sanitize((string)input('raca', $existing['raca']));
            $idadeAp = sanitize((string)input('idade_aproximada', $existing['idade_aproximada']));
            $idadeMeses = (int)input('idade_meses', $existing['idade_meses']);
            $sexo    = sanitize((string)input('sexo', $existing['sexo']));
            $cidade  = sanitize((string)input('cidade', $existing['cidade']));
            $uf      = sanitize((string)input('uf', $existing['uf']));
            $bairro  = sanitize((string)input('bairro', $existing['bairro']));
            $status  = sanitize((string)input('status', $existing['status']));
            $descricao = sanitize((string)input('descricao', $existing['descricao']));
            $temp    = sanitize((string)input('temperamento', $existing['temperamento']));
            $lar     = sanitize((string)input('lar_ideal', $existing['lar_ideal']));
            $resNome = sanitize((string)input('responsavel_nome', $existing['responsavel_nome']));
            $resTel  = sanitize((string)input('responsavel_telefone', $existing['responsavel_telefone']));
            $resTipo = sanitize((string)input('responsavel_tipo', $existing['responsavel_tipo']));
            $lish    = sanitize((string)input('leishmaniose', $existing['leishmaniose']));
            $verm    = (int)(bool)input('vermifugo',   $existing['vermifugo']);
            $v8      = (int)(bool)input('v8_v10',      $existing['v8_v10']);
            $anti    = (int)(bool)input('antirrabica', $existing['antirrabica']);
            $cond    = sanitize((string)input('condicao_especial', $existing['condicao_especial']));
            $obs     = sanitize((string)input('observacoes_veterinarias', $existing['observacoes_veterinarias']));
            $cast    = (int)(bool)input('castrado', $existing['castrado']);

            $imagem = $existing['imagem'];
            if (!empty($_FILES['imagem']['tmp_name'])) {
                $allowed = ['jpg','jpeg','png','webp'];
                $ext = strtolower(pathinfo($_FILES['imagem']['name'], PATHINFO_EXTENSION));
                if (in_array($ext, $allowed)) {
                    $filename = 'pet_' . uniqid() . '.' . $ext;
                    $dest = __DIR__ . '/uploads/' . $filename;
                    if (move_uploaded_file($_FILES['imagem']['tmp_name'], $dest))
                        $imagem = 'uploads/' . $filename;
                }
            }

            $pdo->prepare("
                UPDATE pets SET nome_pet=?,especie=?,raca=?,idade_aproximada=?,idade_meses=?,
                    sexo=?,cidade=?,uf=?,bairro=?,status=?,descricao=?,temperamento=?,lar_ideal=?,
                    imagem=?,responsavel_nome=?,responsavel_telefone=?,responsavel_tipo=?,
                    leishmaniose=?,vermifugo=?,v8_v10=?,antirrabica=?,castrado=?,
                    condicao_especial=?,observacoes_veterinarias=?,atualizado_em=CURRENT_TIMESTAMP
                WHERE id=?
            ")->execute([$nome,$especie,$raca,$idadeAp,$idadeMeses,$sexo,$cidade,$uf,$bairro,
                         $status,$descricao,$temp,$lar,$imagem,$resNome,$resTel,$resTipo,
                         $lish,$verm,$v8,$anti,$cast,$cond,$obs,$id]);
            ok(['id'=>$id], 'Pet atualizado.');
        }

        /* ─── EXCLUIR PET ─── */
        case 'excluir_pet': {
            $s = sessaoAtiva();
            $id = (int)input('id');
            if (!$id) err('ID inválido.');
            $pdo = getPDO();
            $pdo->prepare("DELETE FROM interesses WHERE pet_id=?")->execute([$id]);
            $pdo->prepare("DELETE FROM recusas    WHERE pet_id=?")->execute([$id]);
            $pdo->prepare("DELETE FROM pets        WHERE id=?")->execute([$id]);
            ok(null, 'Pet removido.');
        }

        /* ─── REGISTRAR INTERESSE ─── */
        case 'registrar_interesse': {
            $s = sessaoAtiva();
            $pdo = getPDO();
            $petId = (int)input('pet_id');
            $msg   = sanitize((string)input('mensagem', ''));
            if (!$petId) err('Pet inválido.');

            /* Verificar idade */
            $usr = $pdo->prepare("SELECT maior21 FROM usuarios WHERE id=?");
            $usr->execute([$s['id']]);
            $u = $usr->fetch();
            if (!$u || !$u['maior21'])
                err('Para demonstrar interesse em adoção, é necessário ter 21 anos ou mais.');

            /* Verificar pet disponível */
            $p = $pdo->prepare("SELECT status FROM pets WHERE id=?");
            $p->execute([$petId]);
            $pet = $p->fetch();
            if (!$pet) err('Pet não encontrado.', 404);
            if ($pet['status'] !== 'Disponível') err('Este pet não está disponível para adoção.');

            /* Inserir interesse (não altera status do pet) */
            $stmt = $pdo->prepare("INSERT OR IGNORE INTO interesses (usuario_id,pet_id,mensagem) VALUES (?,?,?)");
            $stmt->execute([$s['id'], $petId, $msg]);
            ok(null, 'Interesse registrado com sucesso!');
        }

        /* ─── MEUS INTERESSES ─── */
        case 'meus_interesses': {
            $s = sessaoAtiva();
            $stmt = getPDO()->prepare("
                SELECT i.*,p.nome_pet,p.especie,p.raca,p.imagem,p.status AS pet_status,
                       p.cidade,p.uf,p.responsavel_nome,p.responsavel_telefone
                FROM interesses i
                JOIN pets p ON p.id=i.pet_id
                WHERE i.usuario_id=?
                ORDER BY i.criado_em DESC
            ");
            $stmt->execute([$s['id']]);
            ok($stmt->fetchAll());
        }

        /* ─── REMOVER INTERESSE ─── */
        case 'remover_interesse': {
            $s = sessaoAtiva();
            $petId = (int)input('pet_id');
            if (!$petId) err('Pet inválido.');
            getPDO()->prepare("DELETE FROM interesses WHERE usuario_id=? AND pet_id=?")->execute([$s['id'], $petId]);
            ok(null, 'Interesse removido.');
        }

        /* ─── REGISTRAR RECUSA ─── */
        case 'registrar_recusa': {
            $s = sessaoAtiva();
            $petId = (int)input('pet_id');
            if (!$petId) err('Pet inválido.');
            $pdo = getPDO();
            $pdo->prepare("DELETE FROM interesses WHERE usuario_id=? AND pet_id=?")->execute([$s['id'], $petId]);
            $pdo->prepare("INSERT OR IGNORE INTO recusas (usuario_id,pet_id) VALUES (?,?)")->execute([$s['id'], $petId]);
            ok(null, 'Recusa registrada.');
        }

        /* ─── MINHAS RECUSAS ─── */
        case 'minhas_recusas': {
            $s = sessaoAtiva();
            $stmt = getPDO()->prepare("
                SELECT r.*,p.nome_pet,p.especie,p.imagem FROM recusas r
                JOIN pets p ON p.id=r.pet_id
                WHERE r.usuario_id=? ORDER BY r.criado_em DESC
            ");
            $stmt->execute([$s['id']]);
            ok($stmt->fetchAll());
        }

        /* ─── REMOVER RECUSA ─── */
        case 'remover_recusa': {
            $s = sessaoAtiva();
            $petId = (int)input('pet_id');
            getPDO()->prepare("DELETE FROM recusas WHERE usuario_id=? AND pet_id=?")->execute([$s['id'], $petId]);
            ok(null, 'Recusa removida.');
        }

        /* ─── MEUS PETS ─── */
        case 'meus_pets': {
            $s = sessaoAtiva();
            $pdo = getPDO();

            $stmt = $pdo->prepare("
                SELECT p.*,a.nome_completo AS adotante_nome
                FROM pets p
                LEFT JOIN adotantes a ON a.id=p.adotante_id
                WHERE p.usuario_doador_id=?
                ORDER BY p.criado_em DESC
            ");
            $stmt->execute([$s['id']]);
            $pets = $stmt->fetchAll();

            /* Para cada pet, buscar interessados */
            foreach ($pets as &$pet) {
                $si = $pdo->prepare("
                    SELECT i.*,u.nome_completo,u.email,u.telefone
                    FROM interesses i
                    JOIN usuarios u ON u.id=i.usuario_id
                    WHERE i.pet_id=?
                ");
                $si->execute([$pet['id']]);
                $pet['interessados'] = $si->fetchAll();
            }
            ok($pets);
        }

        /* ─── PAINEL DE ADOÇÃO ─── */
        case 'painel_adocao': {
            sessaoAtiva();
            $rows = getPDO()->query("
                SELECT p.*,a.nome_completo AS adotante_nome,
                       (SELECT COUNT(*) FROM interesses WHERE pet_id=p.id) AS total_interesses
                FROM pets p
                LEFT JOIN adotantes a ON a.id=p.adotante_id
                ORDER BY p.status,p.nome_pet
            ")->fetchAll();
            ok($rows);
        }

        /* ─── CONFIRMAR ADOÇÃO ─── */
        case 'confirmar_adocao': {
            sessaoAtiva();
            $petId      = (int)input('pet_id');
            $adotanteId = (int)input('adotante_id');
            if (!$petId || !$adotanteId) err('Informe pet e adotante.');

            /* Verificar se adotante existe */
            $a = getPDO()->prepare("SELECT id FROM adotantes WHERE id=?");
            $a->execute([$adotanteId]);
            if (!$a->fetch()) err('Adotante não encontrado.');

            getPDO()->prepare("UPDATE pets SET status='Adotado',adotante_id=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?")
                     ->execute([$adotanteId, $petId]);
            ok(null, 'Adoção confirmada com sucesso!');
        }

        /* ─── DESFAZER ADOÇÃO ─── */
        case 'desfazer_adocao': {
            sessaoAtiva();
            $petId = (int)input('pet_id');
            if (!$petId) err('ID do pet inválido.');
            getPDO()->prepare("UPDATE pets SET status='Disponível',adotante_id=NULL,atualizado_em=CURRENT_TIMESTAMP WHERE id=?")
                     ->execute([$petId]);
            ok(null, 'Adoção desfeita. Pet disponível novamente.');
        }

        /* ─── DEFAULT ─── */
        default:
            err("Ação '$action' não encontrada.", 404);
    }
} catch (PDOException $e) {
    err('Erro no banco de dados: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
    err('Erro interno: ' . $e->getMessage(), 500);
}
