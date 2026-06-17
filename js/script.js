/* ─────────────────────────────────────────
   meu4patas — Fase 01
   script.js — protótipo navegável (HTML + CSS + JS puro)
   Persistência simulada via localStorage.
───────────────────────────────────────── */

'use strict';

/* ===========================================================
   1. CONSTANTES / CHAVES DO localStorage
=========================================================== */
const LS = {
  usuario:     'meu4patas_usuario',
  contas:      'meu4patas_contas',     // todas as contas cadastradas (para login)
  pets:        'meu4patas_pets',
  interesses:  'meu4patas_interesses',
  recusas:     'meu4patas_recusas',
  interessados:'meu4patas_interessados',
  versao:      'meu4patas_versao'
};

const DATA_VERSION = '4';        // bump para reabastecer os pets iniciais
const IDADE_MINIMA_ADOCAO = 21;  // idade mínima para demonstrar interesse em adoção
const FILHOTE_MAX_MESES = 12;    // até 12 meses é considerado filhote

/* Listas de raças (mudam conforme a espécie) */
const RACAS = {
  'Cão': [
    'Sem raça definida (SRD)', 'Shih Tzu', 'Poodle', 'Pinscher', 'Yorkshire Terrier',
    'Golden Retriever', 'Labrador Retriever', 'Pastor Alemão', 'Border Collie',
    'Bulldog Francês', 'Bulldog Inglês', 'Spitz Alemão', 'Lhasa Apso', 'Dachshund',
    'Beagle', 'Rottweiler', 'Pitbull', 'Boxer', 'Chow Chow', 'Maltês', 'Chihuahua',
    'Cocker Spaniel', 'Husky Siberiano', 'Akita', 'Vira-lata', 'Outra'
  ],
  'Gato': [
    'Sem raça definida (SRD)', 'Persa', 'Siamês', 'Maine Coon', 'Angorá', 'Sphynx',
    'Bengal', 'Ragdoll', 'British Shorthair', 'Scottish Fold', 'Himalaio',
    'Azul Russo', 'Vira-lata', 'Outra'
  ]
};

