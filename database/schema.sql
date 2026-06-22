-- ═══════════════════════════════════════════════════════════════
--  meu4patas — Schema do banco de dados (SQLite)
-- ───────────────────────────────────────────────────────────────
--  Este arquivo documenta a estrutura REAL usada pelo sistema.
--  O banco é criado e mantido automaticamente por api.php (initDB()),
--  no arquivo banco.db. Este script serve como referência e pode
--  recriar a estrutura do zero em um banco SQLite vazio.
--
--  Stack: PHP 8 + SQLite + PDO. Não usar PostgreSQL/MySQL.
-- ═══════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ───────────────────────────────────────────────────────────────
-- Tabela: usuarios
-- Contas de pessoas que usam a plataforma (adotar ou divulgar pets).
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_completo         TEXT NOT NULL,
    cpf                   TEXT NOT NULL UNIQUE,          -- CPF formatado
    cpf_limpo             TEXT NOT NULL UNIQUE,          -- CPF apenas dígitos
    email                 TEXT NOT NULL UNIQUE,
    telefone              TEXT NOT NULL,
    data_nascimento       TEXT NOT NULL,                 -- AAAA-MM-DD
    idade                 INTEGER NOT NULL,
    maior21               INTEGER NOT NULL DEFAULT 0,    -- 1 se >= 21 anos
    cidade                TEXT NOT NULL,
    uf                    TEXT NOT NULL,
    bairro                TEXT NOT NULL DEFAULT '',
    tipo_cadastro         TEXT NOT NULL DEFAULT 'adotar',
    tipo_moradia          TEXT NOT NULL DEFAULT '',
    possui_outros_animais TEXT NOT NULL DEFAULT 'nao',
    ja_adotou_antes       TEXT NOT NULL DEFAULT 'nao',
    senha_hash            TEXT NOT NULL,                 -- password_hash()
    aceita_termos         INTEGER NOT NULL DEFAULT 0,
    criado_em             TEXT DEFAULT CURRENT_TIMESTAMP,
    atualizado_em         TEXT
);

-- ───────────────────────────────────────────────────────────────
-- Tabela: adotantes
-- Registro de quem efetivamente adotou um pet (vínculo histórico).
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adotantes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id    INTEGER,                               -- pode ser NULL (adotante externo)
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
);

-- ───────────────────────────────────────────────────────────────
-- Tabela: pets
-- Animais cadastrados para adoção, com ficha completa.
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pets (
    id                       INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_pet                 TEXT NOT NULL,
    especie                  TEXT NOT NULL,
    raca                     TEXT NOT NULL,
    idade_aproximada         TEXT NOT NULL,
    idade_meses              INTEGER NOT NULL DEFAULT 0,
    sexo                     TEXT NOT NULL,
    cidade                   TEXT NOT NULL,
    uf                       TEXT NOT NULL,
    bairro                   TEXT DEFAULT '',
    status                   TEXT NOT NULL DEFAULT 'Disponível',  -- Disponível | Indisponível | Adotado
    descricao                TEXT NOT NULL,
    temperamento             TEXT DEFAULT '',             -- valores separados por vírgula
    lar_ideal                TEXT DEFAULT '',             -- valores separados por vírgula
    imagem                   TEXT NOT NULL DEFAULT '',    -- caminho do asset ou data URI base64
    responsavel_nome         TEXT NOT NULL,
    responsavel_telefone     TEXT NOT NULL,
    responsavel_tipo         TEXT NOT NULL DEFAULT 'Pessoa física',  -- Pessoa física | ONG | Lar temporário
    tipo_cadastro            TEXT NOT NULL DEFAULT 'Pet individual',
    quantidade               INTEGER DEFAULT 1,
    leishmaniose             TEXT DEFAULT 'Não testado',
    vermifugo                INTEGER DEFAULT 0,
    v8_v10                   INTEGER DEFAULT 0,
    antirrabica              INTEGER DEFAULT 0,
    gripe_canina             INTEGER DEFAULT 0,
    giardia                  INTEGER DEFAULT 0,
    v4_v5                    INTEGER DEFAULT 0,
    felv                     INTEGER DEFAULT 0,
    castrado                 INTEGER DEFAULT 0,
    condicao_especial        TEXT DEFAULT '',
    observacoes_veterinarias TEXT DEFAULT '',
    usuario_doador_id        INTEGER,                     -- quem cadastrou o pet
    adotante_id              INTEGER NULL,                -- preenchido quando Adotado
    criado_em                TEXT DEFAULT CURRENT_TIMESTAMP,
    atualizado_em            TEXT,
    FOREIGN KEY(usuario_doador_id) REFERENCES usuarios(id)  ON DELETE SET NULL,
    FOREIGN KEY(adotante_id)       REFERENCES adotantes(id) ON DELETE SET NULL
);

-- ───────────────────────────────────────────────────────────────
-- Tabela: interesses
-- "Tenho interesse": demonstração de interesse de um usuário em um pet.
-- Não realiza adoção direta — apenas registra o interesse para avaliação.
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interesses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id  INTEGER NOT NULL,
    pet_id      INTEGER NOT NULL,
    status      TEXT NOT NULL DEFAULT 'Interesse enviado',
                -- Interesse enviado | Em conversa | Aprovado | Adoção concluída | Recusado
    mensagem    TEXT,
    criado_em   TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY(pet_id)     REFERENCES pets(id)     ON DELETE CASCADE,
    UNIQUE(usuario_id, pet_id)
);

-- ───────────────────────────────────────────────────────────────
-- Tabela: recusas
-- Pets que o usuário descartou ("não tenho interesse"), para não exibir de novo.
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recusas (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    pet_id     INTEGER NOT NULL,
    criado_em  TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY(pet_id)     REFERENCES pets(id)     ON DELETE CASCADE
);

-- ───────────────────────────────────────────────────────────────
-- Índices auxiliares
-- ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pets_demo_lookup ON pets (nome_pet, imagem);
CREATE INDEX IF NOT EXISTS idx_interesses_pet   ON interesses (pet_id);
CREATE INDEX IF NOT EXISTS idx_recusas_pet      ON recusas (pet_id);

-- ═══════════════════════════════════════════════════════════════
--  Observação: os dados de demonstração (usuários, adotantes e os
--  26 pets) são populados automaticamente por api.php em initDB()
--  / seedData(), não por este arquivo.
-- ═══════════════════════════════════════════════════════════════
