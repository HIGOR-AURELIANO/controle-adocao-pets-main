-- Active: 1781265265575@@localhost@5432@petmatch
CREATE DATABASE petmatch;
CREATE TABLE users (
    id SERIAL PRIMARY KEY, -- Identificador único do usuário gerado automaticamente pelo banco (Evita repetições)
    name VARCHAR(100) NOT NULL, -- Nome completo do usuário (Obrigatório, não permite valor nulo)
    email VARCHAR(100) UNIQUE NOT NULL, -- E-mail do usuário (Obrigatório e único, não permite e-mails repetidos no app)
    password_hash VARCHAR(255) NOT NULL, -- Senha do usuário criptografada para total segurança no banco
    phone VARCHAR(20), -- Telefone de contato (Opcional, o usuário pode escolher não cadastrar)
    city VARCHAR(50) DEFAULT 'Belo Horizonte', -- Cidade do usuário (Se ele esquecer de preencher, o padrão será BH)
    state VARCHAR(2) DEFAULT 'MG', -- Estado/UF do usuário (Se ele esquecer de preencher, o padrão será MG)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data e hora exata em que o usuário realizador o cadastro no sistema
);

CREATE TABLE animals (
    id SERIAL PRIMARY KEY, -- Identificador único do pet gerado automaticamente pelo banco
    name VARCHAR(100) NOT NULL, -- Nome do animal (Obrigatório)
    age INTEGER NOT NULL, -- Idade do animal em anos (Guarda apenas números inteiros)
    raca VARCHAR(50) NOT NULL, -- Raça do animal (Ex: Vira-lata, Poodle, Siamês)
    species VARCHAR(30) NOT NULL, -- Tipo de espécie (Ex: Cachorro, Gato, Ave)
    city VARCHAR(50) NOT NULL, -- Cidade onde o animal se encontra para adoçãoe
    state VARCHAR(2) NOT NULL, -- Estado/UF (Ex: MG, SP, RJ)
    dewormed BOOLEAN DEFAULT FALSE, -- Ficha Médica: Tomou vermífugo? (TRUE para sim, FALSE para não)
    leishmaniasis_negative BOOLEAN DEFAULT FALSE, -- Ficha Médica: Teste de leishmaniose deu negativo? (TRUE/FALSE)
    is_vaccinated BOOLEAN DEFAULT FALSE, -- Ficha Médica: Está com as vacinas gerais em dia? (TRUE/FALSE)
    available BOOLEAN DEFAULT TRUE, -- Status: Se TRUE, o pet aparece no app. Se FALSE (adotado/em tratamento), o app esconde.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data e hora exata em que o pet foi cadastrado no sistema
);


CREATE TABLE adoption_requests ( --pedidos de adoação---
    id SERIAL PRIMARY KEY, -- Identificador único do pedido de adoção
    user_id INTEGER NOT NULL REFERENCES users(id), -- Conecta direto com o ID do usuário que quer adotar
    animal_id INTEGER NOT NULL REFERENCES animals(id), -- Conecta direto com o ID do pet que vai ser adotado
    
    -- Requisitos da imagem traduzidos para o banco
    is_over_21 BOOLEAN DEFAULT FALSE, -- O usuário confirmou ser maior de 21 anos?
    has_documents BOOLEAN DEFAULT FALSE, -- Entregou a cópia do RG e CPF?
    proof_of_residence BOOLEAN DEFAULT FALSE, -- Entregou a cópia do comprovante de água/luz?
    fee_paid BOOLEAN DEFAULT FALSE, -- Confirmou a contribuição de R$50,00 (ajuda de custo)?
    has_transport_gear BOOLEAN DEFAULT FALSE, -- Confirmou que tem a caixa de transporte (gato) ou guia peitoral (cão)?
    
    -- Fluxo da entrevista com a ONG
    interview_status VARCHAR(20) DEFAULT 'Pendente', -- Status da entrevista: Pendente, Aprovado ou Reprovado
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Quando o usuário clicou no botão "Adotar"
);


-- =========================================================
-- ALIMENTANDO O BANCO DE DADOS (INSERÇÃO DE TESTE)
-- =========================================================

-- 1. Cadastrando os primeiros usuários fictícios
INSERT INTO users (name, email, password_hash, phone, city, state) VALUES
('Ana Silva', 'ana.silva@email.com', 'hash_senha_123', '31999991111', 'Belo Horizonte', 'MG'),
('Arthur Santos', 'arthur.santos@email.com', 'hash_senha_456', '31999992222', 'Contagem', 'MG'),
('Rayssa Caetano', 'rayssa.dev@email.com', 'hash_senha_789', '31999993333', 'Belo Horizonte', 'MG');