/* ===========================================================
   2. PETS INICIAIS (usados quando não há dados salvos)
   Pelo menos: 3 cães, 2 gatos e 1 ninhada.
=========================================================== */
const INITIAL_PETS = [
  {
    id: 1, nome: 'Luna', especie: 'Cão', raca: 'Sem raça definida (SRD)',
    idade: '2 anos', idadeMeses: 24, sexo: 'Fêmea',
    localizacao: 'Belo Horizonte/MG', cidade: 'Belo Horizonte', uf: 'MG', bairro: 'Santa Efigênia',
    status: 'Disponível', imagem: 'assets/luna-hero.png',
    descricao: 'Luna é dócil, brincalhona e procura uma família responsável que goste de passeios ao ar livre.',
    temperamento: ['Dócil', 'Brincalhona', 'Sociável'],
    larIdeal: ['Casa com quintal', 'Família paciente', 'Passeios diários'],
    responsavel: { nome: 'ONG meu4patas', telefone: '(31) 99999-9999', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: {
      leishmaniose: 'Negativo', vermifugo: true, v8v10: true, antirrabica: true,
      gripeCanina: false, giardia: false, v4v5: false, felv: false, castrado: true,
      vacinaPrincipal: 'V10', condicaoEspecial: '', observacoes: 'Sem observações graves.'
    }
  },
  {
    id: 2, nome: 'Thor', especie: 'Cão', raca: 'Golden Retriever',
    idade: '1 ano', idadeMeses: 12, sexo: 'Macho',
    localizacao: 'Belo Horizonte/MG', cidade: 'Belo Horizonte', uf: 'MG', bairro: 'Savassi',
    status: 'Disponível', imagem: 'assets/pet-thor.jpg',
    descricao: 'Thor é energético, leal e adora crianças. Foi resgatado ainda filhote e hoje é pura alegria.',
    temperamento: ['Energético', 'Leal', 'Carinhoso'],
    larIdeal: ['Espaço amplo', 'Família ativa', 'Outros pets bem-vindos'],
    responsavel: { nome: 'Abrigo Recomeço', telefone: '(31) 98888-7777', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: {
      leishmaniose: 'Negativo', vermifugo: true, v8v10: true, antirrabica: true,
      gripeCanina: true, giardia: false, v4v5: false, felv: false, castrado: false,
      vacinaPrincipal: 'V10', condicaoEspecial: '', observacoes: 'Castração agendada.'
    }
  },
  {
    id: 3, nome: 'Rex', especie: 'Cão', raca: 'Vira-lata',
    idade: '3 anos', idadeMeses: 36, sexo: 'Macho',
    localizacao: 'Contagem/MG', cidade: 'Contagem', uf: 'MG', bairro: 'Eldorado',
    status: 'Indisponível', imagem: 'assets/pet-rex.jpg',
    descricao: 'Rex está em tratamento e por isso ainda não está disponível, mas em breve poderá ser adotado.',
    temperamento: ['Calmo', 'Companheiro'],
    larIdeal: ['Lar tranquilo', 'Tutor paciente'],
    responsavel: { nome: 'Lar Temporário da Ana', telefone: '(31) 97777-6666', tipo: 'Lar temporário' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: {
      leishmaniose: 'Em tratamento', vermifugo: true, v8v10: false, antirrabica: true,
      gripeCanina: false, giardia: true, v4v5: false, felv: false, castrado: true,
      vacinaPrincipal: 'V8', condicaoEspecial: 'Em tratamento veterinário', observacoes: 'Reavaliação em 30 dias.'
    }
  },
  {
    id: 4, nome: 'Mel', especie: 'Gato', raca: 'Siamês',
    idade: '8 meses', idadeMeses: 8, sexo: 'Fêmea',
    localizacao: 'Belo Horizonte/MG', cidade: 'Belo Horizonte', uf: 'MG', bairro: 'Funcionários',
    status: 'Disponível', imagem: 'assets/pet-mel.jpg',
    descricao: 'Mel é uma gatinha dócil e curiosa, ideal para apartamento. Adora um colo no fim do dia.',
    temperamento: ['Dócil', 'Curiosa', 'Tranquila'],
    larIdeal: ['Apartamento com tela', 'Ambiente calmo'],
    responsavel: { nome: 'Gatil Solidário', telefone: '(31) 96666-5555', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: {
      leishmaniose: 'Não testado', vermifugo: true, v8v10: false, antirrabica: true,
      gripeCanina: false, giardia: false, v4v5: true, felv: true, castrado: false,
      vacinaPrincipal: 'V4', condicaoEspecial: '', observacoes: 'FeLV negativo. Castração após 1 ano.'
    }
  },
  {
    id: 5, nome: 'Nina', especie: 'Gato', raca: 'Sem raça definida (SRD)',
    idade: '1 ano e 6 meses', idadeMeses: 18, sexo: 'Fêmea',
    localizacao: 'São Paulo/SP', cidade: 'São Paulo', uf: 'SP', bairro: 'Pinheiros',
    status: 'Adotado', imagem: 'assets/pet-nina.jpg',
    descricao: 'Nina já encontrou seu lar para sempre! Fica aqui como exemplo de uma adoção bem-sucedida.',
    temperamento: ['Independente', 'Afetuosa'],
    larIdeal: ['Lar com janelas teladas'],
    responsavel: { nome: 'ONG Gatil SP', telefone: '(11) 95555-4444', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: {
      leishmaniose: 'Não testado', vermifugo: true, v8v10: false, antirrabica: true,
      gripeCanina: false, giardia: false, v4v5: true, felv: true, castrado: true,
      vacinaPrincipal: 'V5', condicaoEspecial: '', observacoes: 'Adotada por uma família responsável.'
    }
  },
  {
    id: 6, nome: 'Ninhada da Mel', especie: 'Gato', raca: 'Sem raça definida (SRD)',
    idade: '2 meses', idadeMeses: 2, sexo: 'Variado (ninhada)',
    localizacao: 'Belo Horizonte/MG', cidade: 'Belo Horizonte', uf: 'MG', bairro: 'Funcionários',
    status: 'Disponível', imagem: 'assets/pet-ninhada.jpg',
    descricao: 'Quatro filhotes saudáveis procuram lares amorosos. Entrega após vermifugação e desmame completo.',
    temperamento: ['Brincalhões', 'Sociáveis'],
    larIdeal: ['Famílias responsáveis', 'Tutores com tempo'],
    responsavel: { nome: 'Gatil Solidário', telefone: '(31) 96666-5555', tipo: 'ONG' },
    doacao: { tipo: 'Filhotes/Ninhada', quantidade: 4 },
    fichaMedica: {
      leishmaniose: 'Não testado', vermifugo: true, v8v10: false, antirrabica: false,
      gripeCanina: false, giardia: false, v4v5: false, felv: false, castrado: false,
      vacinaPrincipal: '', condicaoEspecial: '', observacoes: 'Primeira dose de vacina agendada.'
    }
  },
  {
    id: 7, nome: 'Bidu', especie: 'Cão', raca: 'Shih Tzu',
    idade: '4 anos', idadeMeses: 48, sexo: 'Macho',
    localizacao: 'São Paulo/SP', cidade: 'São Paulo', uf: 'SP', bairro: 'Vila Mariana',
    status: 'Disponível', imagem: 'assets/pet-7.jpg',
    descricao: 'Bidu é um companheiro tranquilo, adora colo e se adapta muito bem a apartamento.',
    temperamento: ['Calmo', 'Companheiro', 'Dócil'],
    larIdeal: ['Apartamento', 'Ambiente calmo'],
    responsavel: { nome: 'ONG Amor de Patas', telefone: '(11) 95555-1111', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Negativo', vermifugo: true, v8v10: true, antirrabica: true, gripeCanina: true, giardia: false, v4v5: false, felv: false, castrado: true, vacinaPrincipal: 'V10', condicaoEspecial: '', observacoes: 'Pet saudável e sociável.' }
  },
  {
    id: 8, nome: 'Amora', especie: 'Cão', raca: 'Poodle',
    idade: '2 anos', idadeMeses: 24, sexo: 'Fêmea',
    localizacao: 'Rio de Janeiro/RJ', cidade: 'Rio de Janeiro', uf: 'RJ', bairro: 'Tijuca',
    status: 'Adotado', imagem: 'assets/pet-8.jpg',
    descricao: 'Amora já encontrou um novo lar! Exemplo de adoção feliz através do meu4patas.',
    temperamento: ['Esperta', 'Carinhosa'],
    larIdeal: ['Família presente'],
    responsavel: { nome: 'Lar Temporário do Léo', telefone: '(21) 94444-2222', tipo: 'Lar temporário' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Negativo', vermifugo: true, v8v10: true, antirrabica: true, gripeCanina: false, giardia: false, v4v5: false, felv: false, castrado: true, vacinaPrincipal: 'V10', condicaoEspecial: '', observacoes: 'Adotada por uma família responsável.' }
  },
  {
    id: 9, nome: 'Zeus', especie: 'Cão', raca: 'Pastor Alemão',
    idade: '6 meses', idadeMeses: 6, sexo: 'Macho',
    localizacao: 'Porto Alegre/RS', cidade: 'Porto Alegre', uf: 'RS', bairro: 'Moinhos de Vento',
    status: 'Disponível', imagem: 'assets/pet-9.jpg',
    descricao: 'Zeus é um filhote cheio de energia, inteligente e que aprende comandos com facilidade.',
    temperamento: ['Energético', 'Inteligente', 'Protetor'],
    larIdeal: ['Casa com quintal', 'Família ativa'],
    responsavel: { nome: 'Abrigo Patas do Sul', telefone: '(51) 93333-3333', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Negativo', vermifugo: true, v8v10: true, antirrabica: false, gripeCanina: false, giardia: false, v4v5: false, felv: false, castrado: false, vacinaPrincipal: 'V8', condicaoEspecial: '', observacoes: 'Vacinação em andamento.' }
  },
  {
    id: 10, nome: 'Mike', especie: 'Cão', raca: 'Labrador Retriever',
    idade: '3 anos', idadeMeses: 36, sexo: 'Macho',
    localizacao: 'Salvador/BA', cidade: 'Salvador', uf: 'BA', bairro: 'Barra',
    status: 'Disponível', imagem: 'assets/pet-10.jpg',
    descricao: 'Mike é dócil, brincalhão e ama água. Perfeito para famílias com crianças.',
    temperamento: ['Brincalhão', 'Dócil', 'Sociável'],
    larIdeal: ['Casa com quintal', 'Família com crianças'],
    responsavel: { nome: 'Ana Beatriz', telefone: '(71) 92222-4444', tipo: 'Pessoa física' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Negativo', vermifugo: true, v8v10: true, antirrabica: true, gripeCanina: true, giardia: false, v4v5: false, felv: false, castrado: true, vacinaPrincipal: 'V10', condicaoEspecial: '', observacoes: 'Sem observações.' }
  },
  {
    id: 11, nome: 'Frida', especie: 'Cão', raca: 'Beagle',
    idade: '1 ano', idadeMeses: 12, sexo: 'Fêmea',
    localizacao: 'Curitiba/PR', cidade: 'Curitiba', uf: 'PR', bairro: 'Batel',
    status: 'Disponível', imagem: 'assets/pet-11.jpg',
    descricao: 'Frida é curiosa, farejadora e cheia de vida. Adora passeios e novos cheiros.',
    temperamento: ['Curiosa', 'Ativa', 'Amigável'],
    larIdeal: ['Casa com quintal', 'Passeios diários'],
    responsavel: { nome: 'ONG Focinhos Felizes', telefone: '(41) 91111-5555', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Negativo', vermifugo: true, v8v10: true, antirrabica: true, gripeCanina: false, giardia: false, v4v5: false, felv: false, castrado: false, vacinaPrincipal: 'V10', condicaoEspecial: '', observacoes: 'Castração agendada.' }
  },
  {
    id: 12, nome: 'Tobias', especie: 'Cão', raca: 'Bulldog Francês',
    idade: '8 meses', idadeMeses: 8, sexo: 'Macho',
    localizacao: 'Florianópolis/SC', cidade: 'Florianópolis', uf: 'SC', bairro: 'Centro',
    status: 'Disponível', imagem: 'assets/pet-12.jpg',
    descricao: 'Tobias é um filhote brincalhão e companheiro, ideal para quem vive em apartamento.',
    temperamento: ['Brincalhão', 'Companheiro'],
    larIdeal: ['Apartamento', 'Ambiente fresco'],
    responsavel: { nome: 'Marcos Vinícius', telefone: '(48) 90000-6666', tipo: 'Pessoa física' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Não testado', vermifugo: true, v8v10: false, antirrabica: true, gripeCanina: false, giardia: false, v4v5: false, felv: false, castrado: false, vacinaPrincipal: 'V8', condicaoEspecial: 'Raça braquicefálica: evitar calor excessivo', observacoes: 'Acompanhamento respiratório recomendado.' }
  },
  {
    id: 13, nome: 'Pingo', especie: 'Cão', raca: 'Dachshund',
    idade: '5 anos', idadeMeses: 60, sexo: 'Macho',
    localizacao: 'Recife/PE', cidade: 'Recife', uf: 'PE', bairro: 'Boa Viagem',
    status: 'Indisponível', imagem: 'assets/pet-13.jpg',
    descricao: 'Pingo está em tratamento de coluna e por isso ainda não está disponível para adoção.',
    temperamento: ['Calmo', 'Carinhoso'],
    larIdeal: ['Lar sem escadas', 'Tutor paciente'],
    responsavel: { nome: 'Clínica Amigo Animal', telefone: '(81) 98888-7777', tipo: 'Lar temporário' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Negativo', vermifugo: true, v8v10: true, antirrabica: true, gripeCanina: false, giardia: false, v4v5: false, felv: false, castrado: true, vacinaPrincipal: 'V10', condicaoEspecial: 'Problema de coluna em tratamento', observacoes: 'Reavaliação em 60 dias.' }
  },
  {
    id: 14, nome: 'Maya', especie: 'Cão', raca: 'Border Collie',
    idade: '2 anos', idadeMeses: 24, sexo: 'Fêmea',
    localizacao: 'Brasília/DF', cidade: 'Brasília', uf: 'DF', bairro: 'Asa Sul',
    status: 'Disponível', imagem: 'assets/pet-14.jpg',
    descricao: 'Maya é extremamente inteligente e ativa. Precisa de estímulo mental e exercícios diários.',
    temperamento: ['Inteligente', 'Ativa', 'Leal'],
    larIdeal: ['Casa com quintal', 'Família ativa'],
    responsavel: { nome: 'ONG Cão Amigo DF', telefone: '(61) 97777-8888', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Negativo', vermifugo: true, v8v10: true, antirrabica: true, gripeCanina: true, giardia: false, v4v5: false, felv: false, castrado: true, vacinaPrincipal: 'V10', condicaoEspecial: '', observacoes: 'Muito enérgica, ideal para quem pratica atividades ao ar livre.' }
  },
  {
    id: 15, nome: 'Bartô', especie: 'Cão', raca: 'Pitbull',
    idade: '4 anos', idadeMeses: 48, sexo: 'Macho',
    localizacao: 'Fortaleza/CE', cidade: 'Fortaleza', uf: 'CE', bairro: 'Meireles',
    status: 'Disponível', imagem: 'assets/pet-15.jpg',
    descricao: 'Bartô é dócil, leal e adora carinho. Ao contrário do estigma, é um amor de cão.',
    temperamento: ['Leal', 'Dócil', 'Protetor'],
    larIdeal: ['Casa com quintal', 'Tutor experiente'],
    responsavel: { nome: 'Abrigo Recomeço CE', telefone: '(85) 96666-9999', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Negativo', vermifugo: true, v8v10: true, antirrabica: true, gripeCanina: false, giardia: false, v4v5: false, felv: false, castrado: true, vacinaPrincipal: 'V10', condicaoEspecial: '', observacoes: 'Sociável com pessoas; socialização com outros cães em andamento.' }
  },
  {
    id: 16, nome: 'Nala', especie: 'Cão', raca: 'Husky Siberiano',
    idade: '3 anos', idadeMeses: 36, sexo: 'Fêmea',
    localizacao: 'Goiânia/GO', cidade: 'Goiânia', uf: 'GO', bairro: 'Setor Bueno',
    status: 'Disponível', imagem: 'assets/pet-16.jpg',
    descricao: 'Nala é cheia de personalidade, comunicativa e adora correr. Precisa de espaço.',
    temperamento: ['Ativa', 'Independente', 'Comunicativa'],
    larIdeal: ['Casa com quintal grande', 'Tutor experiente'],
    responsavel: { nome: 'Patrícia Gomes', telefone: '(62) 95555-0000', tipo: 'Pessoa física' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Negativo', vermifugo: true, v8v10: true, antirrabica: true, gripeCanina: false, giardia: false, v4v5: false, felv: false, castrado: true, vacinaPrincipal: 'V10', condicaoEspecial: '', observacoes: 'Precisa de ambiente arejado e exercícios.' }
  },
  {
    id: 17, nome: 'Fred', especie: 'Cão', raca: 'Vira-lata',
    idade: '5 meses', idadeMeses: 5, sexo: 'Macho',
    localizacao: 'Vitória/ES', cidade: 'Vitória', uf: 'ES', bairro: 'Praia do Canto',
    status: 'Disponível', imagem: 'assets/pet-17.jpg',
    descricao: 'Fred é um filhote vira-lata resgatado da rua, saudável, dócil e muito agradecido.',
    temperamento: ['Dócil', 'Brincalhão', 'Carente'],
    larIdeal: ['Família paciente', 'Ambiente seguro'],
    responsavel: { nome: 'ONG SOS Animais ES', telefone: '(27) 94444-1212', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Não testado', vermifugo: true, v8v10: false, antirrabica: false, gripeCanina: false, giardia: false, v4v5: false, felv: false, castrado: false, vacinaPrincipal: '', condicaoEspecial: '', observacoes: 'Primeira dose de vacina aplicada.' }
  },
  {
    id: 18, nome: 'Bela', especie: 'Cão', raca: 'Yorkshire Terrier',
    idade: '7 anos', idadeMeses: 84, sexo: 'Fêmea',
    localizacao: 'Uberlândia/MG', cidade: 'Uberlândia', uf: 'MG', bairro: 'Santa Mônica',
    status: 'Disponível', imagem: 'assets/pet-18.jpg',
    descricao: 'Bela é uma idosinha tranquila que busca um lar calmo para viver com conforto e amor.',
    temperamento: ['Calma', 'Companheira'],
    larIdeal: ['Apartamento', 'Lar tranquilo'],
    responsavel: { nome: 'Lar Temporário da Cida', telefone: '(34) 93333-2121', tipo: 'Lar temporário' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Negativo', vermifugo: true, v8v10: true, antirrabica: true, gripeCanina: false, giardia: false, v4v5: false, felv: false, castrado: true, vacinaPrincipal: 'V10', condicaoEspecial: 'Idosa: acompanhamento veterinário regular', observacoes: 'Saudável para a idade.' }
  },
  {
    id: 19, nome: 'Lola', especie: 'Gato', raca: 'Persa',
    idade: '3 anos', idadeMeses: 36, sexo: 'Fêmea',
    localizacao: 'Campinas/SP', cidade: 'Campinas', uf: 'SP', bairro: 'Cambuí',
    status: 'Disponível', imagem: 'assets/pet-19.jpg',
    descricao: 'Lola é uma gata elegante e tranquila, adora um cafuné e ambientes silenciosos.',
    temperamento: ['Tranquila', 'Elegante', 'Caseira'],
    larIdeal: ['Apartamento com tela', 'Ambiente calmo'],
    responsavel: { nome: 'Gatil Sete Vidas', telefone: '(19) 92222-3434', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Não testado', vermifugo: true, v8v10: false, antirrabica: true, gripeCanina: false, giardia: false, v4v5: true, felv: false, castrado: true, vacinaPrincipal: 'V4', condicaoEspecial: 'Pelagem longa: escovação frequente', observacoes: 'FeLV negativo.' }
  },
  {
    id: 20, nome: 'Simba', especie: 'Gato', raca: 'Maine Coon',
    idade: '4 anos', idadeMeses: 48, sexo: 'Macho',
    localizacao: 'Niterói/RJ', cidade: 'Niterói', uf: 'RJ', bairro: 'Icaraí',
    status: 'Indisponível', imagem: 'assets/pet-20.jpg',
    descricao: 'Simba está em observação veterinária e ficará disponível em breve. Gato enorme e dócil.',
    temperamento: ['Dócil', 'Sociável', 'Gentil'],
    larIdeal: ['Casa ou apartamento amplo'],
    responsavel: { nome: 'Gatil Sete Vidas', telefone: '(21) 91111-5656', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Não testado', vermifugo: true, v8v10: false, antirrabica: true, gripeCanina: false, giardia: true, v4v5: true, felv: false, castrado: true, vacinaPrincipal: 'V5', condicaoEspecial: 'Tratamento de giárdia em andamento', observacoes: 'Reavaliação em 20 dias.' }
  },
  {
    id: 21, nome: 'Chico', especie: 'Gato', raca: 'Sem raça definida (SRD)',
    idade: '2 anos', idadeMeses: 24, sexo: 'Macho',
    localizacao: 'Manaus/AM', cidade: 'Manaus', uf: 'AM', bairro: 'Adrianópolis',
    status: 'Disponível', imagem: 'assets/pet-21.jpg',
    descricao: 'Chico é um gato laranja brincalhão e safado no bom sentido. Adora caixas e janelas.',
    temperamento: ['Brincalhão', 'Curioso', 'Sociável'],
    larIdeal: ['Apartamento com tela', 'Brinquedos'],
    responsavel: { nome: 'Rafael Souza', telefone: '(92) 90000-7878', tipo: 'Pessoa física' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Não testado', vermifugo: true, v8v10: false, antirrabica: true, gripeCanina: false, giardia: false, v4v5: true, felv: false, castrado: true, vacinaPrincipal: 'V4', condicaoEspecial: '', observacoes: 'FeLV negativo.' }
  },
  {
    id: 22, nome: 'Pretinha', especie: 'Gato', raca: 'Sem raça definida (SRD)',
    idade: '1 ano', idadeMeses: 12, sexo: 'Fêmea',
    localizacao: 'Belém/PA', cidade: 'Belém', uf: 'PA', bairro: 'Umarizal',
    status: 'Disponível', imagem: 'assets/pet-22.jpg',
    descricao: 'Pretinha é uma gata preta carinhosa que quebra superstições com muito amor e ronrons.',
    temperamento: ['Carinhosa', 'Caseira', 'Dócil'],
    larIdeal: ['Apartamento com tela', 'Lar amoroso'],
    responsavel: { nome: 'ONG Gato Feliz PA', telefone: '(91) 98888-1313', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Não testado', vermifugo: true, v8v10: false, antirrabica: true, gripeCanina: false, giardia: false, v4v5: true, felv: false, castrado: false, vacinaPrincipal: 'V4', condicaoEspecial: '', observacoes: 'Castração agendada.' }
  },
  {
    id: 23, nome: 'Aurora', especie: 'Gato', raca: 'Ragdoll',
    idade: '2 anos', idadeMeses: 24, sexo: 'Fêmea',
    localizacao: 'Cuiabá/MT', cidade: 'Cuiabá', uf: 'MT', bairro: 'Centro-Sul',
    status: 'Disponível', imagem: 'assets/pet-23.jpg',
    descricao: 'Aurora é uma gata super dócil e relaxada, fica molinha no colo como uma boneca de pano.',
    temperamento: ['Dócil', 'Calma', 'Apegada'],
    larIdeal: ['Ambiente calmo', 'Família presente'],
    responsavel: { nome: 'Gatil Solidário', telefone: '(65) 97777-1414', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Não testado', vermifugo: true, v8v10: false, antirrabica: true, gripeCanina: false, giardia: false, v4v5: true, felv: false, castrado: true, vacinaPrincipal: 'V5', condicaoEspecial: '', observacoes: 'Pelagem longa: escovação frequente.' }
  },
  {
    id: 24, nome: 'Tom', especie: 'Gato', raca: 'Sphynx',
    idade: '3 anos', idadeMeses: 36, sexo: 'Macho',
    localizacao: 'Campo Grande/MS', cidade: 'Campo Grande', uf: 'MS', bairro: 'Centro',
    status: 'Disponível', imagem: 'assets/pet-24.jpg',
    descricao: 'Tom é um gato sem pelo, quentinho e extremamente apegado. Precisa de proteção solar e do frio.',
    temperamento: ['Apegado', 'Sociável', 'Ativo'],
    larIdeal: ['Ambiente protegido do frio e do sol'],
    responsavel: { nome: 'Juliana Martins', telefone: '(67) 96666-1515', tipo: 'Pessoa física' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Não testado', vermifugo: true, v8v10: false, antirrabica: true, gripeCanina: false, giardia: false, v4v5: true, felv: false, castrado: true, vacinaPrincipal: 'V4', condicaoEspecial: 'Sem pelos: cuidados com temperatura e pele', observacoes: 'Banhos periódicos recomendados.' }
  },
  {
    id: 25, nome: 'Mimi', especie: 'Gato', raca: 'Angorá',
    idade: '6 meses', idadeMeses: 6, sexo: 'Fêmea',
    localizacao: 'Natal/RN', cidade: 'Natal', uf: 'RN', bairro: 'Ponta Negra',
    status: 'Disponível', imagem: 'assets/pet-25.jpg',
    descricao: 'Mimi é uma filhotinha fofa e brincalhona, cheia de energia e pronta para um novo lar.',
    temperamento: ['Brincalhona', 'Curiosa', 'Carinhosa'],
    larIdeal: ['Apartamento com tela', 'Brinquedos'],
    responsavel: { nome: 'ONG Mia Resgate', telefone: '(84) 95555-1616', tipo: 'ONG' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Não testado', vermifugo: true, v8v10: false, antirrabica: false, gripeCanina: false, giardia: false, v4v5: false, felv: false, castrado: false, vacinaPrincipal: '', condicaoEspecial: '', observacoes: 'Primeira dose de vacina agendada.' }
  },
  {
    id: 26, nome: 'Bigode', especie: 'Gato', raca: 'Bengal',
    idade: '2 anos', idadeMeses: 24, sexo: 'Macho',
    localizacao: 'João Pessoa/PB', cidade: 'João Pessoa', uf: 'PB', bairro: 'Manaíra',
    status: 'Disponível', imagem: 'assets/pet-26.jpg',
    descricao: 'Bigode é ágil, atlético e adora escalar. Tem energia de sobra e adora interagir.',
    temperamento: ['Ativo', 'Esperto', 'Brincalhão'],
    larIdeal: ['Ambiente com prateleiras e arranhadores'],
    responsavel: { nome: 'Lar Temporário do Pedro', telefone: '(83) 94444-1717', tipo: 'Lar temporário' },
    doacao: { tipo: 'Pet individual', quantidade: 1 },
    fichaMedica: { leishmaniose: 'Não testado', vermifugo: true, v8v10: false, antirrabica: true, gripeCanina: false, giardia: false, v4v5: true, felv: false, castrado: true, vacinaPrincipal: 'V5', condicaoEspecial: '', observacoes: 'Gato muito ativo, precisa de enriquecimento ambiental.' }
  }
];

/* ===========================================================
   3. ESTADO DA APLICAÇÃO
=========================================================== */
const state = {
  pets: [],
  user: null,
  contas: [],
  interesses: [],
  recusas: [],
  interessados: [],   // registro de quem demonstrou interesse: {petId, nome, telefone, email, data}
  activeFilter: 'todos',
  searchTerm: '',
  currentExploreId: null,
  geo: null,         // {lat, lng} da geolocalização do navegador (quando concedida)
  editingPetId: null, // id do pet em edição (modo editar do formulário de pet)
  pendingImage: ''   // dataURL da imagem selecionada no cadastro de pet
};

/* atalhos de seletor */
const $id = (id) => document.getElementById(id);

/* ===========================================================
   4. PERSISTÊNCIA (localStorage)
=========================================================== */
function loadPets() {
  const versaoOk = localStorage.getItem(LS.versao) === DATA_VERSION;
  const salvos = localStorage.getItem(LS.pets);
  if (versaoOk && salvos) {
    state.pets = safeParse(salvos, clone(INITIAL_PETS));
  } else {
    state.pets = clone(INITIAL_PETS);
    localStorage.setItem(LS.versao, DATA_VERSION);
  }
  savePets();
}

function savePets() {
  localStorage.setItem(LS.pets, JSON.stringify(state.pets));
}

function loadUser() {
  state.user = safeParse(localStorage.getItem(LS.usuario), null);
  state.contas = safeParse(localStorage.getItem(LS.contas), []);
  state.interesses = safeParse(localStorage.getItem(LS.interesses), []);
  state.recusas = safeParse(localStorage.getItem(LS.recusas), []);
  state.interessados = safeParse(localStorage.getItem(LS.interessados), []);

  // Migração suave: garante que a sessão atual também conste na lista de contas.
  if (state.user && state.user.email && !findConta(state.user.email)) upsertConta(state.user);
}

function saveUser() {
  localStorage.setItem(LS.usuario, JSON.stringify(state.user));
}

/* ── CONTAS (login) ──
   Mantém todas as contas cadastradas, separadas da sessão atual (LS.usuario),
   para permitir logout/login sem perder a conta. */
function saveContas() {
  localStorage.setItem(LS.contas, JSON.stringify(state.contas));
}
function findConta(email) {
  const alvo = (email || '').toLowerCase();
  return (state.contas || []).find(c => (c.email || '').toLowerCase() === alvo) || null;
}
/* Insere ou atualiza a conta pelo e-mail (opcionalmente trocando um e-mail antigo). */
function upsertConta(user, oldEmail) {
  if (!user || !user.email) return;
  const alvo = (oldEmail || user.email).toLowerCase();
  state.contas = (state.contas || []).filter(c => (c.email || '').toLowerCase() !== alvo);
  // remove também eventual duplicata do novo e-mail antes de inserir
  state.contas = state.contas.filter(c => (c.email || '').toLowerCase() !== user.email.toLowerCase());
  state.contas.push(clone(user));
  saveContas();
}

/* aliases com os nomes usados em outras partes da especificação */
const carregarUsuario = loadUser;
function salvarUsuario(usuario) { if (usuario) state.user = usuario; saveUser(); }

function saveInteresses()   { localStorage.setItem(LS.interesses, JSON.stringify(state.interesses)); }
function saveRecusas()      { localStorage.setItem(LS.recusas, JSON.stringify(state.recusas)); }
function saveInteressados() { localStorage.setItem(LS.interessados, JSON.stringify(state.interessados)); }

/* helpers */
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function safeParse(str, fallback) { try { return str ? JSON.parse(str) : fallback; } catch (e) { return fallback; } }
function getPet(id) { return state.pets.find(p => p.id === id); }
function deletePet(id) { state.pets = state.pets.filter(p => p.id !== id); savePets(); }
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Normaliza texto para busca: ignora acentos, caixa e espaços nas pontas.
   Ex.: "Cão" e "cao" passam a ser equivalentes. */
function normalizarTexto(texto) {
  return String(texto == null ? '' : texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/* ===========================================================
   5. USUÁRIO
=========================================================== */
function isUserRegistered() {
  return !!state.user;
}

function updateUserStatus() {
  const logged = isUserRegistered();
  const nameEl = $id('navUserName');
  const btnAuth = $id('btnAuth');
  const btnLogin = $id('btnLogin');
  const userMenu = $id('userMenu');

  if (nameEl && logged) nameEl.textContent = (state.user.nome || '').split(' ')[0];
  if (btnAuth) btnAuth.hidden = logged;        // "Criar conta" só quando deslogado
  if (btnLogin) btnLogin.hidden = logged;      // "Entrar" só quando deslogado
  if (userMenu) userMenu.hidden = !logged;     // chip + dropdown só quando logado

  // Botão "Fazer cadastro" do hero vira "Minha conta" para quem já tem conta
  const heroCad = $id('heroCadastroLink');
  if (heroCad) {
    heroCad.href = logged ? 'perfil.html' : 'cadastro.html';
    heroCad.textContent = logged ? 'Minha conta' : 'Fazer cadastro';
  }
}

/* ── CPF / E-MAIL ── */
function limparCPF(cpf) {
  return String(cpf == null ? '' : cpf).replace(/\D/g, '');
}

function aplicarMascaraCPF(cpf) {
  const numeros = limparCPF(cpf).slice(0, 11);
  return numeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function validarCPF(cpf) {
  const numeros = limparCPF(cpf);
  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false; // todos os dígitos iguais

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(numeros.charAt(i), 10) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(numeros.charAt(i), 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(numeros.charAt(10), 10);
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

/* Aplica máscara de CPF em tempo real nos inputs informados (por id). */
function configurarMascaraCPF(ids) {
  (ids || ['u_cpf']).forEach((id) => {
    const el = $id(id);
    if (!el || el._cpfMasked) return;
    el._cpfMasked = true;
    el.setAttribute('maxlength', '14');
    el.addEventListener('input', () => {
      el.value = aplicarMascaraCPF(el.value);
      el.classList.remove('input-error');
    });
  });
}

/* ── TELEFONE ── */
function limparTelefone(tel) {
  return String(tel == null ? '' : tel).replace(/\D/g, '');
}

function aplicarMascaraTelefone(tel) {
  const n = limparTelefone(tel).slice(0, 11);
  if (n.length === 0) return '';
  if (n.length <= 2) return '(' + n;
  if (n.length <= 6) return '(' + n.slice(0, 2) + ') ' + n.slice(2);
  if (n.length <= 10) return '(' + n.slice(0, 2) + ') ' + n.slice(2, 6) + '-' + n.slice(6);  // fixo: (XX) XXXX-XXXX
  return '(' + n.slice(0, 2) + ') ' + n.slice(2, 7) + '-' + n.slice(7);                       // celular: (XX) XXXXX-XXXX
}

function validarTelefone(tel) {
  const n = limparTelefone(tel);
  if (n.length !== 10 && n.length !== 11) return false;       // fixo (10) ou celular (11)
  if (n.charAt(0) === '0') return false;                      // DDD não começa com 0
  if (n.length === 11 && n.charAt(2) !== '9') return false;   // celular tem 9 após o DDD
  return true;
}

/* Aplica máscara de telefone em tempo real nos inputs informados (por id). */
function configurarMascaraTelefone(ids) {
  (ids || []).forEach((id) => {
    const el = $id(id);
    if (!el || el._telMasked) return;
    el._telMasked = true;
    el.setAttribute('maxlength', '15');
    el.addEventListener('input', () => {
      el.value = aplicarMascaraTelefone(el.value);
      el.classList.remove('input-error');
    });
  });
}

/* ── CEP / ENDEREÇO (busca automática via ViaCEP) ── */
function aplicarMascaraCep(value) {
  const n = String(value == null ? '' : value).replace(/\D/g, '').slice(0, 8);
  return n.length <= 5 ? n : n.slice(0, 5) + '-' + n.slice(5);
}

function validarCep(cep) {
  return String(cep == null ? '' : cep).replace(/\D/g, '').length === 8;
}

/* Preenche um campo (input/select) de endereço, se existir e houver valor. */
function preencherEndereco(id, value) {
  const el = $id(id);
  if (!el || !value) return;
  el.value = value;
  el.classList.remove('input-error');
}

/* Consulta o ViaCEP e completa cidade / UF / bairro automaticamente. */
function buscarCep(cepNum, campos, cepEl) {
  if (cepEl._buscandoCep) return;
  cepEl._buscandoCep = true;
  showToast('Buscando endereço pelo CEP...', 'info');
  fetch(`https://viacep.com.br/ws/${cepNum}/json/`)
    .then(r => r.json())
    .then(data => {
      if (data.erro) {
        cepEl.classList.add('input-error');
        showToast('CEP não encontrado. Verifique o número ou preencha o endereço manualmente.', 'warning');
        return;
      }
      preencherEndereco(campos.cidade, data.localidade);
      preencherEndereco(campos.uf, data.uf);
      preencherEndereco(campos.bairro, data.bairro);
      showToast('Endereço preenchido pelo CEP. ✅', 'success');
      const bairroEl = $id(campos.bairro);
      if (bairroEl && !data.bairro) bairroEl.focus(); // ViaCEP nem sempre retorna o bairro
    })
    .catch(() => showToast('Não foi possível buscar o CEP agora. Preencha o endereço manualmente.', 'warning'))
    .finally(() => { cepEl._buscandoCep = false; });
}

/* Liga máscara + busca automática (ao completar 8 dígitos) a um campo de CEP. */
function configurarBuscaCep(cepId, campos) {
  const el = $id(cepId);
  if (!el || el._cepBound) return;
  el._cepBound = true;
  el.setAttribute('maxlength', '9');
  el.setAttribute('inputmode', 'numeric');
  el.addEventListener('input', () => {
    el.value = aplicarMascaraCep(el.value);
    el.classList.remove('input-error');
    const num = el.value.replace(/\D/g, '');
    if (num.length === 8 && num !== el._ultimoCep) {
      el._ultimoCep = num;
      buscarCep(num, campos, el);
    } else if (num.length < 8) {
      el._ultimoCep = '';
    }
  });
}

/* Lista de UFs reutilizável (cadastro e edição de perfil). */
const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

/* ── COORDENADAS PARA O MAPA (perto de você) ──
   Capitais por UF (fallback) + cidades específicas do catálogo que não são capitais. */
const UF_COORDS = {
  AC:[-9.9747,-67.8100], AL:[-9.6498,-35.7089], AP:[0.0349,-51.0694], AM:[-3.1190,-60.0217],
  BA:[-12.9714,-38.5014], CE:[-3.7319,-38.5267], DF:[-15.7939,-47.8828], ES:[-20.3155,-40.3128],
  GO:[-16.6869,-49.2648], MA:[-2.5391,-44.2829], MT:[-15.6014,-56.0979], MS:[-20.4697,-54.6201],
  MG:[-19.9167,-43.9345], PA:[-1.4558,-48.4902], PB:[-7.1195,-34.8450], PR:[-25.4284,-49.2733],
  PE:[-8.0476,-34.8770], PI:[-5.0892,-42.8019], RJ:[-22.9068,-43.1729], RN:[-5.7945,-35.2110],
  RS:[-30.0346,-51.2177], RO:[-8.7619,-63.9039], RR:[2.8235,-60.6758], SC:[-27.5949,-48.5482],
  SP:[-23.5505,-46.6333], SE:[-10.9472,-37.0731], TO:[-10.1840,-48.3336]
};
const CITY_COORDS = {
  'campinas/sp':[-22.9056,-47.0608],
  'niteroi/rj':[-22.8832,-43.1034],
  'contagem/mg':[-19.9320,-44.0539],
  'uberlandia/mg':[-18.9186,-48.2772]
};

/* Retorna [lat, lng] de uma cidade/UF, ou null se desconhecida. */
function cityLatLng(cidade, uf) {
  const key = normalizarTexto(cidade) + '/' + String(uf || '').toLowerCase();
  return CITY_COORDS[key] || UF_COORDS[String(uf || '').toUpperCase()] || null;
}
/* Coord. do pet com um leve deslocamento determinístico (evita marcadores empilhados). */
function petLatLng(pet) {
  const base = cityLatLng(pet.cidade, pet.uf);
  if (!base) return null;
  const id = Number(pet.id) || 0;
  const j1 = ((id * 73) % 100) / 100 - 0.5;
  const j2 = ((id * 137) % 100) / 100 - 0.5;
  return [base[0] + j1 * 0.05, base[1] + j2 * 0.05];
}
function optionsHtml(values, selected) {
  return values.map(v => `<option${v === selected ? ' selected' : ''}>${escapeHtml(v)}</option>`).join('');
}

/* ── DATA (dd/mm/aaaa) ──
   O campo de nascimento é texto digitável com máscara; o valor é guardado em ISO. */

/* Máscara progressiva enquanto digita: 31/12/1990. */
function aplicarMascaraData(value) {
  const n = String(value == null ? '' : value).replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return n.slice(0, 2) + '/' + n.slice(2);
  return n.slice(0, 2) + '/' + n.slice(2, 4) + '/' + n.slice(4);
}

/* Interpreta "dd/mm/aaaa" (ou "yyyy-mm-dd" legado) e devolve um Date válido ou null. */
function parseDataBR(str) {
  if (!str) return null;
  const s = String(str).trim();
  let d, m, y, mt;
  if ((mt = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) { d = +mt[1]; m = +mt[2]; y = +mt[3]; }
  else if ((mt = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
  else return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  // rejeita datas inexistentes (ex.: 31/02 "transbordaria" para março)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

/* Data válida para nascimento: real, não futura e a partir de 1900. */
function validarData(str) {
  const d = parseDataBR(str);
  if (!d) return false;
  if (d > new Date()) return false;
  if (d.getFullYear() < 1900) return false;
  return true;
}

/* Converte "dd/mm/aaaa" para "yyyy-mm-dd" (formato de armazenamento). '' se inválida. */
function dataParaISO(str) {
  const d = parseDataBR(str);
  if (!d) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/* Aplica a máscara de data em tempo real nos inputs informados (por id). */
function configurarMascaraData(ids) {
  (ids || []).forEach((id) => {
    const el = $id(id);
    if (!el || el._dataMasked) return;
    el._dataMasked = true;
    el.setAttribute('maxlength', '10');
    el.setAttribute('inputmode', 'numeric');
    el.addEventListener('input', () => {
      el.value = aplicarMascaraData(el.value);
      el.classList.remove('input-error');
    });
  });
}

function calcIdade(dataNascimento) {
  const nasc = parseDataBR(dataNascimento);
  if (!nasc) return NaN;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}
/* alias com o nome usado em outras partes da especificação */
const calcularIdade = calcIdade;

function validateUserForm() {
  const f = $id('userForm');
  const get = (name) => (f.elements[name] ? f.elements[name].value.trim() : '');
  const errors = [];

  const nome = get('nome');
  const cpf = get('cpf');
  const email = get('email');
  const telefone = get('telefone');
  const nascimento = get('nascimento');
  const cidade = get('cidade');
  const uf = get('uf');
  const bairro = get('bairro');
  const moradia = get('moradia');
  const outrosAnimais = get('outrosAnimais');
  const jaAdotou = get('jaAdotou');
  const cep = get('cep');
  const senha = get('senha');
  const confirmaSenha = get('confirmaSenha');
  const termos = f.elements['termos'].checked;

  const cpfValido = validarCPF(cpf);
  const emailValido = validarEmail(email);
  const telValido = validarTelefone(telefone);
  const dataValida = validarData(nascimento);
  if (f.elements['cpf']) f.elements['cpf'].classList.toggle('input-error', !!cpf && !cpfValido);
  if (f.elements['email']) f.elements['email'].classList.toggle('input-error', !!email && !emailValido);
  if (f.elements['telefone']) f.elements['telefone'].classList.toggle('input-error', !!telefone && !telValido);
  if (f.elements['nascimento']) f.elements['nascimento'].classList.toggle('input-error', !!nascimento && !dataValida);

  if (!nome) errors.push('Informe o nome completo.');
  if (!cpf) errors.push('Informe o CPF.');
  else if (!cpfValido) errors.push('CPF inválido. Verifique os números informados.');
  if (!emailValido) errors.push('Informe um e-mail válido.');
  if (!telefone) errors.push('Informe o telefone / WhatsApp.');
  else if (!telValido) errors.push('Telefone inválido. Use DDD + número, ex.: (31) 99999-9999.');
  if (!cidade) errors.push('Informe a cidade.');
  if (!uf) errors.push('Selecione a UF.');
  if (!bairro) errors.push('Informe o bairro.');
  if (!moradia) errors.push('Selecione o tipo de moradia.');
  if (!outrosAnimais) errors.push('Informe se possui outros animais.');
  if (!jaAdotou) errors.push('Informe se já adotou antes.');

  if (!nascimento) errors.push('Informe a data de nascimento.');
  else if (!dataValida) errors.push('Data de nascimento inválida. Use o formato dd/mm/aaaa.');
  // Obs.: a idade mínima de 21 anos é exigida para DEMONSTRAR INTERESSE (ver
  // usuarioPodeEnviarInteresse). O cadastro em si é permitido (ex.: para doar).

  if (senha.length < 6) errors.push('A senha deve ter no mínimo 6 caracteres.');
  if (senha !== confirmaSenha) errors.push('A confirmação de senha não confere.');
  if (emailValido && findConta(email)) errors.push('Este e-mail já está cadastrado. Faça login para entrar na sua conta.');
  if (!termos) errors.push('É preciso aceitar os termos de adoção responsável.');

  return { valid: errors.length === 0, message: errors[0] || '', errors };
}

function handleUserSubmit(event) {
  event.preventDefault();
  const f = event.target;
  const errBox = $id('userFormError');
  const result = validateUserForm();

  if (!result.valid) {
    errBox.textContent = result.message;
    showToast(result.message, 'error');
    return;
  }
  errBox.textContent = '';

  const get = (name) => (f.elements[name] ? f.elements[name].value.trim() : '');
  const idadeUser = calcIdade(get('nascimento'));
  state.user = {
    tipoCadastro: get('tipoCadastro'),
    nome: get('nome'),
    cpf: aplicarMascaraCPF(get('cpf')),
    cpfLimpo: limparCPF(get('cpf')),
    email: get('email'),
    telefone: aplicarMascaraTelefone(get('telefone')),
    nascimento: dataParaISO(get('nascimento')),
    idade: isNaN(idadeUser) ? null : idadeUser,
    maior21: !isNaN(idadeUser) && idadeUser >= IDADE_MINIMA_ADOCAO,
    cep: aplicarMascaraCep(get('cep')),
    cidade: get('cidade'),
    uf: get('uf'),
    bairro: get('bairro'),
    moradia: get('moradia'),
    outrosAnimais: get('outrosAnimais'),
    jaAdotou: get('jaAdotou'),
    senha: get('senha'),
    aceitaTermos: f.elements['termos'] ? f.elements['termos'].checked : true,
    cadastradoEm: new Date().toISOString()
  };
  saveUser();
  upsertConta(state.user);   // registra a conta para permitir login depois
  updateUserStatus();
  if (state.user.maior21) {
    showToast(`Cadastro concluído! Bem-vindo(a), ${state.user.nome.split(' ')[0]} 🐾`, 'success');
  } else {
    showToast('Cadastro realizado, mas não habilitado para demonstrar interesse. A idade mínima exigida é 21 anos.', 'warning');
  }

  // atualiza a tela atual (caso o form esteja na mesma página) e volta ao explorar
  renderCurrentPet();   // libera o botão "Tenho interesse"
  renderPetLists();     // o filtro "perto de você" pode passar a valer
  setTimeout(() => { window.location.href = 'index.html#explorar'; }, 1000);
}

/* ===========================================================
   6. BUSCA E FILTROS
=========================================================== */
const REGION_RADIUS_KM = 500; // raio que define a "região" perto de você

/* Distância em km entre dois pontos [lat, lng] (fórmula de Haversine). */
function haversineKm(a, b) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* Origem do usuário: localização do navegador (se concedida) ou a cidade cadastrada. */
function userOrigin() {
  if (state.geo) return [state.geo.lat, state.geo.lng];
  if (isUserRegistered()) return cityLatLng(state.user.cidade, state.user.uf);
  return null;
}

/* O pet está na região do usuário? Sem origem conhecida, não esconde nada (mostra todos). */
function isNearUser(pet) {
  const origin = userOrigin();
  if (!origin) return true;
  const ll = cityLatLng(pet.cidade, pet.uf);
  if (!ll) return false;
  return haversineKm(origin, ll) <= REGION_RADIUS_KM;
}

function matchesSearch(pet, term) {
  if (!term) return true;
  // busca em vários campos, ignorando acentos e caixa (term já vem normalizado)
  const haystack = normalizarTexto([
    pet.nome, pet.especie, pet.raca, pet.cidade, pet.uf, pet.bairro, pet.status,
    pet.descricao,
    (pet.temperamento || []).join(' '),
    (pet.larIdeal || []).join(' '),
    pet.doacao ? pet.doacao.tipo : ''
  ].join(' '));
  return haystack.includes(term);
}

function matchesFilter(pet, filter) {
  switch (filter) {
    case 'todos':         return true;
    case 'caes':          return pet.especie === 'Cão';
    case 'gatos':         return pet.especie === 'Gato';
    case 'filhotes':      return Number(pet.idadeMeses) <= FILHOTE_MAX_MESES;
    case 'adultos':       return Number(pet.idadeMeses) > FILHOTE_MAX_MESES;
    case 'disponiveis':   return pet.status === 'Disponível';
    case 'indisponiveis': return pet.status === 'Indisponível';
    case 'adotados':      return pet.status === 'Adotado';
    case 'perto':         return isNearUser(pet);
    default:              return true;
  }
}

function filterPets() {
  const term = normalizarTexto(state.searchTerm);
  return state.pets.filter(pet => matchesSearch(pet, term) && matchesFilter(pet, state.activeFilter));
}

function setActiveFilter(filterName) {
  state.activeFilter = filterName;

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.filter === filterName);
  });

  renderPetLists();
  renderCurrentPet();

  // O mapa vive dentro do botão "Perto de você": só aparece com esse filtro ativo.
  const mapEl = $id('mapa');
  const isPerto = filterName === 'perto';
  if (mapEl) mapEl.hidden = !isPerto;

  if (isPerto) {
    ensureGeoForRegion();   // tenta a localização real para mostrar os pets da sua região
    renderMap(true);
    // Leva o usuário direto para o mapa e recalcula o tamanho (saiu do estado oculto).
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (_map) setTimeout(() => _map.invalidateSize(), 350);
    }
  }
}

/* Pede a localização do navegador (uma vez) para filtrar a lista pela região do usuário. */
function ensureGeoForRegion() {
  if (state.geo || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      renderPetLists();
      renderCurrentPet();
      if (state.activeFilter === 'perto') renderMap(true); // re-centra na sua localização
    },
    () => {}, // permissão negada: mantém o fallback (cidade cadastrada ou todos)
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
  );
}

/* ===========================================================
   7. EXPLORAR PETS (estilo Tinder)
=========================================================== */
function buildExploreQueue() {
  return filterPets()
    .filter(p => p.status === 'Disponível')
    .filter(p => !state.recusas.includes(p.id))
    .filter(p => !state.interesses.includes(p.id))
    .map(p => p.id);
}

function vacinaPrincipal(pet) {
  const fm = pet.fichaMedica || {};
  if (fm.vacinaPrincipal) return { label: fm.vacinaPrincipal, yes: true };
  if (fm.v8v10) return { label: 'V8/V10', yes: true };
  if (fm.v4v5) return { label: 'V4/V5', yes: true };
  return { label: 'pendente', yes: false };
}

function medTag(label, kind) {
  const icon = kind === 'yes' ? '✓' : kind === 'warn' ? '!' : '—';
  return `<span class="med-tag med-tag--${kind}">${icon} ${escapeHtml(label)}</span>`;
}

function medSummaryHtml(pet) {
  const fm = pet.fichaMedica || {};
  const tags = [];
  if (/negativ/i.test(fm.leishmaniose)) tags.push(medTag('Leish.: negativo', 'yes'));
  else if (/positiv|tratamento/i.test(fm.leishmaniose)) tags.push(medTag('Leish.: tratamento', 'warn'));
  else tags.push(medTag('Leish.: não testado', 'no'));
  tags.push(medTag('Vermífugo', fm.vermifugo ? 'yes' : 'no'));
  tags.push(medTag('Antirrábica', fm.antirrabica ? 'yes' : 'no'));
  tags.push(medTag('Castrado', fm.castrado ? 'yes' : 'no'));
  const vac = vacinaPrincipal(pet);
  tags.push(medTag('Vacina: ' + vac.label, vac.yes ? 'yes' : 'no'));
  return tags.join('');
}

function statusBadgeClass(status) {
  if (status === 'Disponível') return 'badge-ok';
  if (status === 'Indisponível') return 'badge-warn';
  return 'badge-adopt';
}

function renderCurrentPet() {
  const stage = $id('exploreStage');
  const actions = $id('exploreActions');
  if (!stage) return;

  const queue = buildExploreQueue();

  if (queue.length === 0) {
    if (actions) actions.style.display = 'none';
    state.currentExploreId = null;
    const semRegiao = state.activeFilter === 'perto' && userOrigin();
    stage.innerHTML = `
      <div class="explore-empty">
        <div class="explore-empty-emoji">🐾</div>
        <h3>${semRegiao ? 'Nenhum pet na sua região' : 'Nenhum pet por aqui'}</h3>
        <p>${semRegiao
          ? 'Não há pets disponíveis perto de você no momento. Tente ampliar a busca ou ver todos os pets.'
          : 'Não há pets disponíveis para os filtros atuais. Tente outra busca, mude os filtros ou cadastre um novo pet.'}</p>
        <button class="btn-primary" type="button" data-reset-filter>Ver todos os pets</button>
      </div>`;
    const resetBtn = stage.querySelector('[data-reset-filter]');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      const term = $id('searchInput'); if (term) term.value = '';
      state.searchTerm = '';
      setActiveFilter('todos');
    });
    return;
  }

  if (actions) actions.style.display = 'flex';
  if (!queue.includes(state.currentExploreId)) state.currentExploreId = queue[0];

  const pet = getPet(state.currentExploreId);
  const temper = (pet.temperamento || []).map(t => `<span class="tag tag--temper">${escapeHtml(t)}</span>`).join('');
  const qtd = pet.doacao && pet.doacao.tipo === 'Filhotes/Ninhada'
    ? ` · ${pet.doacao.quantidade} filhotes` : '';

  stage.innerHTML = `
    <article class="explore-card" id="exploreCard">
      <div class="explore-card-img">
        <img src="${escapeHtml(pet.imagem)}" alt="${escapeHtml(pet.nome)}" onerror="this.src='assets/luna-hero.png'">
        <span class="explore-card-status ${statusBadgeClass(pet.status)}">${escapeHtml(pet.status)}</span>
      </div>
      <div class="explore-card-body">
        <div class="explore-card-head">
          <div>
            <div class="explore-card-name">${escapeHtml(pet.nome)}</div>
            <div class="explore-card-sub">${escapeHtml(pet.especie)} · ${escapeHtml(pet.raca)} · ${escapeHtml(pet.sexo)}${qtd}</div>
          </div>
          <span class="explore-card-age">${escapeHtml(pet.idade)}</span>
        </div>
        <div class="explore-card-loc">📍 ${escapeHtml(pet.localizacao)}${pet.bairro ? ' · ' + escapeHtml(pet.bairro) : ''}</div>
        <p class="explore-card-desc">${escapeHtml(pet.descricao)}</p>
        <div class="tag-row">${temper}</div>
        <div class="med-summary">${medSummaryHtml(pet)}</div>
      </div>
    </article>`;
}

function advanceExplore(direction) {
  const card = $id('exploreCard');
  const cls = direction === 'right' ? 'swipe-right' : 'swipe-left';
  if (card) {
    card.classList.add(cls);
    setTimeout(renderCurrentPet, 280);
  } else {
    renderCurrentPet();
  }
}

function nextPet() {
  const queue = buildExploreQueue();
  if (queue.length === 0) { renderCurrentPet(); return; }
  const i = queue.indexOf(state.currentExploreId);
  state.currentExploreId = queue[(i + 1) % queue.length];
  renderCurrentPet();
}

function registerRefusal(petId) {
  if (!petId) return;
  if (!state.recusas.includes(petId)) {
    state.recusas.push(petId);
    saveRecusas();
  }
  advanceExplore('left');
}

/* Regras para alguém poder DEMONSTRAR INTERESSE:
   1) estar cadastrado;  2) ter 21 anos ou mais;  3) ter aceitado os termos. */
function usuarioPodeEnviarInteresse() {
  const u = state.user;

  if (!u) {
    showToast('Para demonstrar interesse neste pet, faça seu cadastro primeiro.', 'warning');
    setTimeout(() => { window.location.href = 'cadastro.html'; }, 1000);
    return false;
  }

  const idade = (typeof u.idade === 'number' && !isNaN(u.idade)) ? u.idade : calcIdade(u.nascimento);
  if (isNaN(idade) || idade < IDADE_MINIMA_ADOCAO) {
    showToast('Para demonstrar interesse em adoção, é necessário ter 21 anos ou mais.', 'error');
    return false;
  }

  if (u.aceitaTermos === false) {
    showToast('Para demonstrar interesse, é necessário aceitar os termos de adoção responsável.', 'warning');
    return false;
  }

  return true;
}

function registerInterest(petId) {
  if (!petId) return;

  if (!usuarioPodeEnviarInteresse()) {
    closePetDetails();
    return;
  }

  const pet = getPet(petId);

  // já demonstrou interesse antes?
  if (state.interesses.includes(petId)) {
    showToast('Você já demonstrou interesse neste pet.', 'info');
    closePetDetails();
    renderCurrentPet();
    return;
  }

  // registra o interesse (NÃO altera o status do pet)
  state.interesses.push(petId);
  saveInteresses();

  // registra quem demonstrou interesse, para o responsável pelo pet poder ver
  const jaRegistrado = state.interessados.some(r => r.petId === petId && r.email === state.user.email);
  if (!jaRegistrado) {
    state.interessados.push({
      petId: petId,
      nome: state.user.nome,
      telefone: state.user.telefone || '',
      email: state.user.email,
      data: new Date().toISOString()
    });
    saveInteressados();
  }

  showToast(`Interesse registrado em ${pet ? pet.nome : 'pet'}. A ONG ou responsável poderá entrar em contato para dar continuidade ao processo. 💛`, 'success');

  const modalAberto = !$id('modalOverlay').hidden;
  closePetDetails();
  if (modalAberto && state.currentExploreId !== petId) {
    renderCurrentPet();
  } else {
    advanceExplore('right');
  }
  renderPetLists();
}

/* ===========================================================
   8. LISTAGEM DE PETS (cards menores)
=========================================================== */
function petCardHtml(pet) {
  const tags = (pet.temperamento || []).slice(0, 3)
    .map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  return `
    <div class="pet-card">
      <div class="pet-card-img">
        <img src="${escapeHtml(pet.imagem)}" alt="${escapeHtml(pet.nome)}" onerror="this.src='assets/luna-hero.png'">
        <span class="pet-card-badge ${statusBadgeClass(pet.status)}">${escapeHtml(pet.status)}</span>
      </div>
      <div class="pet-card-body">
        <div class="pet-card-head">
          <div>
            <div class="pet-card-name">${escapeHtml(pet.nome)}</div>
            <div class="pet-card-breed">${escapeHtml(pet.especie)} · ${escapeHtml(pet.raca)}</div>
          </div>
          <span class="pet-card-age">${escapeHtml(pet.idade)}</span>
        </div>
        <div class="pet-card-loc">📍 ${escapeHtml(pet.localizacao)}</div>
        <div class="pet-card-tags">${tags}</div>
        <div class="pet-card-actions">
          <button class="btn-detail" type="button" data-id="${pet.id}">Ver detalhes</button>
          ${pet.status === 'Disponível'
            ? `<button class="btn-interest" type="button" data-interest="${pet.id}">💛 Tenho interesse</button>`
            : ''}
        </div>
      </div>
    </div>`;
}

function renderInto(container, pets, emptyMsg) {
  if (!container) return;
  container.innerHTML = pets.length
    ? pets.map(petCardHtml).join('')
    : `<div class="grid-empty">${emptyMsg}</div>`;
}

function emptyListMsg(tipo) {
  if (state.activeFilter === 'perto') {
    return userOrigin()
      ? `Nenhum pet ${tipo} na sua região no momento.`
      : `Nenhum pet ${tipo} para os filtros atuais.`;
  }
  return `Nenhum pet ${tipo} para os filtros atuais.`;
}

function renderPetLists() {
  const filtered = filterPets();
  const disp = filtered.filter(p => p.status === 'Disponível');
  const indisp = filtered.filter(p => p.status === 'Indisponível');
  const adot = filtered.filter(p => p.status === 'Adotado');

  renderInto($id('listDisponiveis'), disp, emptyListMsg('disponível'));
  renderInto($id('listIndisponiveis'), indisp, emptyListMsg('indisponível'));
  renderInto($id('listAdotados'), adot, emptyListMsg('adotado'));

  const countEl = $id('listCount');
  if (countEl) {
    countEl.textContent = `${filtered.length} pet(s) encontrado(s) — ${disp.length} disponível(is), ${indisp.length} indisponível(is), ${adot.length} adotado(s).`;
  }
}

function handleRemovePet(petId) {
  const pet = getPet(petId);
  if (!pet) return;

  openConfirm({
    icon: '🗑️',
    title: 'Remover pet',
    message: `Tem certeza que deseja remover <strong>${escapeHtml(pet.nome)}</strong>?<br>Esta ação não pode ser desfeita.`,
    confirmLabel: 'Sim, excluir',
    onConfirm: () => {
      deletePet(petId);
      // limpa referências do pet removido
      state.interesses = state.interesses.filter(id => id !== petId);
      state.recusas = state.recusas.filter(id => id !== petId);
      state.interessados = state.interessados.filter(r => r.petId !== petId);
      saveInteresses();
      saveRecusas();
      saveInteressados();

      renderCounters();
      renderPetLists();
      renderCurrentPet();
      renderProfile();
      showToast(`${pet.nome} foi removido com sucesso.`, 'success');
    }
  });
}

function renderCounters() {
  const disponiveis = state.pets.filter(p => p.status === 'Disponível').length;
  const adotados = state.pets.filter(p => p.status === 'Adotado').length;

  const ongs = new Set(
    state.pets
      .filter(p => p.responsavel && (p.responsavel.tipo === 'ONG' || p.responsavel.tipo === 'Lar temporário'))
      .map(p => p.responsavel.nome)
  ).size;

  const pessoas = state.pets.filter(p => p.responsavel && p.responsavel.tipo === 'Pessoa física').length;

  animateCount('statDisponiveis', disponiveis);
  animateCount('statAdotados', adotados);
  animateCount('statOngs', ongs);
  animateCount('statPessoas', pessoas);
}

function setText(id, value) { const el = $id(id); if (el) el.textContent = value; }

/* Conta de forma animada do valor atual até o alvo (count-up). */
function animateCount(id, to, duration) {
  const el = $id(id);
  if (!el) return;
  to = Number(to) || 0;

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const from = Number(String(el.textContent).replace(/\D/g, '')) || 0;
  if (reduce || from === to) { el.textContent = to; return; }

  duration = duration || 1000;
  const start = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic

  if (el._countRAF) cancelAnimationFrame(el._countRAF);
  el.classList.add('counting');

  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(from + (to - from) * ease(p));
    if (p < 1) {
      el._countRAF = requestAnimationFrame(tick);
    } else {
      el.textContent = to;
      el._countRAF = null;
      el.classList.remove('counting');
    }
  }
  el._countRAF = requestAnimationFrame(tick);
}

/* ===========================================================
   9. CADASTRO DE PET
=========================================================== */
function updateBreedOptions(species) {
  const sel = $id('p_raca');
  if (!sel) return;
  const lista = RACAS[species];
  if (!lista) {
    sel.innerHTML = '<option value="">Selecione a espécie primeiro</option>';
    return;
  }
  sel.innerHTML = '<option value="">Selecione</option>' +
    lista.map(r => `<option>${r}</option>`).join('');
}

function toggleNinhadaFields() {
  const tipo = $id('p_tipoCadastro').value;
  const isNinhada = tipo === 'Filhotes/Ninhada';
  $id('grupoQuantidade').hidden = !isNinhada;
  $id('labelNome').textContent = isNinhada ? 'Identificação da ninhada *' : 'Nome do pet *';
  $id('p_nome').placeholder = isNinhada ? 'Ex.: Ninhada da Mel' : 'Ex.: Bolinha';
}

function handleImagePreview(event) {
  const file = event.target.files && event.target.files[0];
  const box = $id('imagePreview');
  const img = $id('imagePreviewImg');
  if (!file) {
    state.pendingImage = '';
    box.hidden = true;
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    state.pendingImage = e.target.result;
    img.src = state.pendingImage;
    box.hidden = false;
  };
  reader.readAsDataURL(file);
}

/* Preenche o formulário de pet com os dados de um pet existente (modo edição). */
function prefillPetForm(pet) {
  const f = $id('petForm');
  if (!f) return;
  const fm = pet.fichaMedica || {};
  const resp = pet.responsavel || {};
  const doa = pet.doacao || {};

  const set = (name, value) => { if (f.elements[name]) f.elements[name].value = (value == null ? '' : value); };
  const setSel = (name, value) => {
    const el = f.elements[name];
    if (!el) return;
    const v = (value == null ? '' : String(value));
    // garante a opção (ex.: status "Adotado" não existe no formulário de cadastro)
    if (v && !Array.from(el.options).some(o => o.value === v)) el.add(new Option(v, v));
    el.value = v;
  };
  const setChk = (name, on) => { if (f.elements[name]) f.elements[name].checked = !!on; };

  set('responsavelNome', resp.nome);
  set('responsavelTelefone', resp.telefone);
  setSel('responsavelTipo', resp.tipo);

  setSel('tipoCadastro', doa.tipo === 'Filhotes/Ninhada' ? 'Filhotes/Ninhada' : 'Pet individual');
  toggleNinhadaFields();
  if (doa.tipo === 'Filhotes/Ninhada') set('quantidade', doa.quantidade);

  set('nome', pet.nome);
  setSel('especie', pet.especie);
  updateBreedOptions(pet.especie);
  setSel('raca', pet.raca);
  set('idade', pet.idade);
  set('idadeMeses', pet.idadeMeses);
  setSel('sexo', pet.sexo);
  set('cidade', pet.cidade);
  setSel('uf', pet.uf);
  set('bairro', pet.bairro);
  setSel('status', pet.status);
  set('descricao', pet.descricao);
  set('temperamento', (pet.temperamento || []).join(', '));
  set('larIdeal', (pet.larIdeal || []).join(', '));

  // A imagem atual já vale como válida; mostra o preview (não exige novo upload).
  state.pendingImage = pet.imagem || '';
  const box = $id('imagePreview');
  const img = $id('imagePreviewImg');
  if (state.pendingImage && box && img) { img.src = state.pendingImage; box.hidden = false; }

  setSel('leishmaniose', fm.leishmaniose);
  set('vacinaPrincipal', fm.vacinaPrincipal);
  set('condicaoEspecial', fm.condicaoEspecial);
  setChk('vermifugo', fm.vermifugo);
  setChk('v8v10', fm.v8v10);
  setChk('antirrabica', fm.antirrabica);
  setChk('gripeCanina', fm.gripeCanina);
  setChk('giardia', fm.giardia);
  setChk('v4v5', fm.v4v5);
  setChk('felv', fm.felv);
  setChk('castrado', fm.castrado);
  set('observacoes', fm.observacoes);

  setChk('declaroResponsavel', true); // já é o responsável pelo pet que cadastrou
}

/* Se a URL tiver ?edit=<id>, entra em modo edição do formulário de pet. */
function initPetEditMode() {
  const petForm = $id('petForm');
  if (!petForm) return;

  const editId = Number(new URLSearchParams(window.location.search).get('edit'));
  if (!editId) return;

  if (!isUserRegistered()) { showToast('Faça login para editar um pet.', 'warning'); return; }

  const pet = getPet(editId);
  if (!pet) { showToast('Pet não encontrado.', 'error'); return; }
  if (pet.cadastradoPorEmail !== state.user.email) {
    showToast('Você só pode editar pets que você cadastrou.', 'warning');
    return;
  }

  state.editingPetId = pet.id;
  prefillPetForm(pet);

  // Ajusta a UI para o modo edição.
  const title = document.querySelector('.page-title');
  if (title) title.textContent = `Editar ${pet.nome}`;
  const lead = document.querySelector('.page-lead');
  if (lead) lead.textContent = 'Atualize as informações do pet. As mudanças aparecem na hora na listagem e no mapa.';
  const submitBtn = petForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Salvar alterações 💾';
}

function validatePetForm() {
  const f = $id('petForm');
  const get = (name) => (f.elements[name] ? f.elements[name].value.trim() : '');
  const errors = [];

  const isNinhada = get('tipoCadastro') === 'Filhotes/Ninhada';

  if (!get('responsavelNome')) errors.push('Informe o nome do responsável.');
  const respTel = get('responsavelTelefone');
  if (f.elements['responsavelTelefone']) f.elements['responsavelTelefone'].classList.toggle('input-error', !!respTel && !validarTelefone(respTel));
  if (!respTel) errors.push('Informe o telefone do responsável.');
  else if (!validarTelefone(respTel)) errors.push('Telefone do responsável inválido. Ex.: (31) 99999-9999.');
  if (!get('responsavelTipo')) errors.push('Selecione o tipo de responsável.');
  if (!get('nome')) errors.push(isNinhada ? 'Informe a identificação da ninhada.' : 'Informe o nome do pet.');
  if (!get('especie')) errors.push('Selecione a espécie.');
  if (!get('raca')) errors.push('Selecione a raça.');
  if (!get('idade')) errors.push('Informe a idade aproximada.');
  if (get('idadeMeses') === '' || Number(get('idadeMeses')) < 0) errors.push('Informe a idade em meses.');
  if (!get('sexo')) errors.push('Selecione o sexo.');
  if (isNinhada && (get('quantidade') === '' || Number(get('quantidade')) < 2)) {
    errors.push('Informe a quantidade de filhotes (mínimo 2).');
  }
  if (!get('cidade')) errors.push('Informe a cidade.');
  if (!get('uf')) errors.push('Selecione a UF.');
  if (!get('bairro')) errors.push('Informe o bairro.');
  if (!get('descricao')) errors.push('Descreva a história do animal.');
  if (!state.pendingImage) errors.push('A imagem do pet é obrigatória.');
  if (!f.elements['declaroResponsavel'] || !f.elements['declaroResponsavel'].checked) {
    errors.push('Confirme a declaração de responsabilidade pelas informações do pet.');
  }

  return { valid: errors.length === 0, message: errors[0] || '', errors };
}

function handlePetSubmit(event) {
  event.preventDefault();

  // Cadastrar pet exige usuário cadastrado.
  if (!isUserRegistered()) {
    showToast('Para cadastrar um pet para doação, faça seu cadastro primeiro.', 'warning');
    setTimeout(() => { window.location.href = 'cadastro.html'; }, 1000);
    return;
  }

  const f = event.target;
  const errBox = $id('petFormError');
  const result = validatePetForm();

  if (!result.valid) {
    errBox.textContent = result.message;
    showToast(result.message, 'error');
    return;
  }
  errBox.textContent = '';

  const get = (name) => (f.elements[name] ? f.elements[name].value.trim() : '');
  const chk = (name) => f.elements[name].checked;
  const isNinhada = get('tipoCadastro') === 'Filhotes/Ninhada';

  const idadeMeses = Number(get('idadeMeses'));
  const editing = state.editingPetId != null;
  const existing = editing ? getPet(state.editingPetId) : null;
  const novoId = editing ? state.editingPetId
                         : state.pets.reduce((max, p) => Math.max(max, p.id), 0) + 1;

  const temperamento = get('temperamento') ? get('temperamento').split(',').map(s => s.trim()).filter(Boolean) : [];
  const larIdeal = get('larIdeal') ? get('larIdeal').split(',').map(s => s.trim()).filter(Boolean) : [];

  const pet = {
    id: novoId,
    cadastradoPorEmail: existing ? existing.cadastradoPorEmail
                                 : (isUserRegistered() ? state.user.email : ''),
    nome: get('nome'),
    especie: get('especie'),
    raca: get('raca'),
    idade: get('idade'),
    idadeMeses: idadeMeses,
    sexo: get('sexo'),
    localizacao: `${get('cidade')}/${get('uf')}`,
    cidade: get('cidade'),
    uf: get('uf'),
    bairro: get('bairro'),
    status: get('status'),
    imagem: state.pendingImage,
    descricao: get('descricao'),
    temperamento: temperamento,
    larIdeal: larIdeal,
    responsavel: {
      nome: get('responsavelNome'),
      telefone: aplicarMascaraTelefone(get('responsavelTelefone')),
      tipo: get('responsavelTipo')
    },
    doacao: {
      tipo: isNinhada ? 'Filhotes/Ninhada' : 'Pet individual',
      quantidade: isNinhada ? Number(get('quantidade')) : 1
    },
    fichaMedica: {
      leishmaniose: get('leishmaniose'),
      vermifugo: chk('vermifugo'),
      v8v10: chk('v8v10'),
      antirrabica: chk('antirrabica'),
      gripeCanina: chk('gripeCanina'),
      giardia: chk('giardia'),
      v4v5: chk('v4v5'),
      felv: chk('felv'),
      castrado: chk('castrado'),
      vacinaPrincipal: get('vacinaPrincipal'),
      condicaoEspecial: get('condicaoEspecial'),
      observacoes: get('observacoes')
    }
  };

  if (editing && existing) {
    Object.assign(existing, pet); // preserva a posição no array, atualiza os campos
  } else {
    state.pets.push(pet);
  }
  savePets();

  f.reset();
  state.pendingImage = '';
  $id('imagePreview').hidden = true;
  updateBreedOptions('');
  toggleNinhadaFields();
  state.editingPetId = null;

  showToast(`${pet.nome} foi ${editing ? 'atualizado(a)' : 'cadastrado(a)'} com sucesso! ${editing ? '💾' : '🐾'}`, 'success');

  // atualiza a tela atual (caso o form esteja na mesma página) e redireciona
  renderCounters();
  renderPetLists();
  renderCurrentPet();
  const destino = editing ? 'perfil.html' : 'index.html#listagem';
  setTimeout(() => { window.location.href = destino; }, 1000);
}

/* ===========================================================
   10. MODAL DE DETALHES
=========================================================== */
function modalMedRow(kind, valueLabel) {
  const icon = kind === 'yes' ? '✓' : kind === 'warn' ? '!' : '—';
  return `<span class="med-tag med-tag--${kind}">${icon} ${escapeHtml(valueLabel)}</span>`;
}

function showPetDetails(petId) {
  const pet = getPet(petId);
  if (!pet) return;
  const fm = pet.fichaMedica || {};
  const content = $id('modalContent');

  const temper = (pet.temperamento || []).map(t => `<span class="tag tag--temper">${escapeHtml(t)}</span>`).join('') || '<span class="med-tag med-tag--no">Não informado</span>';
  const lar = (pet.larIdeal || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') || '<span class="med-tag med-tag--no">Não informado</span>';

  const leishKind = /negativ/i.test(fm.leishmaniose) ? 'yes' : (/positiv|tratamento/i.test(fm.leishmaniose) ? 'warn' : 'no');
  const vac = vacinaPrincipal(pet);

  const med = [
    modalMedRow(leishKind, 'Leishmaniose: ' + (fm.leishmaniose || 'Não testado')),
    modalMedRow(fm.vermifugo ? 'yes' : 'no', 'Vermífugo'),
    modalMedRow(fm.v8v10 ? 'yes' : 'no', 'V8 / V10'),
    modalMedRow(fm.antirrabica ? 'yes' : 'no', 'Antirrábica'),
    modalMedRow(fm.gripeCanina ? 'yes' : 'no', 'Gripe canina'),
    modalMedRow(fm.giardia ? 'yes' : 'no', 'Giárdia'),
    modalMedRow(fm.v4v5 ? 'yes' : 'no', 'V4 / V5'),
    modalMedRow(fm.felv ? 'yes' : 'no', 'FeLV testada'),
    modalMedRow(fm.castrado ? 'yes' : 'no', 'Castrado'),
    modalMedRow(vac.yes ? 'yes' : 'no', 'Vacina principal: ' + vac.label)
  ].join('');

  const qtd = pet.doacao && pet.doacao.tipo === 'Filhotes/Ninhada' ? pet.doacao.quantidade + ' filhotes' : '1 (individual)';

  content.innerHTML = `
    <div class="modal-img">
      <img src="${escapeHtml(pet.imagem)}" alt="${escapeHtml(pet.nome)}" onerror="this.src='assets/luna-hero.png'">
      <span class="explore-card-status ${statusBadgeClass(pet.status)}">${escapeHtml(pet.status)}</span>
    </div>
    <div class="modal-body">
      <div class="modal-head">
        <div>
          <div class="modal-name" id="modalPetName">${escapeHtml(pet.nome)}</div>
          <div class="modal-sub">${escapeHtml(pet.especie)} · ${escapeHtml(pet.raca)} · ${escapeHtml(pet.sexo)}</div>
        </div>
        <span class="explore-card-age">${escapeHtml(pet.idade)}</span>
      </div>

      <div class="modal-section">
        <div class="modal-info-grid">
          <div class="modal-info-item"><div class="k">Localização</div><div class="v">${escapeHtml(pet.localizacao)}</div></div>
          <div class="modal-info-item"><div class="k">Bairro</div><div class="v">${escapeHtml(pet.bairro || '—')}</div></div>
          <div class="modal-info-item"><div class="k">Idade</div><div class="v">${escapeHtml(pet.idade)} (${escapeHtml(String(pet.idadeMeses))} meses)</div></div>
          <div class="modal-info-item"><div class="k">Tipo de doação</div><div class="v">${escapeHtml(pet.doacao ? pet.doacao.tipo : 'Pet individual')} — ${escapeHtml(qtd)}</div></div>
        </div>
      </div>

      <div class="modal-section">
        <h4>História completa</h4>
        <p>${escapeHtml(pet.descricao)}</p>
      </div>

      <div class="modal-section">
        <h4>Temperamento</h4>
        <div class="tag-row">${temper}</div>
      </div>

      <div class="modal-section">
        <h4>Lar ideal</h4>
        <div class="tag-row">${lar}</div>
      </div>

      <div class="modal-section">
        <h4>Ficha médica completa</h4>
        <div class="modal-med-grid">${med}</div>
      </div>

      ${fm.condicaoEspecial ? `<div class="modal-section"><h4>Condição especial</h4><p>${escapeHtml(fm.condicaoEspecial)}</p></div>` : ''}
      ${fm.observacoes ? `<div class="modal-section"><h4>Observações</h4><p>${escapeHtml(fm.observacoes)}</p></div>` : ''}

      <div class="modal-section">
        <h4>Responsável pela doação</h4>
        <div class="modal-resp">
          <strong>${escapeHtml(pet.responsavel ? pet.responsavel.nome : '—')}</strong>
          (${escapeHtml(pet.responsavel ? pet.responsavel.tipo : '—')})<br>
          ${pet.responsavel && pet.responsavel.telefone ? '📞 ' + escapeHtml(pet.responsavel.telefone) : ''}
        </div>
      </div>

      ${pet.status === 'Disponível' ? `
      <div class="modal-note">⚠️ Enviar interesse não garante a adoção. A continuidade do processo depende da avaliação da ONG ou responsável pelo animal.</div>
      <div class="modal-actions">
        <button class="btn-primary btn-full" type="button" id="modalInterestBtn" data-id="${pet.id}">Tenho interesse 💛</button>
      </div>` : ''}
    </div>`;

  const overlay = $id('modalOverlay');
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';

  const interestBtn = $id('modalInterestBtn');
  if (interestBtn) {
    interestBtn.addEventListener('click', () => registerInterest(Number(interestBtn.dataset.id)));
  }
}

function closePetDetails() {
  const overlay = $id('modalOverlay');
  if (overlay) overlay.hidden = true;
  document.body.style.overflow = '';
}

/* ===========================================================
   11. TOAST
=========================================================== */
let toastTimer = null;
function showToast(message, type) {
  const toast = $id('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show toast--' + (type || 'info');
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 300);
  }, 3200);
}
/* alias com o nome usado em outras partes da especificação */
const mostrarToast = showToast;

/* ===========================================================
   11b. MODAL DE CONFIRMAÇÃO (substitui o confirm() nativo)
=========================================================== */
let confirmEl = null;
let confirmOnOk = null;

function ensureConfirmModal() {
  if (confirmEl) return confirmEl;
  confirmEl = document.createElement('div');
  confirmEl.className = 'confirm-overlay';
  confirmEl.hidden = true;
  confirmEl.innerHTML = `
    <div class="confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="confirmTitle" aria-describedby="confirmMessage">
      <div class="confirm-icon" id="confirmIcon">🗑️</div>
      <h3 class="confirm-title" id="confirmTitle">Confirmar</h3>
      <p class="confirm-message" id="confirmMessage"></p>
      <div class="confirm-actions">
        <button class="confirm-btn confirm-btn--cancel" type="button" id="confirmCancel">Cancelar</button>
        <button class="confirm-btn confirm-btn--danger" type="button" id="confirmOk">Excluir</button>
      </div>
    </div>`;
  document.body.appendChild(confirmEl);

  $id('confirmCancel').addEventListener('click', closeConfirm);
  $id('confirmOk').addEventListener('click', () => {
    const fn = confirmOnOk;
    closeConfirm();
    if (fn) fn();
  });
  confirmEl.addEventListener('click', (e) => { if (e.target === confirmEl) closeConfirm(); });
  return confirmEl;
}

function openConfirm({ title, message, confirmLabel, icon, onConfirm }) {
  ensureConfirmModal();
  $id('confirmIcon').textContent = icon || '🗑️';
  $id('confirmTitle').textContent = title || 'Confirmar ação';
  $id('confirmMessage').innerHTML = message || '';
  $id('confirmOk').textContent = confirmLabel || 'Confirmar';
  confirmOnOk = typeof onConfirm === 'function' ? onConfirm : null;
  confirmEl.hidden = false;
  document.body.style.overflow = 'hidden';
  setTimeout(() => { const ok = $id('confirmOk'); if (ok) ok.focus(); }, 50);
}

function closeConfirm() {
  if (!confirmEl || confirmEl.hidden) return;
  confirmEl.hidden = true;
  confirmOnOk = null;
  if ($id('modalOverlay') && $id('modalOverlay').hidden) document.body.style.overflow = '';
}

/* ===========================================================
   12. PERFIL DO USUÁRIO (perfil.html)
=========================================================== */
function maskCpf(cpf) {
  const d = String(cpf || '').replace(/\D/g, '');
  if (d.length !== 11) return cpf || '—';
  return `${d.slice(0, 3)}.***.**${d.slice(9)}`;
}

function formatDataBR(iso) {
  if (!iso) return '—';
  const p = String(iso).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}

function tipoCadastroLabel(t) {
  if (t === 'doar') return 'Quero doar / cadastrar pets';
  if (t === 'ambos') return 'Quero adotar e também doar';
  return 'Quero adotar um pet';
}

function profileInfoItem(k, v) {
  return `<div class="modal-info-item"><div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(v || '—')}</div></div>`;
}

function interestCardHtml(pet) {
  const resp = pet.responsavel || {};
  const tel = resp.telefone ? resp.telefone.replace(/\D/g, '') : '';
  return `
    <div class="pet-card">
      <div class="pet-card-img">
        <img src="${escapeHtml(pet.imagem)}" alt="${escapeHtml(pet.nome)}" onerror="this.src='assets/luna-hero.png'">
        <span class="pet-card-badge ${statusBadgeClass(pet.status)}">${escapeHtml(pet.status)}</span>
      </div>
      <div class="pet-card-body">
        <div class="pet-card-head">
          <div>
            <div class="pet-card-name">${escapeHtml(pet.nome)}</div>
            <div class="pet-card-breed">${escapeHtml(pet.especie)} · ${escapeHtml(pet.raca)}</div>
          </div>
          <span class="pet-card-age">${escapeHtml(pet.idade)}</span>
        </div>
        <div class="pet-card-loc">📍 ${escapeHtml(pet.localizacao)}</div>
        <div class="profile-contact">
          <span class="k">Contato do responsável</span>
          <strong>${escapeHtml(resp.nome || '—')}</strong>
          ${resp.telefone ? `<a href="tel:${escapeHtml(tel)}">📞 ${escapeHtml(resp.telefone)}</a>` : ''}
        </div>
        <div class="profile-card-actions">
          <button class="btn-detail" type="button" data-id="${pet.id}">Ver detalhes</button>
          <button class="btn-remove" type="button" data-remove-interest="${pet.id}">Remover</button>
        </div>
      </div>
    </div>`;
}

function removeInterest(petId) {
  state.interesses = state.interesses.filter(id => id !== petId);
  saveInteresses();
  if (state.user) {
    state.interessados = state.interessados.filter(r => !(r.petId === petId && r.email === state.user.email));
    saveInteressados();
  }
  showToast('Interesse removido.', 'info');
  renderProfile();
}

function ownedCardHtml(pet) {
  const interessados = state.interessados.filter(r => r.petId === pet.id);
  const lista = interessados.length
    ? interessados.map(r => `
        <li>
          <strong>${escapeHtml(r.nome || 'Interessado(a)')}</strong>
          ${r.telefone ? `<a href="tel:${escapeHtml(r.telefone.replace(/\D/g, ''))}">📞 ${escapeHtml(r.telefone)}</a>` : ''}
        </li>`).join('')
    : '<li class="none">Ninguém demonstrou interesse ainda.</li>';

  return `
    <div class="pet-card">
      <div class="pet-card-img">
        <img src="${escapeHtml(pet.imagem)}" alt="${escapeHtml(pet.nome)}" onerror="this.src='assets/luna-hero.png'">
        <span class="pet-card-badge ${statusBadgeClass(pet.status)}">${escapeHtml(pet.status)}</span>
      </div>
      <div class="pet-card-body">
        <div class="pet-card-head">
          <div>
            <div class="pet-card-name">${escapeHtml(pet.nome)}</div>
            <div class="pet-card-breed">${escapeHtml(pet.especie)} · ${escapeHtml(pet.raca)}</div>
          </div>
          <span class="pet-card-age">${escapeHtml(pet.idade)}</span>
        </div>
        <div class="pet-card-loc">📍 ${escapeHtml(pet.localizacao)}</div>
        <div class="owned-interested">
          <span class="k">Interessados (${interessados.length})</span>
          <ul>${lista}</ul>
        </div>
        <div class="pet-card-actions">
          <button class="btn-detail" type="button" data-id="${pet.id}">Ver detalhes</button>
          <a class="btn-remove btn-edit" href="cadastrar-pet.html?edit=${pet.id}">✏️ Editar</a>
          <button class="btn-remove" type="button" data-remove-pet="${pet.id}">Remover</button>
        </div>
      </div>
    </div>`;
}

function logoutUser() {
  localStorage.removeItem(LS.usuario);
  state.user = null;
  updateUserStatus();
  showToast('Você saiu da sua conta.', 'info');
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const f = event.target;
  const errBox = $id('loginFormError');
  const get = (name) => (f.elements[name] ? f.elements[name].value.trim() : '');

  const email = get('email');
  const senha = get('senha');

  if (!validarEmail(email) || !senha) {
    const msg = 'Informe e-mail e senha para entrar.';
    if (errBox) errBox.textContent = msg;
    showToast(msg, 'error');
    return;
  }

  const conta = findConta(email);
  if (!conta || conta.senha !== senha) {
    const msg = 'E-mail ou senha incorretos.';
    if (errBox) errBox.textContent = msg;
    showToast(msg, 'error');
    if (f.elements['senha']) f.elements['senha'].classList.add('input-error');
    return;
  }

  if (errBox) errBox.textContent = '';
  state.user = clone(conta);
  saveUser();
  updateUserStatus();
  showToast(`Bem-vindo(a) de volta, ${(state.user.nome || '').split(' ')[0]}! 🐾`, 'success');
  setTimeout(() => { window.location.href = 'perfil.html'; }, 900);
}

function refusedCardHtml(pet) {
  return `
    <div class="pet-card">
      <div class="pet-card-img">
        <img src="${escapeHtml(pet.imagem)}" alt="${escapeHtml(pet.nome)}" onerror="this.src='assets/luna-hero.png'">
        <span class="pet-card-badge ${statusBadgeClass(pet.status)}">${escapeHtml(pet.status)}</span>
      </div>
      <div class="pet-card-body">
        <div class="pet-card-head">
          <div>
            <div class="pet-card-name">${escapeHtml(pet.nome)}</div>
            <div class="pet-card-breed">${escapeHtml(pet.especie)} · ${escapeHtml(pet.raca)}</div>
          </div>
          <span class="pet-card-age">${escapeHtml(pet.idade)}</span>
        </div>
        <div class="pet-card-loc">📍 ${escapeHtml(pet.localizacao)}</div>
        <div class="profile-card-actions">
          <button class="btn-detail" type="button" data-id="${pet.id}">Ver detalhes</button>
          <button class="btn-restore" type="button" data-restore-refusal="${pet.id}">↩ Voltar a considerar</button>
        </div>
      </div>
    </div>`;
}

function restoreRefusal(petId) {
  state.recusas = state.recusas.filter(id => id !== petId);
  saveRecusas();
  showToast('Pet de volta para a sua lista de exploração. 🐾', 'success');
  renderProfile();
  renderCurrentPet();   // reaparece em "Explorar pets" (sem efeito se a área não existir)
}

/* Formulário (oculto) de edição dos dados pessoais, pré-preenchido. */
function accountEditFormHtml(u) {
  const tc = u.tipoCadastro || 'adotar';
  const sel = (v) => v === tc ? ' checked' : '';
  const moradiaOpts = ['Casa com quintal', 'Casa sem quintal', 'Apartamento com tela de proteção', 'Apartamento sem tela', 'Sítio / chácara'];
  const animaisOpts = ['Não', 'Sim, cães', 'Sim, gatos', 'Sim, cães e gatos'];

  return `
  <form id="accountEditForm" class="edit-profile-form card-form" hidden novalidate>
    <fieldset class="form-fieldset">
      <legend>Quero...</legend>
      <div class="radio-row">
        <label class="radio-pill"><input type="radio" name="tipoCadastro" value="adotar"${sel('adotar')}> Adotar um pet</label>
        <label class="radio-pill"><input type="radio" name="tipoCadastro" value="doar"${sel('doar')}> Doar / cadastrar um pet</label>
        <label class="radio-pill"><input type="radio" name="tipoCadastro" value="ambos"${sel('ambos')}> Adotar e também doar</label>
      </div>
    </fieldset>

    <div class="form-grid">
      <div class="form-group">
        <label for="acc_nome">Nome completo *</label>
        <input type="text" id="acc_nome" name="nome" value="${escapeHtml(u.nome || '')}">
      </div>
      <div class="form-group">
        <label for="acc_cpf">CPF *</label>
        <input type="text" id="acc_cpf" name="cpf" maxlength="14" placeholder="000.000.000-00" value="${escapeHtml(aplicarMascaraCPF(u.cpf || ''))}">
      </div>
      <div class="form-group">
        <label for="acc_email">E-mail *</label>
        <input type="email" id="acc_email" name="email" value="${escapeHtml(u.email || '')}">
      </div>
      <div class="form-group">
        <label for="acc_telefone">Telefone / WhatsApp *</label>
        <input type="tel" id="acc_telefone" name="telefone" maxlength="15" placeholder="(31) 99999-9999" value="${escapeHtml(u.telefone || '')}">
      </div>
      <div class="form-group">
        <label for="acc_nascimento">Data de nascimento *</label>
        <input type="text" id="acc_nascimento" name="nascimento" inputmode="numeric" maxlength="10" placeholder="dd/mm/aaaa" autocomplete="bday" value="${escapeHtml(u.nascimento ? formatDataBR(u.nascimento) : '')}">
      </div>
      <div class="form-group">
        <label for="acc_cep">CEP <small>(preenche o endereço)</small></label>
        <input type="text" id="acc_cep" name="cep" inputmode="numeric" maxlength="9" placeholder="00000-000" autocomplete="postal-code" value="${escapeHtml(u.cep || '')}">
      </div>
      <div class="form-group">
        <label for="acc_cidade">Cidade *</label>
        <input type="text" id="acc_cidade" name="cidade" value="${escapeHtml(u.cidade || '')}">
      </div>
      <div class="form-group">
        <label for="acc_uf">UF *</label>
        <select id="acc_uf" name="uf"><option value="">--</option>${optionsHtml(UFS, u.uf)}</select>
      </div>
      <div class="form-group">
        <label for="acc_bairro">Bairro *</label>
        <input type="text" id="acc_bairro" name="bairro" value="${escapeHtml(u.bairro || '')}">
      </div>
      <div class="form-group">
        <label for="acc_moradia">Tipo de moradia *</label>
        <select id="acc_moradia" name="moradia"><option value="">Selecione</option>${optionsHtml(moradiaOpts, u.moradia)}</select>
      </div>
      <div class="form-group">
        <label for="acc_outros">Possui outros animais? *</label>
        <select id="acc_outros" name="outrosAnimais"><option value="">Selecione</option>${optionsHtml(animaisOpts, u.outrosAnimais)}</select>
      </div>
      <div class="form-group">
        <label for="acc_jaadotou">Já adotou antes? *</label>
        <select id="acc_jaadotou" name="jaAdotou"><option value="">Selecione</option>${optionsHtml(['Sim', 'Não'], u.jaAdotou)}</select>
      </div>
    </div>

    <details class="account-password">
      <summary>Alterar senha (opcional)</summary>
      <div class="form-grid">
        <div class="form-group">
          <label for="acc_senha">Nova senha <small>(mín. 6 caracteres)</small></label>
          <input type="password" id="acc_senha" name="senha" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label for="acc_senha2">Confirmar nova senha</label>
          <input type="password" id="acc_senha2" name="confirmaSenha" autocomplete="new-password">
        </div>
      </div>
    </details>

    <label class="check-row">
      <input type="checkbox" id="acc_termos" name="termos"${u.aceitaTermos !== false ? ' checked' : ''}>
      <span>Confirmo que aceito os <a href="termos.html" target="_blank" rel="noopener">termos de adoção responsável</a>.</span>
    </label>

    <div class="form-error" id="accountEditError" role="alert"></div>
    <div class="account-actions">
      <button type="submit" class="btn-primary">Salvar alterações</button>
      <button type="button" class="btn-cancel" id="btnCancelEdit">Cancelar</button>
    </div>
  </form>`;
}

function abrirEdicaoDados() {
  const view = $id('accountView');
  const form = $id('accountEditForm');
  const btn = $id('btnEditData');
  if (view) view.hidden = true;
  if (btn) btn.hidden = true;
  if (form) form.hidden = false;
  configurarMascaraCPF(['acc_cpf']);            // máscara de CPF na edição
  configurarMascaraTelefone(['acc_telefone']);  // máscara de telefone na edição
  configurarMascaraData(['acc_nascimento']);    // máscara de data na edição
  configurarBuscaCep('acc_cep', { cidade: 'acc_cidade', uf: 'acc_uf', bairro: 'acc_bairro' }); // CEP → endereço
}

function cancelarEdicaoDados() {
  const view = $id('accountView');
  const form = $id('accountEditForm');
  const btn = $id('btnEditData');
  if (form) form.hidden = true;
  const err = $id('accountEditError');
  if (err) err.textContent = '';
  if (view) view.hidden = false;
  if (btn) btn.hidden = false;
}

function salvarEdicaoDados(event) {
  event.preventDefault();
  const f = event.target;
  const get = (name) => (f.elements[name] ? f.elements[name].value.trim() : '');
  const errBox = $id('accountEditError');
  const errors = [];

  const nome = get('nome');
  const cpf = get('cpf');
  const email = get('email');
  const telefone = get('telefone');
  const nascimento = get('nascimento');
  const cidade = get('cidade');
  const uf = get('uf');
  const bairro = get('bairro');
  const moradia = get('moradia');
  const outrosAnimais = get('outrosAnimais');
  const jaAdotou = get('jaAdotou');
  const cep = get('cep');
  const tipoCadastro = get('tipoCadastro');
  const termos = f.elements['termos'] ? f.elements['termos'].checked : true;
  const senha = get('senha');
  const confirmaSenha = get('confirmaSenha');

  const cpfValido = validarCPF(cpf);
  const emailValido = validarEmail(email);
  const telValido = validarTelefone(telefone);
  const dataValida = validarData(nascimento);
  if (f.elements['cpf']) f.elements['cpf'].classList.toggle('input-error', !cpfValido);
  if (f.elements['email']) f.elements['email'].classList.toggle('input-error', !emailValido);
  if (f.elements['telefone']) f.elements['telefone'].classList.toggle('input-error', !telValido);
  if (f.elements['nascimento']) f.elements['nascimento'].classList.toggle('input-error', !!nascimento && !dataValida);

  if (!nome) errors.push('Informe o nome completo.');
  if (!cpfValido) errors.push('CPF inválido. Não foi possível salvar as alterações.');
  if (!emailValido) errors.push('Informe um e-mail válido.');
  if (!telefone) errors.push('Informe o telefone / WhatsApp.');
  else if (!telValido) errors.push('Telefone inválido. Use DDD + número, ex.: (31) 99999-9999.');
  if (!nascimento) errors.push('Informe a data de nascimento.');
  else if (!dataValida) errors.push('Data de nascimento inválida. Use o formato dd/mm/aaaa.');
  if (!cidade) errors.push('Informe a cidade.');
  if (!uf) errors.push('Selecione a UF.');
  if (!bairro) errors.push('Informe o bairro.');
  if (!moradia) errors.push('Selecione o tipo de moradia.');
  if (!outrosAnimais) errors.push('Informe se possui outros animais.');
  if (!jaAdotou) errors.push('Informe se já adotou antes.');
  if (!termos) errors.push('É preciso aceitar os termos de adoção responsável.');
  if (senha || confirmaSenha) {
    if (senha.length < 6) errors.push('A nova senha deve ter no mínimo 6 caracteres.');
    if (senha !== confirmaSenha) errors.push('A confirmação da nova senha não confere.');
  }

  if (errors.length) {
    if (errBox) errBox.textContent = errors[0];
    showToast(errors[0], 'error');
    return;
  }
  if (errBox) errBox.textContent = '';

  // mantém vínculos se o e-mail mudar (não apaga pets cadastrados / interessados)
  const oldEmail = state.user ? state.user.email : '';
  const idade = calcIdade(nascimento);

  state.user = Object.assign({}, state.user, {
    tipoCadastro: tipoCadastro || state.user.tipoCadastro,
    nome: nome,
    cpf: aplicarMascaraCPF(cpf),
    cpfLimpo: limparCPF(cpf),
    email: email,
    telefone: aplicarMascaraTelefone(telefone),
    nascimento: dataParaISO(nascimento),
    idade: isNaN(idade) ? null : idade,
    maior21: !isNaN(idade) && idade >= IDADE_MINIMA_ADOCAO,
    cep: aplicarMascaraCep(cep),
    cidade: cidade,
    uf: uf,
    bairro: bairro,
    moradia: moradia,
    outrosAnimais: outrosAnimais,
    jaAdotou: jaAdotou,
    aceitaTermos: termos
  });
  if (senha) state.user.senha = senha;

  if (oldEmail && email && oldEmail !== email) {
    state.pets.forEach(p => { if (p.cadastradoPorEmail === oldEmail) p.cadastradoPorEmail = email; });
    savePets();
    state.interessados.forEach(r => { if (r.email === oldEmail) r.email = email; });
    saveInteressados();
  }

  saveUser();
  upsertConta(state.user, oldEmail);   // mantém a conta de login em sincronia
  updateUserStatus();
  renderProfile();            // volta para a visualização já atualizada
  showToast('Dados pessoais atualizados com sucesso.', 'success');
}

function renderProfile() {
  const root = $id('profileRoot');
  if (!root) return;

  if (!isUserRegistered()) {
    root.innerHTML = `
      <div class="profile-guard">
        <div class="explore-empty-emoji">🐾</div>
        <h3>Você ainda não tem cadastro</h3>
        <p>Crie sua conta para acompanhar seus interesses e os pets que você cadastrou.</p>
        <a class="btn-primary" href="cadastro.html">Fazer cadastro</a>
      </div>`;
    return;
  }

  const u = state.user;
  const interesses = state.interesses.map(getPet).filter(Boolean);
  const recusados = state.recusas.map(getPet).filter(Boolean);
  const meusPets = state.pets.filter(p => p.cadastradoPorEmail && u.email && p.cadastradoPorEmail === u.email);
  const idade = calcIdade(u.nascimento);
  const habilitado = (typeof u.maior21 === 'boolean') ? u.maior21 : (!isNaN(idade) && idade >= IDADE_MINIMA_ADOCAO);
  const eligibilityHtml = habilitado
    ? '<div class="profile-eligibility is-ok">✅ Você está <strong>habilitado</strong> para demonstrar interesse em adoção.</div>'
    : '<div class="profile-eligibility is-blocked">⚠️ Cadastro realizado, mas <strong>não habilitado</strong> para demonstrar interesse em adoção. A idade mínima exigida é 21 anos.</div>';

  const statusInteresse = habilitado
    ? '<span class="status-enabled">Habilitado</span>'
    : '<span class="status-disabled">Não habilitado (21+)</span>';
  const dados = [
    profileInfoItem('Nome completo', u.nome),
    profileInfoItem('CPF', maskCpf(u.cpf)),
    profileInfoItem('E-mail', u.email),
    profileInfoItem('Telefone / WhatsApp', u.telefone),
    profileInfoItem('Nascimento', formatDataBR(u.nascimento)),
    profileInfoItem('Idade', isNaN(idade) ? '—' : idade + ' anos'),
    profileInfoItem('CEP', u.cep || '—'),
    profileInfoItem('Cidade / UF', `${u.cidade}/${u.uf}`),
    profileInfoItem('Bairro', u.bairro),
    profileInfoItem('Tipo de moradia', u.moradia),
    profileInfoItem('Possui outros animais', u.outrosAnimais),
    profileInfoItem('Já adotou antes', u.jaAdotou),
    profileInfoItem('Tipo de cadastro', tipoCadastroLabel(u.tipoCadastro)),
    `<div class="modal-info-item"><div class="k">Interesse em adoção</div><div class="v">${statusInteresse}</div></div>`
  ].join('');

  root.innerHTML = `
    <div class="profile-greeting">
      <div>
        <h2 class="profile-name">Olá, ${escapeHtml(u.nome.split(' ')[0])} 👋</h2>
        <span class="profile-tag">${escapeHtml(tipoCadastroLabel(u.tipoCadastro))}</span>
      </div>
      <button class="btn-logout" type="button" id="btnLogout">Sair da conta</button>
    </div>

    ${eligibilityHtml}

    <div class="profile-stats">
      <div class="profile-stat"><div class="n">${interesses.length}</div><div class="l">interesses</div></div>
      <div class="profile-stat"><div class="n">${meusPets.length}</div><div class="l">pets cadastrados</div></div>
      <div class="profile-stat"><div class="n">${state.recusas.length}</div><div class="l">recusados</div></div>
    </div>

    <section class="profile-block account-card">
      <div class="account-head">
        <h3 class="profile-block-title">Meus dados pessoais</h3>
        <button class="btn-edit-data" type="button" id="btnEditData">✏️ Editar dados</button>
      </div>
      <div id="accountView">
        <div class="modal-info-grid">${dados}</div>
      </div>
      ${accountEditFormHtml(u)}
    </section>

    <section class="profile-block">
      <h3 class="profile-block-title">Pets que demonstrei interesse</h3>
      <div class="pets-grid">
        ${interesses.length ? interesses.map(interestCardHtml).join('')
          : `<div class="grid-empty">Você ainda não demonstrou interesse em nenhum pet. <a href="index.html#explorar">Explorar pets</a></div>`}
      </div>
    </section>

    <section class="profile-block">
      <h3 class="profile-block-title">Pets que recusei</h3>
      <div class="pets-grid">
        ${recusados.length ? recusados.map(refusedCardHtml).join('')
          : `<div class="grid-empty">Você não recusou nenhum pet. Os pets recusados em "Explorar pets" aparecem aqui e podem voltar.</div>`}
      </div>
    </section>

    <section class="profile-block">
      <h3 class="profile-block-title">Pets que cadastrei para doação</h3>
      <div class="pets-grid">
        ${meusPets.length ? meusPets.map(ownedCardHtml).join('')
          : `<div class="grid-empty">Você ainda não cadastrou pets. <a href="cadastrar-pet.html">Cadastrar um pet</a></div>`}
      </div>
    </section>

    <div class="profile-reminder">
      🐾 Lembre-se da <a href="index.html#requisitos">adoção responsável</a> antes de levar um novo amigo para casa.
    </div>`;

  const btn = $id('btnLogout');
  if (btn) btn.addEventListener('click', logoutUser);

  /* Edição de dados pessoais */
  const btnEdit = $id('btnEditData');
  if (btnEdit) btnEdit.addEventListener('click', abrirEdicaoDados);
  const btnCancel = $id('btnCancelEdit');
  if (btnCancel) btnCancel.addEventListener('click', cancelarEdicaoDados);
  const editForm = $id('accountEditForm');
  if (editForm) editForm.addEventListener('submit', salvarEdicaoDados);
}
/* alias com o nome usado em outras partes da especificação */
const renderizarDadosUsuario = renderProfile;

/* ===========================================================
   12b. MAPA INTERATIVO (perto de você) — Leaflet + OpenStreetMap
=========================================================== */
let _map = null;
let _mapMarkers = null;
let _userMarker = null;

function mapPopupHtml(pet) {
  return `<div class="map-popup">
    <img class="map-popup-img" src="${escapeHtml(pet.imagem)}" alt="${escapeHtml(pet.nome)}" onerror="this.src='assets/luna-hero.png'">
    <div class="map-popup-body">
      <strong class="map-popup-name">${escapeHtml(pet.nome)}</strong>
      <span class="map-popup-sub">${escapeHtml(pet.especie)} · ${escapeHtml(pet.raca)}</span>
      <span class="map-popup-sub">📍 ${escapeHtml(pet.localizacao)}</span>
      <span class="pet-card-badge ${statusBadgeClass(pet.status)}">${escapeHtml(pet.status)}</span>
      <button class="map-popup-btn" type="button" data-id="${pet.id}">Ver detalhes</button>
    </div>
  </div>`;
}

function initMap() {
  const el = $id('petsMap');
  if (!el || typeof L === 'undefined' || _map) return;

  _map = L.map('petsMap', { scrollWheelZoom: false }).setView([-15.78, -47.93], 4); // Brasil
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(_map);
  _mapMarkers = L.layerGroup().addTo(_map);

  renderMap(true);
}

function renderMap(fit) {
  if (!_map || !_mapMarkers) return;
  _mapMarkers.clearLayers();
  _userMarker = null;

  // O mapa mostra TODOS os animais (a restrição "mesma cidade" do filtro "perto"
  // vale só para a lista/explorar; aqui ela esvaziaria o mapa). Segue a busca.
  const term = normalizarTexto(state.searchTerm);
  const mapFilter = state.activeFilter === 'perto' ? 'todos' : state.activeFilter;
  const pets = state.pets.filter(pet => matchesSearch(pet, term) && matchesFilter(pet, mapFilter));
  const bounds = [];

  pets.forEach(pet => {
    const ll = petLatLng(pet);
    if (!ll) return;
    bounds.push(ll);
    const marker = L.marker(ll).addTo(_mapMarkers);
    marker.bindPopup(mapPopupHtml(pet), { minWidth: 200 });
    marker.on('popupopen', () => {
      const btn = document.querySelector('.map-popup-btn[data-id="' + pet.id + '"]');
      if (btn) btn.addEventListener('click', () => { _map.closePopup(); showPetDetails(pet.id); });
    });
  });

  const countEl = $id('mapCount');
  if (countEl) countEl.textContent = bounds.length + ' pet(s) no mapa';

  if (!fit) return;

  // "Perto de você": centraliza na localização real (geo) ou na cidade cadastrada
  if (state.activeFilter === 'perto') {
    const origin = userOrigin();
    if (origin) {
      _map.setView(origin, state.geo ? 11 : 9);
      addUserMarker(origin, state.geo ? '📍 Você está aqui' : undefined);
      return;
    }
  }
  if (bounds.length === 1) _map.setView(bounds[0], 9);
  else if (bounds.length > 1) _map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
}

function addUserMarker(latlng, label) {
  if (!_map || !_mapMarkers) return;
  if (_userMarker) _mapMarkers.removeLayer(_userMarker); // evita marcadores duplicados
  _userMarker = L.circleMarker(latlng, {
    radius: 11, color: '#D9623D', weight: 2, fillColor: '#F4845F', fillOpacity: 0.55
  }).addTo(_mapMarkers);
  _userMarker.bindPopup(label || ('📍 Você está aqui: ' + escapeHtml(state.user.cidade) + '/' + escapeHtml(state.user.uf)));
}

function locateMeOnMap() {
  if (!_map) { showToast('O mapa ainda está carregando.', 'info'); return; }

  // Fallback: centraliza na cidade cadastrada (quando a geolocalização não está disponível).
  const fallbackToCity = () => {
    if (!isUserRegistered()) {
      showToast('Não foi possível obter sua localização. Cadastre sua cidade para centralizar o mapa.', 'warning');
      return;
    }
    const me = cityLatLng(state.user.cidade, state.user.uf);
    if (!me) { showToast('Não encontramos a localização da sua cidade no mapa.', 'warning'); return; }
    _map.setView(me, 10);
    addUserMarker(me);
    _userMarker.openPopup();
    showToast(`Mostrando pets perto de ${state.user.cidade}/${state.user.uf}. 📍`, 'success');
  };

  if (!navigator.geolocation) { fallbackToCity(); return; }

  // Usa a localização real do navegador (com permissão do usuário).
  showToast('Obtendo sua localização...', 'info');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      renderPetLists();   // a lista passa a refletir os pets da sua região
      renderCurrentPet();
      _map.setView([state.geo.lat, state.geo.lng], 12);
      addUserMarker([state.geo.lat, state.geo.lng], '📍 Você está aqui');
      _userMarker.openPopup();
      showToast('Centralizado na sua localização atual. 📍', 'success');
    },
    () => fallbackToCity(), // permissão negada/indisponível → cai para a cidade cadastrada
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
  );
}

/* ===========================================================
   13. INICIALIZAÇÃO / EVENTOS
=========================================================== */
function initApp() {
  loadPets();
  loadUser();

  updateUserStatus();
  renderCounters();
  renderPetLists();
  renderCurrentPet();
  renderProfile();

  bindEvents();
  initMap();          // mapa interativo (só age se a página tiver #petsMap)
  initPetEditMode();  // entra em modo edição se a URL tiver ?edit=<id>

  // Página de cadastro: quem JÁ tem conta é levado para "Minha conta".
  if ($id('userForm') && isUserRegistered()) {
    const fp = document.querySelector('.form-page');
    if (fp) {
      fp.innerHTML = `
        <div class="form-inner">
          <div class="profile-guard">
            <div class="explore-empty-emoji">🐾</div>
            <h3>Você já tem uma conta</h3>
            <p>Estamos te levando para a sua área <strong>Minha conta</strong>...</p>
            <a class="btn-primary" href="perfil.html">Ir para Minha conta</a>
          </div>
        </div>`;
    }
    showToast('Você já tem cadastro. Indo para Minha conta.', 'info');
    setTimeout(() => { window.location.href = 'perfil.html'; }, 1100);
    return;
  }

  // Página de login: quem JÁ está logado é levado para "Minha conta".
  if ($id('loginForm') && isUserRegistered()) {
    showToast('Você já está logado. Indo para Minha conta.', 'info');
    setTimeout(() => { window.location.href = 'perfil.html'; }, 900);
    return;
  }

  // Página de cadastrar pet exige login: avisa o visitante ao abrir.
  if ($id('petForm') && !isUserRegistered()) {
    showToast('Para cadastrar um pet para doação, faça seu cadastro primeiro.', 'info');
  }
}

function bindEvents() {
  /* Menu hambúrguer */
  const toggle = $id('navToggle');
  const menu = $id('navMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* Busca */
  const searchForm = $id('searchForm');
  const searchInput = $id('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      state.searchTerm = searchInput.value;
      renderPetLists();
      renderCurrentPet();
      renderMap(false);
    });
  }
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      state.searchTerm = searchInput ? searchInput.value : '';
      renderPetLists();
      renderCurrentPet();
      renderMap(true);
    });
  }

  /* Botão "Centralizar perto de mim" do mapa */
  const btnLocate = $id('btnLocateMe');
  if (btnLocate) btnLocate.addEventListener('click', locateMeOnMap);

  /* Filtros */
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => setActiveFilter(chip.dataset.filter));
  });

  /* Ações do explorar (estilo Tinder) */
  const btnRefuse = $id('btnRefuse');
  const btnDetails = $id('btnDetails');
  const btnInterest = $id('btnInterest');
  if (btnRefuse) btnRefuse.addEventListener('click', () => registerRefusal(state.currentExploreId));
  if (btnDetails) btnDetails.addEventListener('click', () => { if (state.currentExploreId) showPetDetails(state.currentExploreId); });
  if (btnInterest) btnInterest.addEventListener('click', () => registerInterest(state.currentExploreId));

  /* Formulário de usuário */
  const userForm = $id('userForm');
  if (userForm) userForm.addEventListener('submit', handleUserSubmit);
  configurarMascaraCPF(['u_cpf']);                              // máscara de CPF no cadastro
  configurarMascaraTelefone(['u_telefone', 'p_telefone']);     // máscara de telefone (cadastro e cadastro de pet)
  configurarMascaraData(['u_nascimento']);                     // máscara de data no cadastro
  configurarBuscaCep('u_cep', { cidade: 'u_cidade', uf: 'u_uf', bairro: 'u_bairro' }); // CEP → endereço

  /* Formulário de login */
  const loginForm = $id('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

  /* Formulário de pet */
  const petForm = $id('petForm');
  if (petForm) petForm.addEventListener('submit', handlePetSubmit);

  const especie = $id('p_especie');
  if (especie) especie.addEventListener('change', () => updateBreedOptions(especie.value));

  const tipoCad = $id('p_tipoCadastro');
  if (tipoCad) tipoCad.addEventListener('change', toggleNinhadaFields);

  const imagem = $id('p_imagem');
  if (imagem) imagem.addEventListener('change', handleImagePreview);

  /* Detalhes (delegação nos cards das listagens) */
  const listSection = $id('listagem');
  if (listSection) {
    listSection.addEventListener('click', (e) => {
      const det = e.target.closest('.btn-detail');
      if (det) { showPetDetails(Number(det.dataset.id)); return; }
      const interest = e.target.closest('[data-interest]');
      if (interest) { registerInterest(Number(interest.dataset.interest)); return; }
      const remPet = e.target.closest('[data-remove-pet]');
      if (remPet) { handleRemovePet(Number(remPet.dataset.removePet)); return; }
    });
  }

  /* Perfil do usuário (delegação) */
  const perfilSection = $id('perfil');
  if (perfilSection) {
    perfilSection.addEventListener('click', (e) => {
      const det = e.target.closest('.btn-detail');
      if (det) { showPetDetails(Number(det.dataset.id)); return; }
      const rem = e.target.closest('[data-remove-interest]');
      if (rem) { removeInterest(Number(rem.dataset.removeInterest)); return; }
      const res = e.target.closest('[data-restore-refusal]');
      if (res) { restoreRefusal(Number(res.dataset.restoreRefusal)); return; }
      const remPet = e.target.closest('[data-remove-pet]');
      if (remPet) { handleRemovePet(Number(remPet.dataset.removePet)); return; }
    });
  }

  /* Menu da conta (dropdown do usuário logado) */
  const chipBtn = $id('userChipBtn');
  const dropdown = $id('userDropdown');
  if (chipBtn && dropdown) {
    chipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = dropdown.hidden;
      dropdown.hidden = !willOpen;
      chipBtn.setAttribute('aria-expanded', String(willOpen));
    });
    document.addEventListener('click', (e) => {
      if (!dropdown.hidden && !e.target.closest('#userMenu')) {
        dropdown.hidden = true;
        chipBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
  const btnLogoutMenu = $id('btnLogoutMenu');
  if (btnLogoutMenu) btnLogoutMenu.addEventListener('click', logoutUser);

  /* Modal */
  const modalClose = $id('modalClose');
  const overlay = $id('modalOverlay');
  if (modalClose) modalClose.addEventListener('click', closePetDetails);
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closePetDetails(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeConfirm(); closePetDetails(); } });
}

document.addEventListener('DOMContentLoaded', initApp);
