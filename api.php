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

    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_pets_demo_lookup ON pets (nome_pet, imagem)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_interesses_pet ON interesses (pet_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_recusas_pet ON recusas (pet_id)");

    /* Seed de dados de teste */
    seedData($pdo);
}

function seedData(PDO $pdo): void {
    $pets = demoPets();
    if (!needsDemoSeed($pdo, $pets)) return;

    $pdo->beginTransaction();
    try {
        $usuarios = seedDemoUsers($pdo);
        $adotantes = seedDemoAdotantes($pdo, $usuarios);
        seedDemoPets($pdo, $usuarios, $adotantes, $pets);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

function needsDemoSeed(PDO $pdo, array $pets): bool {
    $usuariosOk = (int) $pdo->query("
        SELECT COUNT(*)
        FROM usuarios
        WHERE email IN ('admin@meu4patas.local','ana@meu4patas.local','doador@meu4patas.local')
          AND data_nascimento LIKE '____-__-__'
          AND maior21 = 1
    ")->fetchColumn() >= 3;

    $adotantesOk = (int) $pdo->query("
        SELECT COUNT(*)
        FROM adotantes
        WHERE nome_completo IN ('Ana Silva','Arthur Santos')
    ")->fetchColumn() >= 2;

    if (!$usuariosOk || !$adotantesOk) return true;

    $findPet = $pdo->prepare("SELECT COUNT(*) FROM pets WHERE nome_pet=? AND imagem=?");
    foreach ($pets as $pet) {
        $findPet->execute([$pet['nome_pet'], $pet['imagem']]);
        if ((int) $findPet->fetchColumn() === 0) return true;
    }

    return false;
}

function seedDemoUsers(PDO $pdo): array {
    $users = [
        'admin' => [
            'email' => 'admin@meu4patas.local',
            'nome_completo' => 'Admin meu4patas',
            'cpf' => '111.111.111-11',
            'cpf_limpo' => '11111111111',
            'telefone' => '(31)99999-0000',
            'data_nascimento' => '1990-01-15',
            'cidade' => 'Belo Horizonte',
            'uf' => 'MG',
            'bairro' => 'Centro',
            'tipo_cadastro' => 'adotar',
            'tipo_moradia' => 'Casa',
            'possui_outros_animais' => 'nao',
            'ja_adotou_antes' => 'sim',
        ],
        'ana' => [
            'email' => 'ana@meu4patas.local',
            'nome_completo' => 'Ana Silva',
            'cpf' => '222.222.222-22',
            'cpf_limpo' => '22222222222',
            'telefone' => '(31)99999-1111',
            'data_nascimento' => '1995-05-20',
            'cidade' => 'Belo Horizonte',
            'uf' => 'MG',
            'bairro' => 'Savassi',
            'tipo_cadastro' => 'adotar',
            'tipo_moradia' => 'Apartamento',
            'possui_outros_animais' => 'nao',
            'ja_adotou_antes' => 'nao',
        ],
        'doador' => [
            'email' => 'doador@meu4patas.local',
            'nome_completo' => 'Carlos Doador',
            'cpf' => '333.333.333-33',
            'cpf_limpo' => '33333333333',
            'telefone' => '(31)99999-3333',
            'data_nascimento' => '1988-08-10',
            'cidade' => 'Contagem',
            'uf' => 'MG',
            'bairro' => 'Eldorado',
            'tipo_cadastro' => 'doar',
            'tipo_moradia' => 'Casa',
            'possui_outros_animais' => 'sim',
            'ja_adotou_antes' => 'sim',
        ],
    ];

    $find = $pdo->prepare("SELECT id FROM usuarios WHERE email=? OR cpf_limpo=? LIMIT 1");
    $insert = $pdo->prepare("
        INSERT INTO usuarios
            (nome_completo, cpf, cpf_limpo, email, telefone, data_nascimento, idade, maior21,
             cidade, uf, bairro, tipo_cadastro, tipo_moradia, possui_outros_animais, ja_adotou_antes,
             senha_hash, aceita_termos)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
    ");
    $update = $pdo->prepare("
        UPDATE usuarios
        SET nome_completo=?, cpf=?, cpf_limpo=?, email=?, telefone=?, data_nascimento=?, idade=?,
            maior21=?, cidade=?, uf=?, bairro=?, tipo_cadastro=?, tipo_moradia=?,
            possui_outros_animais=?, ja_adotou_antes=?, senha_hash=?, aceita_termos=1,
            atualizado_em=CURRENT_TIMESTAMP
        WHERE id=?
    ");

    $ids = [];
    $senha = password_hash('123456', PASSWORD_DEFAULT);
    foreach ($users as $key => $u) {
        $idade = calcularIdade($u['data_nascimento']);
        $maior21 = $idade >= 21 ? 1 : 0;
        $values = [
            $u['nome_completo'], $u['cpf'], $u['cpf_limpo'], $u['email'], $u['telefone'],
            $u['data_nascimento'], $idade, $maior21, $u['cidade'], $u['uf'], $u['bairro'],
            $u['tipo_cadastro'], $u['tipo_moradia'], $u['possui_outros_animais'],
            $u['ja_adotou_antes'], $senha,
        ];

        $find->execute([$u['email'], $u['cpf_limpo']]);
        $id = (int) $find->fetchColumn();
        if ($id > 0) {
            $update->execute([...$values, $id]);
        } else {
            $insert->execute($values);
            $id = (int) $pdo->lastInsertId();
        }
        $ids[$key] = $id;
    }

    return $ids;
}

function seedDemoAdotantes(PDO $pdo, array $usuarios): array {
    $rows = [
        'ana' => [
            'usuario_id' => $usuarios['ana'] ?? null,
            'nome_completo' => 'Ana Silva',
            'telefone' => '(31)99999-1111',
            'cidade' => 'Belo Horizonte',
            'uf' => 'MG',
            'bairro' => 'Savassi',
            'tipo_moradia' => 'Apartamento',
        ],
        'admin' => [
            'usuario_id' => $usuarios['admin'] ?? null,
            'nome_completo' => 'Arthur Santos',
            'telefone' => '(31)99999-2222',
            'cidade' => 'Belo Horizonte',
            'uf' => 'MG',
            'bairro' => 'Centro',
            'tipo_moradia' => 'Casa',
        ],
    ];

    $find = $pdo->prepare("SELECT id FROM adotantes WHERE usuario_id=? OR (nome_completo=? AND telefone=?) LIMIT 1");
    $insert = $pdo->prepare("
        INSERT INTO adotantes (usuario_id, nome_completo, telefone, cidade, uf, bairro, tipo_moradia)
        VALUES (?,?,?,?,?,?,?)
    ");
    $update = $pdo->prepare("
        UPDATE adotantes
        SET usuario_id=?, nome_completo=?, telefone=?, cidade=?, uf=?, bairro=?,
            tipo_moradia=?, atualizado_em=CURRENT_TIMESTAMP
        WHERE id=?
    ");

    $ids = [];
    foreach ($rows as $key => $r) {
        $find->execute([$r['usuario_id'], $r['nome_completo'], $r['telefone']]);
        $id = (int) $find->fetchColumn();
        $values = [
            $r['usuario_id'], $r['nome_completo'], $r['telefone'], $r['cidade'],
            $r['uf'], $r['bairro'], $r['tipo_moradia'],
        ];
        if ($id > 0) {
            $update->execute([...$values, $id]);
        } else {
            $insert->execute($values);
            $id = (int) $pdo->lastInsertId();
        }
        $ids[$key] = $id;
    }

    return $ids;
}

function seedDemoPets(PDO $pdo, array $usuarios, array $adotantes, array $pets): void {
    $doadorId = $usuarios['doador'] ?? null;

    $find = $pdo->prepare("SELECT id FROM pets WHERE nome_pet=? AND imagem=? LIMIT 1");
    $insert = $pdo->prepare("
        INSERT INTO pets
            (nome_pet, especie, raca, idade_aproximada, idade_meses, sexo, cidade, uf, bairro,
             status, descricao, temperamento, lar_ideal, imagem, responsavel_nome,
             responsavel_telefone, responsavel_tipo, tipo_cadastro, quantidade, leishmaniose,
             vermifugo, v8_v10, antirrabica, gripe_canina, giardia, v4_v5, felv, castrado,
             condicao_especial, observacoes_veterinarias, usuario_doador_id, adotante_id)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ");
    $update = $pdo->prepare("
        UPDATE pets
        SET nome_pet=?, especie=?, raca=?, idade_aproximada=?, idade_meses=?, sexo=?,
            cidade=?, uf=?, bairro=?, status=?, descricao=?, temperamento=?, lar_ideal=?,
            imagem=?, responsavel_nome=?, responsavel_telefone=?, responsavel_tipo=?,
            tipo_cadastro=?, quantidade=?, leishmaniose=?, vermifugo=?, v8_v10=?,
            antirrabica=?, gripe_canina=?, giardia=?, v4_v5=?, felv=?, castrado=?,
            condicao_especial=?, observacoes_veterinarias=?, usuario_doador_id=?,
            adotante_id=?, atualizado_em=CURRENT_TIMESTAMP
        WHERE id=?
    ");

    foreach ($pets as $p) {
        $adotanteId = null;
        if (!empty($p['adotante_key'])) {
            $adotanteId = $adotantes[$p['adotante_key']] ?? null;
        }

        $values = [
            $p['nome_pet'], $p['especie'], $p['raca'], $p['idade_aproximada'],
            $p['idade_meses'], $p['sexo'], $p['cidade'], $p['uf'], $p['bairro'],
            $p['status'], $p['descricao'], $p['temperamento'], $p['lar_ideal'],
            $p['imagem'], $p['responsavel_nome'], $p['responsavel_telefone'],
            $p['responsavel_tipo'], $p['tipo_cadastro'], $p['quantidade'],
            $p['leishmaniose'], $p['vermifugo'], $p['v8_v10'], $p['antirrabica'],
            $p['gripe_canina'], $p['giardia'], $p['v4_v5'], $p['felv'], $p['castrado'],
            $p['condicao_especial'], $p['observacoes_veterinarias'], $doadorId,
            $adotanteId,
        ];

        $find->execute([$p['nome_pet'], $p['imagem']]);
        $id = (int) $find->fetchColumn();
        if ($id > 0) {
            $update->execute([...$values, $id]);
        } else {
            $insert->execute($values);
        }
    }
}

function demoPets(): array {
    return [
        ['nome_pet'=>'Luna','especie'=>'Cão','raca'=>'Sem raça definida (SRD)','idade_aproximada'=>'2 anos','idade_meses'=>24,'sexo'=>'Fêmea','cidade'=>'Belo Horizonte','uf'=>'MG','bairro'=>'Santa Efigênia','status'=>'Disponível','descricao'=>'Luna é dócil, brincalhona e procura uma família responsável que goste de passeios ao ar livre.','temperamento'=>'Dócil,Brincalhona,Sociável','lar_ideal'=>'Casa com quintal,Família paciente,Passeios diários','imagem'=>'assets/luna-hero.png','responsavel_nome'=>'ONG meu4patas','responsavel_telefone'=>'(31) 99999-9999','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Negativo','vermifugo'=>1,'v8_v10'=>1,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>1,'condicao_especial'=>'','observacoes_veterinarias'=>'Sem observações graves.'],
        ['nome_pet'=>'Thor','especie'=>'Cão','raca'=>'Golden Retriever','idade_aproximada'=>'1 ano','idade_meses'=>12,'sexo'=>'Macho','cidade'=>'Belo Horizonte','uf'=>'MG','bairro'=>'Savassi','status'=>'Disponível','descricao'=>'Thor é energético, leal e adora crianças. Foi resgatado ainda filhote e hoje é pura alegria.','temperamento'=>'Energético,Leal,Carinhoso','lar_ideal'=>'Espaço amplo,Família ativa,Outros pets bem-vindos','imagem'=>'assets/pet-thor.jpg','responsavel_nome'=>'Abrigo Recomeço','responsavel_telefone'=>'(31) 98888-7777','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Negativo','vermifugo'=>1,'v8_v10'=>1,'antirrabica'=>1,'gripe_canina'=>1,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>0,'condicao_especial'=>'','observacoes_veterinarias'=>'Castração agendada.'],
        ['nome_pet'=>'Rex','especie'=>'Cão','raca'=>'Vira-lata','idade_aproximada'=>'3 anos','idade_meses'=>36,'sexo'=>'Macho','cidade'=>'Contagem','uf'=>'MG','bairro'=>'Eldorado','status'=>'Indisponível','descricao'=>'Rex está em tratamento e por isso ainda não está disponível, mas em breve poderá ser adotado.','temperamento'=>'Calmo,Companheiro','lar_ideal'=>'Lar tranquilo,Tutor paciente','imagem'=>'assets/pet-rex.jpg','responsavel_nome'=>'Lar Temporário da Ana','responsavel_telefone'=>'(31) 97777-6666','responsavel_tipo'=>'Lar temporário','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Em tratamento','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>1,'v4_v5'=>0,'felv'=>0,'castrado'=>1,'condicao_especial'=>'Em tratamento veterinário','observacoes_veterinarias'=>'Reavaliação em 30 dias.'],
        ['nome_pet'=>'Mel','especie'=>'Gato','raca'=>'Siamês','idade_aproximada'=>'8 meses','idade_meses'=>8,'sexo'=>'Fêmea','cidade'=>'Belo Horizonte','uf'=>'MG','bairro'=>'Funcionários','status'=>'Disponível','descricao'=>'Mel é uma gatinha dócil e curiosa, ideal para apartamento. Adora um colo no fim do dia.','temperamento'=>'Dócil,Curiosa,Tranquila','lar_ideal'=>'Apartamento com tela,Ambiente calmo','imagem'=>'assets/pet-mel.jpg','responsavel_nome'=>'Gatil Solidário','responsavel_telefone'=>'(31) 96666-5555','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Não testado','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>1,'felv'=>1,'castrado'=>0,'condicao_especial'=>'','observacoes_veterinarias'=>'FeLV negativo. Castração após 1 ano.'],
        ['nome_pet'=>'Nina','especie'=>'Gato','raca'=>'Sem raça definida (SRD)','idade_aproximada'=>'1 ano e 6 meses','idade_meses'=>18,'sexo'=>'Fêmea','cidade'=>'São Paulo','uf'=>'SP','bairro'=>'Pinheiros','status'=>'Adotado','descricao'=>'Nina já encontrou seu lar para sempre! Fica aqui como exemplo de uma adoção bem-sucedida.','temperamento'=>'Independente,Afetuosa','lar_ideal'=>'Lar com janelas teladas','imagem'=>'assets/pet-nina.jpg','responsavel_nome'=>'ONG Gatil SP','responsavel_telefone'=>'(11) 95555-4444','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Não testado','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>1,'felv'=>1,'castrado'=>1,'condicao_especial'=>'','observacoes_veterinarias'=>'Adotada por uma família responsável.','adotante_key'=>'ana'],
        ['nome_pet'=>'Ninhada da Mel','especie'=>'Gato','raca'=>'Sem raça definida (SRD)','idade_aproximada'=>'2 meses','idade_meses'=>2,'sexo'=>'Variado (ninhada)','cidade'=>'Belo Horizonte','uf'=>'MG','bairro'=>'Funcionários','status'=>'Disponível','descricao'=>'Quatro filhotes saudáveis procuram lares amorosos. Entrega após vermifugação e desmame completo.','temperamento'=>'Brincalhões,Sociáveis','lar_ideal'=>'Famílias responsáveis,Tutores com tempo','imagem'=>'assets/pet-ninhada.jpg','responsavel_nome'=>'Gatil Solidário','responsavel_telefone'=>'(31) 96666-5555','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Filhotes/Ninhada','quantidade'=>4,'leishmaniose'=>'Não testado','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>0,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>0,'condicao_especial'=>'','observacoes_veterinarias'=>'Primeira dose de vacina agendada.'],
        ['nome_pet'=>'Bidu','especie'=>'Cão','raca'=>'Shih Tzu','idade_aproximada'=>'4 anos','idade_meses'=>48,'sexo'=>'Macho','cidade'=>'São Paulo','uf'=>'SP','bairro'=>'Vila Mariana','status'=>'Disponível','descricao'=>'Bidu é um companheiro tranquilo, adora colo e se adapta muito bem a apartamento.','temperamento'=>'Calmo,Companheiro,Dócil','lar_ideal'=>'Apartamento,Ambiente calmo','imagem'=>'assets/pet-7.jpg','responsavel_nome'=>'ONG Amor de Patas','responsavel_telefone'=>'(11) 95555-1111','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Negativo','vermifugo'=>1,'v8_v10'=>1,'antirrabica'=>1,'gripe_canina'=>1,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>1,'condicao_especial'=>'','observacoes_veterinarias'=>'Pet saudável e sociável.'],
        ['nome_pet'=>'Amora','especie'=>'Cão','raca'=>'Poodle','idade_aproximada'=>'2 anos','idade_meses'=>24,'sexo'=>'Fêmea','cidade'=>'Rio de Janeiro','uf'=>'RJ','bairro'=>'Tijuca','status'=>'Adotado','descricao'=>'Amora já encontrou um novo lar! Exemplo de adoção feliz através do meu4patas.','temperamento'=>'Esperta,Carinhosa','lar_ideal'=>'Família presente','imagem'=>'assets/pet-8.jpg','responsavel_nome'=>'Lar Temporário do Léo','responsavel_telefone'=>'(21) 94444-2222','responsavel_tipo'=>'Lar temporário','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Negativo','vermifugo'=>1,'v8_v10'=>1,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>1,'condicao_especial'=>'','observacoes_veterinarias'=>'Adotada por uma família responsável.','adotante_key'=>'admin'],
        ['nome_pet'=>'Zeus','especie'=>'Cão','raca'=>'Pastor Alemão','idade_aproximada'=>'6 meses','idade_meses'=>6,'sexo'=>'Macho','cidade'=>'Porto Alegre','uf'=>'RS','bairro'=>'Moinhos de Vento','status'=>'Disponível','descricao'=>'Zeus é um filhote cheio de energia, inteligente e que aprende comandos com facilidade.','temperamento'=>'Energético,Inteligente,Protetor','lar_ideal'=>'Casa com quintal,Família ativa','imagem'=>'assets/pet-9.jpg','responsavel_nome'=>'Abrigo Patas do Sul','responsavel_telefone'=>'(51) 93333-3333','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Negativo','vermifugo'=>1,'v8_v10'=>1,'antirrabica'=>0,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>0,'condicao_especial'=>'','observacoes_veterinarias'=>'Vacinação em andamento.'],
        ['nome_pet'=>'Mike','especie'=>'Cão','raca'=>'Labrador Retriever','idade_aproximada'=>'3 anos','idade_meses'=>36,'sexo'=>'Macho','cidade'=>'Salvador','uf'=>'BA','bairro'=>'Barra','status'=>'Disponível','descricao'=>'Mike é dócil, brincalhão e ama água. Perfeito para famílias com crianças.','temperamento'=>'Brincalhão,Dócil,Sociável','lar_ideal'=>'Casa com quintal,Família com crianças','imagem'=>'assets/pet-10.jpg','responsavel_nome'=>'Ana Beatriz','responsavel_telefone'=>'(71) 92222-4444','responsavel_tipo'=>'Pessoa física','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Negativo','vermifugo'=>1,'v8_v10'=>1,'antirrabica'=>1,'gripe_canina'=>1,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>1,'condicao_especial'=>'','observacoes_veterinarias'=>'Sem observações.'],
        ['nome_pet'=>'Frida','especie'=>'Cão','raca'=>'Beagle','idade_aproximada'=>'1 ano','idade_meses'=>12,'sexo'=>'Fêmea','cidade'=>'Curitiba','uf'=>'PR','bairro'=>'Batel','status'=>'Disponível','descricao'=>'Frida é curiosa, farejadora e cheia de vida. Adora passeios e novos cheiros.','temperamento'=>'Curiosa,Ativa,Amigável','lar_ideal'=>'Casa com quintal,Passeios diários','imagem'=>'assets/pet-11.jpg','responsavel_nome'=>'ONG Focinhos Felizes','responsavel_telefone'=>'(41) 91111-5555','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Negativo','vermifugo'=>1,'v8_v10'=>1,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>0,'condicao_especial'=>'','observacoes_veterinarias'=>'Castração agendada.'],
        ['nome_pet'=>'Tobias','especie'=>'Cão','raca'=>'Bulldog Francês','idade_aproximada'=>'8 meses','idade_meses'=>8,'sexo'=>'Macho','cidade'=>'Florianópolis','uf'=>'SC','bairro'=>'Centro','status'=>'Disponível','descricao'=>'Tobias é um filhote brincalhão e companheiro, ideal para quem vive em apartamento.','temperamento'=>'Brincalhão,Companheiro','lar_ideal'=>'Apartamento,Ambiente fresco','imagem'=>'assets/pet-12.jpg','responsavel_nome'=>'Marcos Vinícius','responsavel_telefone'=>'(48) 90000-6666','responsavel_tipo'=>'Pessoa física','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Não testado','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>0,'condicao_especial'=>'Raça braquicefálica: evitar calor excessivo','observacoes_veterinarias'=>'Acompanhamento respiratório recomendado.'],
        ['nome_pet'=>'Pingo','especie'=>'Cão','raca'=>'Dachshund','idade_aproximada'=>'5 anos','idade_meses'=>60,'sexo'=>'Macho','cidade'=>'Recife','uf'=>'PE','bairro'=>'Boa Viagem','status'=>'Indisponível','descricao'=>'Pingo está em tratamento de coluna e por isso ainda não está disponível para adoção.','temperamento'=>'Calmo,Carinhoso','lar_ideal'=>'Lar sem escadas,Tutor paciente','imagem'=>'assets/pet-13.jpg','responsavel_nome'=>'Clínica Amigo Animal','responsavel_telefone'=>'(81) 98888-7777','responsavel_tipo'=>'Lar temporário','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Negativo','vermifugo'=>1,'v8_v10'=>1,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>1,'condicao_especial'=>'Problema de coluna em tratamento','observacoes_veterinarias'=>'Reavaliação em 60 dias.'],
        ['nome_pet'=>'Maya','especie'=>'Cão','raca'=>'Border Collie','idade_aproximada'=>'2 anos','idade_meses'=>24,'sexo'=>'Fêmea','cidade'=>'Brasília','uf'=>'DF','bairro'=>'Asa Sul','status'=>'Disponível','descricao'=>'Maya é extremamente inteligente e ativa. Precisa de estímulo mental e exercícios diários.','temperamento'=>'Inteligente,Ativa,Leal','lar_ideal'=>'Casa com quintal,Família ativa','imagem'=>'assets/pet-14.jpg','responsavel_nome'=>'ONG Cão Amigo DF','responsavel_telefone'=>'(61) 97777-8888','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Negativo','vermifugo'=>1,'v8_v10'=>1,'antirrabica'=>1,'gripe_canina'=>1,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>1,'condicao_especial'=>'','observacoes_veterinarias'=>'Muito enérgica, ideal para quem pratica atividades ao ar livre.'],
        ['nome_pet'=>'Bartô','especie'=>'Cão','raca'=>'Pitbull','idade_aproximada'=>'4 anos','idade_meses'=>48,'sexo'=>'Macho','cidade'=>'Fortaleza','uf'=>'CE','bairro'=>'Meireles','status'=>'Disponível','descricao'=>'Bartô é dócil, leal e adora carinho. Ao contrário do estigma, é um amor de cão.','temperamento'=>'Leal,Dócil,Protetor','lar_ideal'=>'Casa com quintal,Tutor experiente','imagem'=>'assets/pet-15.jpg','responsavel_nome'=>'Abrigo Recomeço CE','responsavel_telefone'=>'(85) 96666-9999','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Negativo','vermifugo'=>1,'v8_v10'=>1,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>1,'condicao_especial'=>'','observacoes_veterinarias'=>'Sociável com pessoas; socialização com outros cães em andamento.'],
        ['nome_pet'=>'Nala','especie'=>'Cão','raca'=>'Husky Siberiano','idade_aproximada'=>'3 anos','idade_meses'=>36,'sexo'=>'Fêmea','cidade'=>'Goiânia','uf'=>'GO','bairro'=>'Setor Bueno','status'=>'Disponível','descricao'=>'Nala é cheia de personalidade, comunicativa e adora correr. Precisa de espaço.','temperamento'=>'Ativa,Independente,Comunicativa','lar_ideal'=>'Casa com quintal grande,Tutor experiente','imagem'=>'assets/pet-16.jpg','responsavel_nome'=>'Patrícia Gomes','responsavel_telefone'=>'(62) 95555-0000','responsavel_tipo'=>'Pessoa física','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Negativo','vermifugo'=>1,'v8_v10'=>1,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>1,'condicao_especial'=>'','observacoes_veterinarias'=>'Precisa de ambiente arejado e exercícios.'],
        ['nome_pet'=>'Fred','especie'=>'Cão','raca'=>'Vira-lata','idade_aproximada'=>'5 meses','idade_meses'=>5,'sexo'=>'Macho','cidade'=>'Vitória','uf'=>'ES','bairro'=>'Praia do Canto','status'=>'Disponível','descricao'=>'Fred é um filhote vira-lata resgatado da rua, saudável, dócil e muito agradecido.','temperamento'=>'Dócil,Brincalhão,Carente','lar_ideal'=>'Família paciente,Ambiente seguro','imagem'=>'assets/pet-17.jpg','responsavel_nome'=>'ONG SOS Animais ES','responsavel_telefone'=>'(27) 94444-1212','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Não testado','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>0,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>0,'condicao_especial'=>'','observacoes_veterinarias'=>'Primeira dose de vacina aplicada.'],
        ['nome_pet'=>'Bela','especie'=>'Cão','raca'=>'Yorkshire Terrier','idade_aproximada'=>'7 anos','idade_meses'=>84,'sexo'=>'Fêmea','cidade'=>'Uberlândia','uf'=>'MG','bairro'=>'Santa Mônica','status'=>'Disponível','descricao'=>'Bela é uma idosinha tranquila que busca um lar calmo para viver com conforto e amor.','temperamento'=>'Calma,Companheira','lar_ideal'=>'Apartamento,Lar tranquilo','imagem'=>'assets/pet-18.jpg','responsavel_nome'=>'Lar Temporário da Cida','responsavel_telefone'=>'(34) 93333-2121','responsavel_tipo'=>'Lar temporário','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Negativo','vermifugo'=>1,'v8_v10'=>1,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>1,'condicao_especial'=>'Idosa: acompanhamento veterinário regular','observacoes_veterinarias'=>'Saudável para a idade.'],
        ['nome_pet'=>'Lola','especie'=>'Gato','raca'=>'Persa','idade_aproximada'=>'3 anos','idade_meses'=>36,'sexo'=>'Fêmea','cidade'=>'Campinas','uf'=>'SP','bairro'=>'Cambuí','status'=>'Disponível','descricao'=>'Lola é uma gata elegante e tranquila, adora um cafuné e ambientes silenciosos.','temperamento'=>'Tranquila,Elegante,Caseira','lar_ideal'=>'Apartamento com tela,Ambiente calmo','imagem'=>'assets/pet-19.jpg','responsavel_nome'=>'Gatil Sete Vidas','responsavel_telefone'=>'(19) 92222-3434','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Não testado','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>1,'felv'=>0,'castrado'=>1,'condicao_especial'=>'Pelagem longa: escovação frequente','observacoes_veterinarias'=>'FeLV negativo.'],
        ['nome_pet'=>'Simba','especie'=>'Gato','raca'=>'Maine Coon','idade_aproximada'=>'4 anos','idade_meses'=>48,'sexo'=>'Macho','cidade'=>'Niterói','uf'=>'RJ','bairro'=>'Icaraí','status'=>'Indisponível','descricao'=>'Simba está em observação veterinária e ficará disponível em breve. Gato enorme e dócil.','temperamento'=>'Dócil,Sociável,Gentil','lar_ideal'=>'Casa ou apartamento amplo','imagem'=>'assets/pet-20.jpg','responsavel_nome'=>'Gatil Sete Vidas','responsavel_telefone'=>'(21) 91111-5656','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Não testado','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>1,'v4_v5'=>1,'felv'=>0,'castrado'=>1,'condicao_especial'=>'Tratamento de giárdia em andamento','observacoes_veterinarias'=>'Reavaliação em 20 dias.'],
        ['nome_pet'=>'Chico','especie'=>'Gato','raca'=>'Sem raça definida (SRD)','idade_aproximada'=>'2 anos','idade_meses'=>24,'sexo'=>'Macho','cidade'=>'Manaus','uf'=>'AM','bairro'=>'Adrianópolis','status'=>'Disponível','descricao'=>'Chico é um gato laranja brincalhão e safado no bom sentido. Adora caixas e janelas.','temperamento'=>'Brincalhão,Curioso,Sociável','lar_ideal'=>'Apartamento com tela,Brinquedos','imagem'=>'assets/pet-21.jpg','responsavel_nome'=>'Rafael Souza','responsavel_telefone'=>'(92) 90000-7878','responsavel_tipo'=>'Pessoa física','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Não testado','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>1,'felv'=>0,'castrado'=>1,'condicao_especial'=>'','observacoes_veterinarias'=>'FeLV negativo.'],
        ['nome_pet'=>'Pretinha','especie'=>'Gato','raca'=>'Sem raça definida (SRD)','idade_aproximada'=>'1 ano','idade_meses'=>12,'sexo'=>'Fêmea','cidade'=>'Belém','uf'=>'PA','bairro'=>'Umarizal','status'=>'Disponível','descricao'=>'Pretinha é uma gata preta carinhosa que quebra superstições com muito amor e ronrons.','temperamento'=>'Carinhosa,Caseira,Dócil','lar_ideal'=>'Apartamento com tela,Lar amoroso','imagem'=>'assets/pet-22.jpg','responsavel_nome'=>'ONG Gato Feliz PA','responsavel_telefone'=>'(91) 98888-1313','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Não testado','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>1,'felv'=>0,'castrado'=>0,'condicao_especial'=>'','observacoes_veterinarias'=>'Castração agendada.'],
        ['nome_pet'=>'Aurora','especie'=>'Gato','raca'=>'Ragdoll','idade_aproximada'=>'2 anos','idade_meses'=>24,'sexo'=>'Fêmea','cidade'=>'Cuiabá','uf'=>'MT','bairro'=>'Centro-Sul','status'=>'Disponível','descricao'=>'Aurora é uma gata super dócil e relaxada, fica molinha no colo como uma boneca de pano.','temperamento'=>'Dócil,Calma,Apegada','lar_ideal'=>'Ambiente calmo,Família presente','imagem'=>'assets/pet-23.jpg','responsavel_nome'=>'Gatil Solidário','responsavel_telefone'=>'(65) 97777-1414','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Não testado','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>1,'felv'=>0,'castrado'=>1,'condicao_especial'=>'','observacoes_veterinarias'=>'Pelagem longa: escovação frequente.'],
        ['nome_pet'=>'Tom','especie'=>'Gato','raca'=>'Sphynx','idade_aproximada'=>'3 anos','idade_meses'=>36,'sexo'=>'Macho','cidade'=>'Campo Grande','uf'=>'MS','bairro'=>'Centro','status'=>'Disponível','descricao'=>'Tom é um gato sem pelo, quentinho e extremamente apegado. Precisa de proteção solar e do frio.','temperamento'=>'Apegado,Sociável,Ativo','lar_ideal'=>'Ambiente protegido do frio e do sol','imagem'=>'assets/pet-24.jpg','responsavel_nome'=>'Juliana Martins','responsavel_telefone'=>'(67) 96666-1515','responsavel_tipo'=>'Pessoa física','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Não testado','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>1,'felv'=>0,'castrado'=>1,'condicao_especial'=>'Sem pelos: cuidados com temperatura e pele','observacoes_veterinarias'=>'Banhos periódicos recomendados.'],
        ['nome_pet'=>'Mimi','especie'=>'Gato','raca'=>'Angorá','idade_aproximada'=>'6 meses','idade_meses'=>6,'sexo'=>'Fêmea','cidade'=>'Natal','uf'=>'RN','bairro'=>'Ponta Negra','status'=>'Disponível','descricao'=>'Mimi é uma filhotinha fofa e brincalhona, cheia de energia e pronta para um novo lar.','temperamento'=>'Brincalhona,Curiosa,Carinhosa','lar_ideal'=>'Apartamento com tela,Brinquedos','imagem'=>'assets/pet-25.jpg','responsavel_nome'=>'ONG Mia Resgate','responsavel_telefone'=>'(84) 95555-1616','responsavel_tipo'=>'ONG','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Não testado','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>0,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>0,'felv'=>0,'castrado'=>0,'condicao_especial'=>'','observacoes_veterinarias'=>'Primeira dose de vacina agendada.'],
        ['nome_pet'=>'Bigode','especie'=>'Gato','raca'=>'Bengal','idade_aproximada'=>'2 anos','idade_meses'=>24,'sexo'=>'Macho','cidade'=>'João Pessoa','uf'=>'PB','bairro'=>'Manaíra','status'=>'Disponível','descricao'=>'Bigode é ágil, atlético e adora escalar. Tem energia de sobra e adora interagir.','temperamento'=>'Ativo,Esperto,Brincalhão','lar_ideal'=>'Ambiente com prateleiras e arranhadores','imagem'=>'assets/pet-26.jpg','responsavel_nome'=>'Lar Temporário do Pedro','responsavel_telefone'=>'(83) 94444-1717','responsavel_tipo'=>'Lar temporário','tipo_cadastro'=>'Pet individual','quantidade'=>1,'leishmaniose'=>'Não testado','vermifugo'=>1,'v8_v10'=>0,'antirrabica'=>1,'gripe_canina'=>0,'giardia'=>0,'v4_v5'=>1,'felv'=>0,'castrado'=>1,'condicao_especial'=>'','observacoes_veterinarias'=>'Gato muito ativo, precisa de enriquecimento ambiental.'],
    ];
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
        case 'health': {
            $pdo = getPDO();
            ok([
                'status' => 'ok',
                'version' => '1.1',
                'banco' => file_exists(__DIR__ . '/banco.db'),
                'usuarios' => (int) $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn(),
                'adotantes' => (int) $pdo->query("SELECT COUNT(*) FROM adotantes")->fetchColumn(),
                'pets' => (int) $pdo->query("SELECT COUNT(*) FROM pets")->fetchColumn(),
            ], 'API meu4patas funcionando.');
        }

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

        /* ─── ATUALIZAR STATUS DO INTERESSE (responsável/ONG dá andamento) ─── */
        case 'atualizar_status_interesse': {
            $s = sessaoAtiva();
            $pdo = getPDO();
            $interesseId = (int)input('interesse_id');
            $novoStatus  = sanitize((string)input('status', ''));
            if (!$interesseId) err('Interesse inválido.');

            $permitidos = ['Interesse enviado', 'Em conversa', 'Aprovado', 'Adoção concluída', 'Recusado'];
            if (!in_array($novoStatus, $permitidos, true))
                err('Status de adoção inválido.');

            /* Confirmar que o interesse pertence a um pet do usuário logado */
            $stmt = $pdo->prepare("
                SELECT i.id, i.pet_id, p.usuario_doador_id
                FROM interesses i
                JOIN pets p ON p.id = i.pet_id
                WHERE i.id = ?
            ");
            $stmt->execute([$interesseId]);
            $row = $stmt->fetch();
            if (!$row) err('Interesse não encontrado.', 404);
            if ((int)$row['usuario_doador_id'] !== (int)$s['id'])
                err('Você só pode dar andamento aos interesses dos pets que cadastrou.', 403);

            $pdo->prepare("UPDATE interesses SET status=? WHERE id=?")
                ->execute([$novoStatus, $interesseId]);

            /* Concluir a adoção também atualiza o status do pet */
            if ($novoStatus === 'Adoção concluída') {
                $pdo->prepare("UPDATE pets SET status='Adotado', atualizado_em=CURRENT_TIMESTAMP WHERE id=?")
                    ->execute([(int)$row['pet_id']]);
            } elseif ($novoStatus === 'Recusado') {
                /* Recusa de uma adoção não altera o status do pet */
            }

            ok(null, 'Andamento da adoção atualizado.');
        }

        /* ─── CONFIRMAR DOAÇÃO (responsável escolhe o adotante) ─── */
        case 'confirmar_doacao': {
            $s = sessaoAtiva();
            $pdo = getPDO();
            $interesseId = (int)input('interesse_id');
            if (!$interesseId) err('Interesse inválido.');

            /* Confirmar que o interesse pertence a um pet do usuário logado */
            $stmt = $pdo->prepare("
                SELECT i.id, i.pet_id, i.usuario_id,
                       p.usuario_doador_id, p.status,
                       u.nome_completo, u.telefone, u.cidade, u.uf, u.bairro, u.tipo_moradia
                FROM interesses i
                JOIN pets p     ON p.id = i.pet_id
                JOIN usuarios u ON u.id = i.usuario_id
                WHERE i.id = ?
            ");
            $stmt->execute([$interesseId]);
            $row = $stmt->fetch();
            if (!$row) err('Interesse não encontrado.', 404);
            if ((int)$row['usuario_doador_id'] !== (int)$s['id'])
                err('Você só pode confirmar a doação dos pets que cadastrou.', 403);
            if ($row['status'] === 'Adotado')
                err('Este pet já foi marcado como adotado.');

            $petId = (int)$row['pet_id'];
            $pdo->beginTransaction();
            try {
                /* Registra o adotante a partir do cadastro da pessoa interessada */
                $ins = $pdo->prepare("
                    INSERT INTO adotantes (usuario_id, nome_completo, telefone, cidade, uf, bairro, tipo_moradia)
                    VALUES (?,?,?,?,?,?,?)
                ");
                $ins->execute([
                    (int)$row['usuario_id'], $row['nome_completo'], $row['telefone'],
                    $row['cidade'], $row['uf'], $row['bairro'], $row['tipo_moradia']
                ]);
                $adotanteId = (int)$pdo->lastInsertId();

                /* Marca o pet como adotado e vincula o adotante */
                $pdo->prepare("UPDATE pets SET status='Adotado', adotante_id=?, atualizado_em=CURRENT_TIMESTAMP WHERE id=?")
                    ->execute([$adotanteId, $petId]);

                /* Conclui o interesse escolhido e recusa os demais do mesmo pet */
                $pdo->prepare("UPDATE interesses SET status='Adoção concluída' WHERE id=?")
                    ->execute([$interesseId]);
                $pdo->prepare("UPDATE interesses SET status='Recusado' WHERE pet_id=? AND id<>?")
                    ->execute([$petId, $interesseId]);

                $pdo->commit();
            } catch (Throwable $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                throw $e;
            }

            ok(null, 'Doação confirmada! O pet foi marcado como adotado.');
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

            /* Para cada pet, buscar interessados com os dados do cadastro */
            foreach ($pets as &$pet) {
                $si = $pdo->prepare("
                    SELECT i.*,
                           u.nome_completo, u.email, u.telefone,
                           u.cidade, u.uf, u.bairro,
                           u.idade, u.data_nascimento, u.maior21,
                           u.tipo_moradia, u.possui_outros_animais,
                           u.ja_adotou_antes, u.aceita_termos
                    FROM interesses i
                    JOIN usuarios u ON u.id=i.usuario_id
                    WHERE i.pet_id=?
                    ORDER BY i.criado_em ASC
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
