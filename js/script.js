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
  pets:        'meu4patas_pets',
  interesses:  'meu4patas_interesses',
  recusas:     'meu4patas_recusas',
  interessados:'meu4patas_interessados',
  versao:      'meu4patas_versao'
};

const DATA_VERSION = '3';        // bump para reabastecer os pets iniciais
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
  }
];

/* ===========================================================
   3. ESTADO DA APLICAÇÃO
=========================================================== */
const state = {
  pets: [],
  user: null,
  interesses: [],
  recusas: [],
  interessados: [],   // registro de quem demonstrou interesse: {petId, nome, telefone, email, data}
  activeFilter: 'todos',
  searchTerm: '',
  currentExploreId: null,
  pendingImage: '' // dataURL da imagem selecionada no cadastro de pet
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
  state.interesses = safeParse(localStorage.getItem(LS.interesses), []);
  state.recusas = safeParse(localStorage.getItem(LS.recusas), []);
  state.interessados = safeParse(localStorage.getItem(LS.interessados), []);
}

function saveUser() {
  localStorage.setItem(LS.usuario, JSON.stringify(state.user));
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
  const userMenu = $id('userMenu');

  if (nameEl && logged) nameEl.textContent = (state.user.nome || '').split(' ')[0];
  if (btnAuth) btnAuth.hidden = logged;        // "Criar conta" só quando deslogado
  if (userMenu) userMenu.hidden = !logged;     // chip + dropdown só quando logado
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

/* Lista de UFs reutilizável (cadastro e edição de perfil). */
const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
function optionsHtml(values, selected) {
  return values.map(v => `<option${v === selected ? ' selected' : ''}>${escapeHtml(v)}</option>`).join('');
}

function calcIdade(dataNascimento) {
  if (!dataNascimento) return NaN;
  const nasc = new Date(dataNascimento);
  if (isNaN(nasc.getTime())) return NaN;
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
  const senha = get('senha');
  const confirmaSenha = get('confirmaSenha');
  const termos = f.elements['termos'].checked;

  const cpfValido = validarCPF(cpf);
  const emailValido = validarEmail(email);
  if (f.elements['cpf']) f.elements['cpf'].classList.toggle('input-error', !!cpf && !cpfValido);
  if (f.elements['email']) f.elements['email'].classList.toggle('input-error', !!email && !emailValido);

  if (!nome) errors.push('Informe o nome completo.');
  if (!cpf) errors.push('Informe o CPF.');
  else if (!cpfValido) errors.push('CPF inválido. Verifique os números informados.');
  if (!emailValido) errors.push('Informe um e-mail válido.');
  if (!telefone) errors.push('Informe o telefone / WhatsApp.');
  if (!cidade) errors.push('Informe a cidade.');
  if (!uf) errors.push('Selecione a UF.');
  if (!bairro) errors.push('Informe o bairro.');
  if (!moradia) errors.push('Selecione o tipo de moradia.');
  if (!outrosAnimais) errors.push('Informe se possui outros animais.');
  if (!jaAdotou) errors.push('Informe se já adotou antes.');

  const idade = calcIdade(nascimento);
  if (!nascimento || isNaN(idade)) errors.push('Informe a data de nascimento.');
  // Obs.: a idade mínima de 21 anos é exigida para DEMONSTRAR INTERESSE (ver
  // usuarioPodeEnviarInteresse). O cadastro em si é permitido (ex.: para doar).

  if (senha.length < 6) errors.push('A senha deve ter no mínimo 6 caracteres.');
  if (senha !== confirmaSenha) errors.push('A confirmação de senha não confere.');
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
    telefone: get('telefone'),
    nascimento: get('nascimento'),
    idade: isNaN(idadeUser) ? null : idadeUser,
    maior21: !isNaN(idadeUser) && idadeUser >= IDADE_MINIMA_ADOCAO,
    cidade: get('cidade'),
    uf: get('uf'),
    bairro: get('bairro'),
    moradia: get('moradia'),
    outrosAnimais: get('outrosAnimais'),
    jaAdotou: get('jaAdotou'),
    aceitaTermos: f.elements['termos'] ? f.elements['termos'].checked : true,
    cadastradoEm: new Date().toISOString()
  };
  saveUser();
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
function isNearUser(pet) {
  if (!isUserRegistered()) return false;
  const sameCity = (pet.cidade || '').toLowerCase() === (state.user.cidade || '').toLowerCase();
  const sameUf = (pet.uf || '').toLowerCase() === (state.user.uf || '').toLowerCase();
  return sameCity && sameUf;
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

  if (filterName === 'perto' && !isUserRegistered()) {
    showToast('Cadastre sua cidade para encontrar pets perto de você.', 'info');
  }

  renderPetLists();
  renderCurrentPet();
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
    const semUser = state.activeFilter === 'perto' && !isUserRegistered();
    stage.innerHTML = `
      <div class="explore-empty">
        <div class="explore-empty-emoji">🐾</div>
        <h3>${semUser ? 'Cadastre sua cidade' : 'Nenhum pet por aqui'}</h3>
        <p>${semUser
          ? 'Faça seu cadastro para encontrar pets perto de você.'
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
    return isUserRegistered()
      ? 'Nenhum pet encontrado na sua cidade. Tente remover o filtro ou buscar pelo estado.'
      : 'Cadastre sua cidade para encontrar pets perto de você.';
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

function validatePetForm() {
  const f = $id('petForm');
  const get = (name) => (f.elements[name] ? f.elements[name].value.trim() : '');
  const errors = [];

  const isNinhada = get('tipoCadastro') === 'Filhotes/Ninhada';

  if (!get('responsavelNome')) errors.push('Informe o nome do responsável.');
  if (!get('responsavelTelefone')) errors.push('Informe o telefone do responsável.');
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
  const novoId = state.pets.reduce((max, p) => Math.max(max, p.id), 0) + 1;

  const temperamento = get('temperamento') ? get('temperamento').split(',').map(s => s.trim()).filter(Boolean) : [];
  const larIdeal = get('larIdeal') ? get('larIdeal').split(',').map(s => s.trim()).filter(Boolean) : [];

  const pet = {
    id: novoId,
    cadastradoPorEmail: isUserRegistered() ? state.user.email : '',
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
      telefone: get('responsavelTelefone'),
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

  state.pets.push(pet);
  savePets();

  f.reset();
  state.pendingImage = '';
  $id('imagePreview').hidden = true;
  updateBreedOptions('');
  toggleNinhadaFields();

  showToast(`${pet.nome} foi cadastrado(a) com sucesso! 🐾`, 'success');

  // atualiza a tela atual (caso o form esteja na mesma página) e vai para a listagem
  renderCounters();
  renderPetLists();
  renderCurrentPet();
  setTimeout(() => { window.location.href = 'index.html#listagem'; }, 1000);
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
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-detail" type="button" data-id="${pet.id}">Ver detalhes</button>
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
        <input type="tel" id="acc_telefone" name="telefone" value="${escapeHtml(u.telefone || '')}">
      </div>
      <div class="form-group">
        <label for="acc_nascimento">Data de nascimento *</label>
        <input type="date" id="acc_nascimento" name="nascimento" value="${escapeHtml(u.nascimento || '')}">
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
      <span>Confirmo que aceito os <a href="index.html#requisitos">termos de adoção responsável</a>.</span>
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
  configurarMascaraCPF(['acc_cpf']);   // máscara também na edição
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
  const tipoCadastro = get('tipoCadastro');
  const termos = f.elements['termos'] ? f.elements['termos'].checked : true;
  const senha = get('senha');
  const confirmaSenha = get('confirmaSenha');

  const cpfValido = validarCPF(cpf);
  const emailValido = validarEmail(email);
  if (f.elements['cpf']) f.elements['cpf'].classList.toggle('input-error', !cpfValido);
  if (f.elements['email']) f.elements['email'].classList.toggle('input-error', !emailValido);

  if (!nome) errors.push('Informe o nome completo.');
  if (!cpfValido) errors.push('CPF inválido. Não foi possível salvar as alterações.');
  if (!emailValido) errors.push('Informe um e-mail válido.');
  if (!telefone) errors.push('Informe o telefone / WhatsApp.');
  const idade = calcIdade(nascimento);
  if (!nascimento || isNaN(idade)) errors.push('Informe a data de nascimento.');
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

  state.user = Object.assign({}, state.user, {
    tipoCadastro: tipoCadastro || state.user.tipoCadastro,
    nome: nome,
    cpf: aplicarMascaraCPF(cpf),
    cpfLimpo: limparCPF(cpf),
    email: email,
    telefone: telefone,
    nascimento: nascimento,
    idade: isNaN(idade) ? null : idade,
    maior21: !isNaN(idade) && idade >= IDADE_MINIMA_ADOCAO,
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
    });
  }
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      state.searchTerm = searchInput ? searchInput.value : '';
      renderPetLists();
      renderCurrentPet();
    });
  }

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
  configurarMascaraCPF(['u_cpf']);   // máscara de CPF no cadastro

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