-- 2. Cadastrando os 26 pets do projeto (mesmos dados de js/script.js — INITIAL_PETS)
--    species: 'Cão' do app é gravado como 'Cachorro' | age = idade em anos (idadeMeses/12)
--    available = TRUE quando status 'Disponível' (Indisponível/Adotado = FALSE)
INSERT INTO animals (name, age, raca, species, city, state, dewormed, leishmaniasis_negative, is_vaccinated, available) VALUES
('Luna', 2, 'Sem raça definida (SRD)', 'Cachorro', 'Belo Horizonte', 'MG', TRUE, TRUE, TRUE, TRUE),  -- id 1 · Disponível
('Thor', 1, 'Golden Retriever', 'Cachorro', 'Belo Horizonte', 'MG', TRUE, TRUE, TRUE, TRUE),  -- id 2 · Disponível
('Rex', 3, 'Vira-lata', 'Cachorro', 'Contagem', 'MG', TRUE, FALSE, TRUE, FALSE),  -- id 3 · Indisponível
('Mel', 0, 'Siamês', 'Gato', 'Belo Horizonte', 'MG', TRUE, FALSE, TRUE, TRUE),  -- id 4 · Disponível
('Nina', 1, 'Sem raça definida (SRD)', 'Gato', 'São Paulo', 'SP', TRUE, FALSE, TRUE, FALSE),  -- id 5 · Adotado
('Ninhada da Mel', 0, 'Sem raça definida (SRD)', 'Gato', 'Belo Horizonte', 'MG', TRUE, FALSE, FALSE, TRUE),  -- id 6 · Disponível
('Bidu', 4, 'Shih Tzu', 'Cachorro', 'São Paulo', 'SP', TRUE, TRUE, TRUE, TRUE),  -- id 7 · Disponível
('Amora', 2, 'Poodle', 'Cachorro', 'Rio de Janeiro', 'RJ', TRUE, TRUE, TRUE, FALSE),  -- id 8 · Adotado
('Zeus', 0, 'Pastor Alemão', 'Cachorro', 'Porto Alegre', 'RS', TRUE, TRUE, TRUE, TRUE),  -- id 9 · Disponível
('Mike', 3, 'Labrador Retriever', 'Cachorro', 'Salvador', 'BA', TRUE, TRUE, TRUE, TRUE),  -- id 10 · Disponível
('Frida', 1, 'Beagle', 'Cachorro', 'Curitiba', 'PR', TRUE, TRUE, TRUE, TRUE),  -- id 11 · Disponível
('Tobias', 0, 'Bulldog Francês', 'Cachorro', 'Florianópolis', 'SC', TRUE, FALSE, TRUE, TRUE),  -- id 12 · Disponível
('Pingo', 5, 'Dachshund', 'Cachorro', 'Recife', 'PE', TRUE, TRUE, TRUE, FALSE),  -- id 13 · Indisponível
('Maya', 2, 'Border Collie', 'Cachorro', 'Brasília', 'DF', TRUE, TRUE, TRUE, TRUE),  -- id 14 · Disponível
('Bartô', 4, 'Pitbull', 'Cachorro', 'Fortaleza', 'CE', TRUE, TRUE, TRUE, TRUE),  -- id 15 · Disponível
('Nala', 3, 'Husky Siberiano', 'Cachorro', 'Goiânia', 'GO', TRUE, TRUE, TRUE, TRUE),  -- id 16 · Disponível
('Fred', 0, 'Vira-lata', 'Cachorro', 'Vitória', 'ES', TRUE, FALSE, FALSE, TRUE),  -- id 17 · Disponível
('Bela', 7, 'Yorkshire Terrier', 'Cachorro', 'Uberlândia', 'MG', TRUE, TRUE, TRUE, TRUE),  -- id 18 · Disponível
('Lola', 3, 'Persa', 'Gato', 'Campinas', 'SP', TRUE, FALSE, TRUE, TRUE),  -- id 19 · Disponível
('Simba', 4, 'Maine Coon', 'Gato', 'Niterói', 'RJ', TRUE, FALSE, TRUE, FALSE),  -- id 20 · Indisponível
('Chico', 2, 'Sem raça definida (SRD)', 'Gato', 'Manaus', 'AM', TRUE, FALSE, TRUE, TRUE),  -- id 21 · Disponível
('Pretinha', 1, 'Sem raça definida (SRD)', 'Gato', 'Belém', 'PA', TRUE, FALSE, TRUE, TRUE),  -- id 22 · Disponível
('Aurora', 2, 'Ragdoll', 'Gato', 'Cuiabá', 'MT', TRUE, FALSE, TRUE, TRUE),  -- id 23 · Disponível
('Tom', 3, 'Sphynx', 'Gato', 'Campo Grande', 'MS', TRUE, FALSE, TRUE, TRUE),  -- id 24 · Disponível
('Mimi', 0, 'Angorá', 'Gato', 'Natal', 'RN', TRUE, FALSE, FALSE, TRUE),  -- id 25 · Disponível
('Bigode', 2, 'Bengal', 'Gato', 'João Pessoa', 'PB', TRUE, FALSE, TRUE, TRUE);  -- id 26 · Disponível


-- 3. Simulando os pedidos de adoção com as regras dos requisitos
INSERT INTO adoption_requests (user_id, animal_id, is_over_21, has_documents, proof_of_residence, fee_paid, has_transport_gear, interview_status) VALUES
(1, 2, TRUE, TRUE, TRUE, TRUE, TRUE, 'Aprovado'), -- Ana Silva adotando o Thor (id 2 — Tudo OK)
(2, 4, TRUE, TRUE, FALSE, FALSE, TRUE, 'Pendente'); -- Arthur tentando adotar a Mel (id 4 — Falta luz/água e taxa)

-- 📊 RELATÓRIO DO MATCH DE ADOÇÃO (CONSULTA COMPLETA)
-- =========================================================