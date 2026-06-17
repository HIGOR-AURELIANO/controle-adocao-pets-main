/* ─────────────────────────────────────────
   meu4patas — script.js
   Backend: PHP 8 + SQLite (api.php)
   Fetch API replaces all localStorage calls.
───────────────────────────────────────── */

'use strict';

/* ===========================================================
   1. CONSTANTES
=========================================================== */
const IDADE_MINIMA_ADOCAO = 21;
const FILHOTE_MAX_MESES   = 12;
const REGION_RADIUS_KM    = 500;

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

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

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

/* ===========================================================
   2. ESTADO DA APLICAÇÃO
=========================================================== */
const state = {
  pets: [],
  user: null,
  interesses: [],   // array of pet IDs
  recusas: [],      // array of pet IDs
  interessados: [], // [{petId, nome, telefone, email}]
  activeFilter: 'todos',
  searchTerm: '',
  currentExploreId: null,
  geo: null,
  editingPetId: null,
  pendingImage: '',      // URL/dataURL for preview
  pendingImageFile: null // File object for upload
};

const $id = (id) => document.getElementById(id);

/* ===========================================================
   3. API HELPER
=========================================================== */
async function api(action, data, method) {
  method = method || (data ? 'POST' : 'GET');
  const url = 'api.php?action=' + action;
  const opts = { method, credentials: 'same-origin', cache: 'no-store' };

  if (data instanceof FormData) {
    opts.body = data;
  } else if (data) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, opts);
    return await res.json();
  } catch (e) {
    return { success: false, message: 'Erro de conexão com o servidor.' };
  }
}

/* ===========================================================
   4. NORMALIZAÇÃO DE DADOS DA API
=========================================================== */
function normalizePet(p) {
  const splitArr = (s) => s ? String(s).split(',').map(t => t.trim()).filter(Boolean) : [];
  return {
    id: Number(p.id),
    nome: p.nome_pet || '',
    especie: p.especie || '',
    raca: p.raca || '',
    idade: p.idade_aproximada || '',
    idadeMeses: Number(p.idade_meses) || 0,
    sexo: p.sexo || '',
    cidade: p.cidade || '',
    uf: p.uf || '',
    bairro: p.bairro || '',
    localizacao: `${p.cidade || ''}/${p.uf || ''}`,
    status: p.status || 'Disponível',
    imagem: (function() {
      const img = p.imagem || '';
      if (!img) return '/assets/luna-hero.png';
      if (img.startsWith('http') || img.startsWith('/')) return img;
      return '/' + img; // relativo→absoluto: uploads/xxx → /uploads/xxx
    })(),
    descricao: p.descricao || '',
    temperamento: Array.isArray(p.temperamento_arr) ? p.temperamento_arr : splitArr(p.temperamento),
    larIdeal: Array.isArray(p.lar_ideal_arr) ? p.lar_ideal_arr : splitArr(p.lar_ideal),
    cadastradoPorUserId: Number(p.usuario_doador_id) || 0,
    responsavel: {
      nome: p.responsavel_nome || '',
      telefone: p.responsavel_telefone || '',
      tipo: p.responsavel_tipo || ''
    },
    doacao: {
      tipo: p.tipo_cadastro || 'Pet individual',
      quantidade: Number(p.quantidade) || 1
    },
    fichaMedica: {
      leishmaniose: p.leishmaniose || 'Não testado',
      vermifugo: !!Number(p.vermifugo),
      v8v10: !!Number(p.v8_v10),
      antirrabica: !!Number(p.antirrabica),
      gripeCanina: !!Number(p.gripe_canina),
      giardia: !!Number(p.giardia),
      v4v5: !!Number(p.v4_v5),
      felv: !!Number(p.felv),
      castrado: !!Number(p.castrado),
      vacinaPrincipal: '',
      condicaoEspecial: p.condicao_especial || '',
      observacoes: p.observacoes_veterinarias || ''
    }
  };
}

function normalizeUser(u) {
  if (!u) return null;
  return {
    id: Number(u.id),
    tipoCadastro: u.tipo_cadastro || 'adotar',
    nome: u.nome_completo || u.nome || '',
    cpf: u.cpf || '',
    email: u.email || '',
    telefone: u.telefone || '',
    nascimento: u.data_nascimento || '',
    idade: Number(u.idade) || null,
    maior21: !!Number(u.maior21),
    cep: '',
    cidade: u.cidade || '',
    uf: u.uf || '',
    bairro: u.bairro || '',
    moradia: u.tipo_moradia || '',
    outrosAnimais: u.possui_outros_animais || '',
    jaAdotou: u.ja_adotou_antes || '',
    aceitaTermos: !!Number(u.aceita_termos)
  };
}

/* ===========================================================
   5. CARREGAR DADOS DA API
=========================================================== */
async function loadPetsFromAPI() {
  const r = await api('listar_pets');
  if (r.success && Array.isArray(r.data)) {
    state.pets = r.data.map(normalizePet);
  }
}

async function loadSessionFromAPI() {
  const r = await api('sessao');
  if (r.success && r.data) {
    state.user = normalizeUser(r.data);
  } else {
    state.user = null;
  }
}

async function loadUserDataFromAPI() {
  if (!state.user) return;
  const [intR, recR, meusPetsR] = await Promise.all([
    api('meus_interesses'),
    api('minhas_recusas'),
    api('meus_pets')
  ]);

  // Interesses: array de pet_ids
  if (intR.success && Array.isArray(intR.data)) {
    state.interesses = intR.data.map(r => Number(r.pet_id));
  } else {
    state.interesses = [];
  }

  // Recusas: array de pet_ids
  if (recR.success && Array.isArray(recR.data)) {
    state.recusas = recR.data.map(r => Number(r.pet_id));
  } else {
    state.recusas = [];
  }

  // Interessados nos meus pets
  state.interessados = [];
  if (meusPetsR.success && Array.isArray(meusPetsR.data)) {
    meusPetsR.data.forEach(pet => {
      const petId = Number(pet.id);
      (pet.interessados || []).forEach(r => {
        state.interessados.push({
          petId,
          interesseId: Number(r.id),
          nome: r.nome_completo || '',
          telefone: r.telefone || '',
          email: r.email || '',
          mensagem: r.mensagem || '',
          status: r.status || 'Interesse enviado',
          criadoEm: r.criado_em || '',
          // dados do cadastro da pessoa interessada
          cidade: r.cidade || '',
          uf: r.uf || '',
          bairro: r.bairro || '',
          idade: r.idade != null ? Number(r.idade) : null,
          maior21: Number(r.maior21) === 1,
          tipoMoradia: r.tipo_moradia || '',
          possuiOutrosAnimais: r.possui_outros_animais || '',
          jaAdotouAntes: r.ja_adotou_antes || '',
          aceitaTermos: Number(r.aceita_termos) === 1
        });
      });
    });
  }
}

/* helpers síncronos */
function getPet(id) { return state.pets.find(p => p.id === id) || null; }

/* ===========================================================
   6. UTILITÁRIOS HTML / TEXTO
=========================================================== */
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function normalizarTexto(texto) {
  return String(texto == null ? '' : texto)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim();
}
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function optionsHtml(values, selected) {
  return values.map(v => `<option${v === selected ? ' selected' : ''}>${escapeHtml(v)}</option>`).join('');
}

/* ===========================================================
   7. USUÁRIO — STATUS / VALIDAÇÃO
=========================================================== */
function isUserRegistered() { return !!state.user; }

function updateUserStatus() {
  const logged = isUserRegistered();
  const nameEl  = $id('navUserName');
  const btnAuth  = $id('btnAuth');
  const btnLogin = $id('btnLogin');
  const userMenu = $id('userMenu');

  if (nameEl && logged) nameEl.textContent = (state.user.nome || '').split(' ')[0];
  if (btnAuth)  btnAuth.hidden  = logged;
  if (btnLogin) btnLogin.hidden = logged;
  if (userMenu) userMenu.hidden = !logged;

  const heroCad = $id('heroCadastroLink');
  if (heroCad) {
    heroCad.href = logged ? 'perfil.html' : 'cadastro.html';
    heroCad.textContent = logged ? 'Minha conta' : 'Fazer cadastro';
  }
}

/* ── CPF ── */
function limparCPF(cpf) { return String(cpf == null ? '' : cpf).replace(/\D/g, ''); }
function aplicarMascaraCPF(cpf) {
  const n = limparCPF(cpf).slice(0, 11);
  return n.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
function validarCPF(cpf) {
  const n = limparCPF(cpf);
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(n[i]) * (10 - i);
  let r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(n[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(n[i]) * (11 - i);
  r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(n[10]);
}
function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}
function configurarMascaraCPF(ids) {
  (ids || ['u_cpf']).forEach(id => {
    const el = $id(id);
    if (!el || el._cpfMasked) return;
    el._cpfMasked = true;
    el.setAttribute('maxlength', '14');
    el.addEventListener('input', () => { el.value = aplicarMascaraCPF(el.value); el.classList.remove('input-error'); });
  });
}

/* ── TELEFONE ── */
function limparTelefone(tel) { return String(tel == null ? '' : tel).replace(/\D/g, ''); }
function aplicarMascaraTelefone(tel) {
  const n = limparTelefone(tel).slice(0, 11);
  if (!n) return '';
  if (n.length <= 2) return '(' + n;
  if (n.length <= 6) return '(' + n.slice(0,2) + ') ' + n.slice(2);
  if (n.length <= 10) return '(' + n.slice(0,2) + ') ' + n.slice(2,6) + '-' + n.slice(6);
  return '(' + n.slice(0,2) + ') ' + n.slice(2,7) + '-' + n.slice(7);
}
function validarTelefone(tel) {
  const n = limparTelefone(tel);
  if (n.length !== 10 && n.length !== 11) return false;
  if (n[0] === '0') return false;
  if (n.length === 11 && n[2] !== '9') return false;
  return true;
}
function configurarMascaraTelefone(ids) {
  (ids || []).forEach(id => {
    const el = $id(id);
    if (!el || el._telMasked) return;
    el._telMasked = true;
    el.setAttribute('maxlength', '15');
    el.addEventListener('input', () => { el.value = aplicarMascaraTelefone(el.value); el.classList.remove('input-error'); });
  });
}

/* ── CEP ── */
function aplicarMascaraCep(value) {
  const n = String(value == null ? '' : value).replace(/\D/g, '').slice(0, 8);
  return n.length <= 5 ? n : n.slice(0,5) + '-' + n.slice(5);
}
function preencherEndereco(id, value) {
  const el = $id(id);
  if (!el || !value) return;
  el.value = value;
  el.classList.remove('input-error');
}
function buscarCep(cepNum, campos, cepEl) {
  if (cepEl._buscandoCep) return;
  cepEl._buscandoCep = true;
  showToast('Buscando endereço pelo CEP...', 'info');
  fetch(`https://viacep.com.br/ws/${cepNum}/json/`)
    .then(r => r.json())
    .then(data => {
      if (data.erro) { cepEl.classList.add('input-error'); showToast('CEP não encontrado. Verifique o número ou preencha o endereço manualmente.', 'warning'); return; }
      preencherEndereco(campos.cidade, data.localidade);
      preencherEndereco(campos.uf, data.uf);
      preencherEndereco(campos.bairro, data.bairro);
      showToast('Endereço preenchido pelo CEP. ✅', 'success');
      const bairroEl = $id(campos.bairro);
      if (bairroEl && !data.bairro) bairroEl.focus();
    })
    .catch(() => showToast('Não foi possível buscar o CEP agora. Preencha o endereço manualmente.', 'warning'))
    .finally(() => { cepEl._buscandoCep = false; });
}
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
    if (num.length === 8 && num !== el._ultimoCep) { el._ultimoCep = num; buscarCep(num, campos, el); }
    else if (num.length < 8) el._ultimoCep = '';
  });
}

/* ── DATA ── */
function aplicarMascaraData(value) {
  const n = String(value == null ? '' : value).replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return n.slice(0,2) + '/' + n.slice(2);
  return n.slice(0,2) + '/' + n.slice(2,4) + '/' + n.slice(4);
}
function parseDataBR(str) {
  if (!str) return null;
  const s = String(str).trim();
  let d, m, y, mt;
  if ((mt = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) { d=+mt[1]; m=+mt[2]; y=+mt[3]; }
  else if ((mt = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) { y=+mt[1]; m=+mt[2]; d=+mt[3]; }
  else return null;
  if (m<1||m>12||d<1||d>31) return null;
  const date = new Date(y, m-1, d);
  if (date.getFullYear()!==y||date.getMonth()!==m-1||date.getDate()!==d) return null;
  return date;
}
function validarData(str) {
  const d = parseDataBR(str);
  return d && d <= new Date() && d.getFullYear() >= 1900;
}
function dataParaISO(str) {
  const d = parseDataBR(str);
  if (!d) return '';
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function configurarMascaraData(ids) {
  (ids || []).forEach(id => {
    const el = $id(id);
    if (!el || el._dataMasked) return;
    el._dataMasked = true;
    el.setAttribute('maxlength','10');
    el.setAttribute('inputmode','numeric');
    el.addEventListener('input', () => { el.value = aplicarMascaraData(el.value); el.classList.remove('input-error'); });
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
const calcularIdade = calcIdade;

/* ===========================================================
   8. CADASTRO DE USUÁRIO (cadastro.html)
=========================================================== */
function validateUserForm() {
  const f = $id('userForm');
  if (!f) return { valid: true, message: '', errors: [] };
  const get = (name) => (f.elements[name] ? f.elements[name].value.trim() : '');
  const errors = [];

  const nome     = get('nome');
  const cpf      = get('cpf');
  const email    = get('email');
  const telefone = get('telefone');
  const nasc     = get('nascimento');
  const cidade   = get('cidade');
  const uf       = get('uf');
  const bairro   = get('bairro');
  const moradia  = get('moradia');
  const outros   = get('outrosAnimais');
  const jaAdot   = get('jaAdotou');
  const senha    = get('senha');
  const conf     = get('confirmaSenha');
  const termos   = f.elements['termos'] ? f.elements['termos'].checked : false;

  const cpfValido   = validarCPF(cpf);
  const emailValido = validarEmail(email);
  const telValido   = validarTelefone(telefone);
  const dataValida  = validarData(nasc);
  if (f.elements['cpf'])        f.elements['cpf'].classList.toggle('input-error', !!cpf && !cpfValido);
  if (f.elements['email'])      f.elements['email'].classList.toggle('input-error', !!email && !emailValido);
  if (f.elements['telefone'])   f.elements['telefone'].classList.toggle('input-error', !!telefone && !telValido);
  if (f.elements['nascimento']) f.elements['nascimento'].classList.toggle('input-error', !!nasc && !dataValida);

  if (!nome)       errors.push('Informe o nome completo.');
  if (!cpf)        errors.push('Informe o CPF.');
  else if (!cpfValido) errors.push('CPF inválido. Verifique os números informados.');
  if (!emailValido) errors.push('Informe um e-mail válido.');
  if (!telefone)   errors.push('Informe o telefone / WhatsApp.');
  else if (!telValido) errors.push('Telefone inválido. Use DDD + número, ex.: (31) 99999-9999.');
  if (!cidade)     errors.push('Informe a cidade.');
  if (!uf)         errors.push('Selecione a UF.');
  if (!bairro)     errors.push('Informe o bairro.');
  if (!moradia)    errors.push('Selecione o tipo de moradia.');
  if (!outros)     errors.push('Informe se possui outros animais.');
  if (!jaAdot)     errors.push('Informe se já adotou antes.');
  if (!nasc)       errors.push('Informe a data de nascimento.');
  else if (!dataValida) errors.push('Data de nascimento inválida. Use o formato dd/mm/aaaa.');
  if (senha.length < 6) errors.push('A senha deve ter no mínimo 6 caracteres.');
  if (senha !== conf)   errors.push('A confirmação de senha não confere.');
  if (!termos)     errors.push('É preciso aceitar os termos de adoção responsável.');

  return { valid: errors.length === 0, message: errors[0] || '', errors };
}

async function handleUserSubmit(event) {
  event.preventDefault();
  const f = event.target;
  const errBox = $id('userFormError');
  const result = validateUserForm();

  if (!result.valid) {
    if (errBox) errBox.textContent = result.message;
    showToast(result.message, 'error');
    return;
  }
  if (errBox) errBox.textContent = '';

  const get = (name) => (f.elements[name] ? f.elements[name].value.trim() : '');
  const nascISO = dataParaISO(get('nascimento'));

  const payload = {
    nome: get('nome'),
    cpf: aplicarMascaraCPF(get('cpf')),
    email: get('email'),
    telefone: aplicarMascaraTelefone(get('telefone')),
    data_nascimento: nascISO,
    senha: get('senha'),
    tipo_cadastro: get('tipoCadastro') || 'adotar',
    tipo_moradia: get('moradia'),
    possui_outros_animais: get('outrosAnimais'),
    ja_adotou_antes: get('jaAdotou'),
    cidade: get('cidade'),
    uf: get('uf'),
    bairro: get('bairro'),
    aceita_termos: f.elements['termos'] && f.elements['termos'].checked ? 1 : 0
  };

  const btn = f.querySelector('button[type="submit"]');
  if (btn) btn.disabled = true;

  const r = await api('registrar_usuario', payload);

  if (btn) btn.disabled = false;

  if (!r.success) {
    if (errBox) errBox.textContent = r.message;
    showToast(r.message, 'error');
    return;
  }

  // Carrega dados completos da sessão recém-criada
  await loadSessionFromAPI();
  updateUserStatus();

  if (state.user && state.user.maior21) {
    showToast(`Cadastro concluído! Bem-vindo(a), ${(state.user.nome || '').split(' ')[0]} 🐾`, 'success');
  } else {
    showToast('Cadastro realizado, mas não habilitado para demonstrar interesse. A idade mínima exigida é 21 anos.', 'warning');
  }

  renderCurrentPet();
  renderPetLists();
  setTimeout(() => { window.location.href = 'index.html#explorar'; }, 1000);
}

/* ===========================================================
   9. LOGIN (login.html)
=========================================================== */
async function handleLoginSubmit(event) {
  event.preventDefault();
  const f = event.target;
  const errBox = $id('loginFormError');
  const get = (name) => (f.elements[name] ? f.elements[name].value.trim() : '');

  const email = get('email');
  const senha  = get('senha');

  if (!validarEmail(email) || !senha) {
    const msg = 'Informe e-mail e senha para entrar.';
    if (errBox) errBox.textContent = msg;
    showToast(msg, 'error');
    return;
  }

  const btn = f.querySelector('button[type="submit"]');
  if (btn) btn.disabled = true;

  const r = await api('login', { email, senha });

  if (btn) btn.disabled = false;

  if (!r.success) {
    if (errBox) errBox.textContent = r.message;
    showToast(r.message, 'error');
    if (f.elements['senha']) f.elements['senha'].classList.add('input-error');
    return;
  }

  state.user = normalizeUser(r.data);
  updateUserStatus();
  await loadUserDataFromAPI();
  showToast(`Bem-vindo(a) de volta, ${(state.user.nome || '').split(' ')[0]}! 🐾`, 'success');
  setTimeout(() => { window.location.href = 'perfil.html'; }, 900);
}

/* ===========================================================
   10. LOGOUT
=========================================================== */
async function logoutUser() {
  await api('logout', {});
  state.user = null;
  state.interesses = [];
  state.recusas = [];
  state.interessados = [];
  updateUserStatus();
  showToast('Você saiu da sua conta.', 'info');
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}

/* ===========================================================
   11. BUSCA E FILTROS
=========================================================== */
function cityLatLng(cidade, uf) {
  const key = normalizarTexto(cidade) + '/' + String(uf || '').toLowerCase();
  return CITY_COORDS[key] || UF_COORDS[String(uf || '').toUpperCase()] || null;
}
function petLatLng(pet) {
  const base = cityLatLng(pet.cidade, pet.uf);
  if (!base) return null;
  const id = Number(pet.id) || 0;
  return [base[0] + (((id*73)%100)/100-0.5)*0.05, base[1] + (((id*137)%100)/100-0.5)*0.05];
}
function haversineKm(a, b) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(b[0]-a[0]), dLng = toRad(b[1]-a[1]);
  const h = Math.sin(dLat/2)**2 + Math.cos(toRad(a[0]))*Math.cos(toRad(b[0]))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function userOrigin() {
  if (state.geo) return [state.geo.lat, state.geo.lng];
  if (isUserRegistered()) return cityLatLng(state.user.cidade, state.user.uf);
  return null;
}
function isNearUser(pet) {
  const origin = userOrigin();
  if (!origin) return true;
  const ll = cityLatLng(pet.cidade, pet.uf);
  if (!ll) return false;
  return haversineKm(origin, ll) <= REGION_RADIUS_KM;
}
function matchesSearch(pet, term) {
  if (!term) return true;
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
  const mapEl = $id('mapa');
  const isPerto = filterName === 'perto';
  if (mapEl) mapEl.hidden = !isPerto;
  if (isPerto) {
    ensureGeoForRegion();
    renderMap(true);
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (_map) setTimeout(() => _map.invalidateSize(), 350);
    }
  }
}
function ensureGeoForRegion() {
  if (state.geo || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos => {
      state.geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      renderPetLists(); renderCurrentPet();
      if (state.activeFilter === 'perto') renderMap(true);
    },
    () => {},
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
  );
}

/* ===========================================================
   12. EXPLORAR PETS (estilo Tinder)
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
  if (fm.v4v5)  return { label: 'V4/V5', yes: true };
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
  if (status === 'Disponível')   return 'badge-ok';
  if (status === 'Indisponível') return 'badge-warn';
  return 'badge-adopt';
}

function renderCurrentPet() {
  const stage   = $id('exploreStage');
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
      state.searchTerm = ''; setActiveFilter('todos');
    });
    return;
  }

  if (actions) actions.style.display = 'flex';
  if (!queue.includes(state.currentExploreId)) state.currentExploreId = queue[0];

  const pet    = getPet(state.currentExploreId);
  const temper = (pet.temperamento || []).map(t => `<span class="tag tag--temper">${escapeHtml(t)}</span>`).join('');
  const qtd    = pet.doacao && pet.doacao.tipo === 'Filhotes/Ninhada' ? ` · ${pet.doacao.quantidade} filhotes` : '';

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
  if (card) { card.classList.add(cls); setTimeout(renderCurrentPet, 280); }
  else renderCurrentPet();
}

function nextPet() {
  const queue = buildExploreQueue();
  if (!queue.length) { renderCurrentPet(); return; }
  const i = queue.indexOf(state.currentExploreId);
  state.currentExploreId = queue[(i + 1) % queue.length];
  renderCurrentPet();
}

async function registerRefusal(petId) {
  if (!petId) return;
  if (!state.recusas.includes(petId)) {
    state.recusas.push(petId);
    if (isUserRegistered()) {
      api('registrar_recusa', { pet_id: petId }); // fire-and-forget
    }
  }
  advanceExplore('left');
}

function usuarioPodeEnviarInteresse() {
  const u = state.user;
  if (!u) {
    showToast('Para demonstrar interesse neste pet, faça seu cadastro primeiro.', 'warning');
    setTimeout(() => { window.location.href = 'cadastro.html'; }, 1000);
    return false;
  }
  const maior21 = u.maior21;
  if (!maior21) {
    showToast('Para demonstrar interesse em adoção, é necessário ter 21 anos ou mais.', 'error');
    return false;
  }
  if (u.aceitaTermos === false) {
    showToast('Para demonstrar interesse, é necessário aceitar os termos de adoção responsável.', 'warning');
    return false;
  }
  return true;
}

async function registerInterest(petId) {
  if (!petId) return;
  if (!usuarioPodeEnviarInteresse()) { closePetDetails(); return; }

  const pet = getPet(petId);
  if (state.interesses.includes(petId)) {
    showToast('Você já demonstrou interesse neste pet.', 'info');
    closePetDetails(); renderCurrentPet(); return;
  }

  const r = await api('registrar_interesse', { pet_id: petId });
  if (!r.success) {
    showToast(r.message, 'error'); return;
  }

  state.interesses.push(petId);
  showToast(`Interesse registrado em ${pet ? pet.nome : 'pet'}. A ONG ou responsável poderá entrar em contato para dar continuidade ao processo. 💛`, 'success');

  const modalAberto = !$id('modalOverlay').hidden;
  closePetDetails();
  if (modalAberto && state.currentExploreId !== petId) renderCurrentPet();
  else advanceExplore('right');
  renderPetLists();
}

/* ===========================================================
   13. LISTAGEM DE PETS
=========================================================== */
function petCardHtml(pet) {
  const tags = (pet.temperamento || []).slice(0, 3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
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
          ${state.user && pet.cadastradoPorUserId === state.user.id
            ? `<button class="btn-ver-interessados" type="button" data-interessados="${pet.id}">👥 Ver interessados (${state.interessados.filter(r=>r.petId===pet.id).length})</button>`
            : pet.status === 'Disponível'
              ? `<button class="btn-interest" type="button" data-interest="${pet.id}">💛 Tenho interesse</button>`
              : ''}
        </div>
      </div>
    </div>`;
}

function renderInto(container, pets, emptyMsg) {
  if (!container) return;
  container.innerHTML = pets.length ? pets.map(petCardHtml).join('') : `<div class="grid-empty">${emptyMsg}</div>`;
}

function emptyListMsg(tipo) {
  if (state.activeFilter === 'perto') {
    return userOrigin() ? `Nenhum pet ${tipo} na sua região no momento.` : `Nenhum pet ${tipo} para os filtros atuais.`;
  }
  return `Nenhum pet ${tipo} para os filtros atuais.`;
}

function renderPetLists() {
  const filtered = filterPets();
  const disp   = filtered.filter(p => p.status === 'Disponível');
  const indisp = filtered.filter(p => p.status === 'Indisponível');
  const adot   = filtered.filter(p => p.status === 'Adotado');

  renderInto($id('listDisponiveis'), disp, emptyListMsg('disponível'));
  renderInto($id('listIndisponiveis'), indisp, emptyListMsg('indisponível'));
  renderInto($id('listAdotados'), adot, emptyListMsg('adotado'));

  const countEl = $id('listCount');
  if (countEl) countEl.textContent = `${filtered.length} pet(s) encontrado(s) — ${disp.length} disponível(is), ${indisp.length} indisponível(is), ${adot.length} adotado(s).`;
}

async function handleRemovePet(petId) {
  const pet = getPet(petId);
  if (!pet) return;
  openConfirm({
    icon: '🗑️',
    title: 'Remover pet',
    message: `Tem certeza que deseja remover <strong>${escapeHtml(pet.nome)}</strong>?<br>Esta ação não pode ser desfeita.`,
    confirmLabel: 'Sim, excluir',
    onConfirm: async () => {
      const r = await api('excluir_pet', { id: petId });
      if (!r.success) { showToast(r.message || 'Erro ao remover o pet.', 'error'); return; }
      state.pets = state.pets.filter(p => p.id !== petId);
      state.interesses   = state.interesses.filter(id => id !== petId);
      state.recusas      = state.recusas.filter(id => id !== petId);
      state.interessados = state.interessados.filter(r => r.petId !== petId);
      renderCounters(); renderPetLists(); renderCurrentPet(); renderProfile();
      showToast(`${pet.nome} foi removido com sucesso.`, 'success');
    }
  });
}

function renderCounters() {
  const disponiveis = state.pets.filter(p => p.status === 'Disponível').length;
  const adotados    = state.pets.filter(p => p.status === 'Adotado').length;
  const ongs = new Set(
    state.pets.filter(p => p.responsavel && (p.responsavel.tipo === 'ONG' || p.responsavel.tipo === 'Lar temporário'))
              .map(p => p.responsavel.nome)
  ).size;
  const pessoas = state.pets.filter(p => p.responsavel && p.responsavel.tipo === 'Pessoa física').length;

  animateCount('statDisponiveis', disponiveis);
  animateCount('statAdotados', adotados);
  animateCount('statOngs', ongs);
  animateCount('statPessoas', pessoas);
}

function animateCount(id, to, duration) {
  const el = $id(id);
  if (!el) return;
  to = Number(to) || 0;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const from = Number(String(el.textContent).replace(/\D/g, '')) || 0;
  if (reduce || from === to) { el.textContent = to; return; }
  duration = duration || 1000;
  const start = performance.now();
  const ease  = t => 1 - Math.pow(1 - t, 3);
  if (el._countRAF) cancelAnimationFrame(el._countRAF);
  el.classList.add('counting');
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(from + (to - from) * ease(p));
    if (p < 1) el._countRAF = requestAnimationFrame(tick);
    else { el.textContent = to; el._countRAF = null; el.classList.remove('counting'); }
  }
  el._countRAF = requestAnimationFrame(tick);
}

/* ===========================================================
   14. CADASTRO DE PET (cadastrar-pet.html)
=========================================================== */
function updateBreedOptions(species) {
  const sel = $id('p_raca');
  if (!sel) return;
  const lista = RACAS[species];
  if (!lista) { sel.innerHTML = '<option value="">Selecione a espécie primeiro</option>'; return; }
  sel.innerHTML = '<option value="">Selecione</option>' + lista.map(r => `<option>${r}</option>`).join('');
}

function toggleNinhadaFields() {
  const tipo = $id('p_tipoCadastro');
  if (!tipo) return;
  const isNinhada = tipo.value === 'Filhotes/Ninhada';
  const g = $id('grupoQuantidade');
  const l = $id('labelNome');
  const n = $id('p_nome');
  if (g) g.hidden = !isNinhada;
  if (l) l.textContent = isNinhada ? 'Identificação da ninhada *' : 'Nome do pet *';
  if (n) n.placeholder = isNinhada ? 'Ex.: Ninhada da Mel' : 'Ex.: Bolinha';
}

function atualizarIdadeSpinner() {
  const anosEl  = $id('p_idadeAnos');
  const mesesEl = $id('p_idadeMesesSpinner');
  if (!anosEl && !mesesEl) return;
  const anos  = Math.max(0, parseInt((anosEl  && anosEl.value)  || '0', 10) || 0);
  const meses = Math.max(0, parseInt((mesesEl && mesesEl.value) || '0', 10) || 0);
  const total = anos * 12 + meses;
  let texto;
  if (anos > 0 && meses > 0) {
    texto = `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  } else if (anos > 0) {
    texto = `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  } else if (meses > 0) {
    texto = `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  } else {
    texto = 'Menos de 1 mês';
  }
  const res = $id('idadeResultado');
  if (res) res.textContent = `${texto} · ${total} ${total === 1 ? 'mês' : 'meses'}`;
  const hi = $id('p_idade');
  const hm = $id('p_idadeMeses');
  if (hi) hi.value = texto;
  if (hm) hm.value = String(total);
}

function handleImagePreview(event) {
  const file = event.target.files && event.target.files[0];
  const box = $id('imagePreview');
  const img = $id('imagePreviewImg');
  if (!file) { state.pendingImage = ''; state.pendingImageFile = null; if (box) box.hidden = true; return; }
  state.pendingImageFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    state.pendingImage = e.target.result;
    if (img) img.src = state.pendingImage;
    if (box) box.hidden = false;
  };
  reader.readAsDataURL(file);
}

function prefillPetForm(pet) {
  const f = $id('petForm');
  if (!f) return;
  const fm   = pet.fichaMedica || {};
  const resp = pet.responsavel || {};
  const doa  = pet.doacao || {};

  const set    = (name, value) => { if (f.elements[name]) f.elements[name].value = (value == null ? '' : value); };
  const setSel = (name, value) => {
    const el = f.elements[name]; if (!el) return;
    const v = (value == null ? '' : String(value));
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
  const _mT    = Number(pet.idadeMeses) || 0;
  const _aEl   = $id('p_idadeAnos');
  const _mEl   = $id('p_idadeMesesSpinner');
  if (_aEl)  _aEl.value  = Math.floor(_mT / 12);
  if (_mEl)  _mEl.value  = _mT % 12;
  atualizarIdadeSpinner();
  setSel('sexo', pet.sexo);
  set('cidade', pet.cidade);
  setSel('uf', pet.uf);
  set('bairro', pet.bairro);
  setSel('status', pet.status);
  set('descricao', pet.descricao);
  set('temperamento', (pet.temperamento || []).join(', '));
  set('larIdeal', (pet.larIdeal || []).join(', '));

  // Imagem atual
  state.pendingImage    = pet.imagem || '';
  state.pendingImageFile = null;
  const box = $id('imagePreview');
  const img = $id('imagePreviewImg');
  if (state.pendingImage && box && img) { img.src = state.pendingImage; box.hidden = false; }

  setSel('leishmaniose', fm.leishmaniose);
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
  setChk('declaroResponsavel', true);
}

async function initPetEditMode() {
  const petForm = $id('petForm');
  if (!petForm) return;

  const editId = Number(new URLSearchParams(window.location.search).get('edit'));
  if (!editId) return;

  if (!isUserRegistered()) { showToast('Faça login para editar um pet.', 'warning'); return; }

  const pet = getPet(editId);
  if (!pet) { showToast('Pet não encontrado.', 'error'); return; }
  if (pet.cadastradoPorUserId && state.user && pet.cadastradoPorUserId !== state.user.id) {
    showToast('Você só pode editar pets que você cadastrou.', 'warning'); return;
  }

  state.editingPetId = pet.id;
  prefillPetForm(pet);

  const title = document.querySelector('.page-title');
  if (title) title.textContent = `Editar ${pet.nome}`;
  const lead = document.querySelector('.page-lead');
  if (lead) lead.textContent = 'Atualize as informações do pet. As mudanças aparecem na hora na listagem e no mapa.';
  const submitBtn = petForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Salvar alterações 💾';
}

function validatePetForm() {
  const f = $id('petForm');
  if (!f) return { valid: false, message: 'Formulário não encontrado.', errors: [] };
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
  if (isNinhada && (get('quantidade') === '' || Number(get('quantidade')) < 2)) errors.push('Informe a quantidade de filhotes (mínimo 2).');
  if (!get('cidade')) errors.push('Informe a cidade.');
  if (!get('uf')) errors.push('Selecione a UF.');
  if (!get('bairro')) errors.push('Informe o bairro.');
  if (!get('descricao')) errors.push('Descreva a história do animal.');
  if (!state.pendingImage && !state.pendingImageFile) errors.push('A imagem do pet é obrigatória.');
  if (!f.elements['declaroResponsavel'] || !f.elements['declaroResponsavel'].checked) errors.push('Confirme a declaração de responsabilidade pelas informações do pet.');

  return { valid: errors.length === 0, message: errors[0] || '', errors };
}

async function handlePetSubmit(event) {
  event.preventDefault();

  if (!isUserRegistered()) {
    showToast('Para cadastrar um pet para doação, faça seu cadastro primeiro.', 'warning');
    setTimeout(() => { window.location.href = 'cadastro.html'; }, 1000);
    return;
  }

  const f = event.target;
  const errBox = $id('petFormError');
  const result = validatePetForm();

  if (!result.valid) {
    if (errBox) errBox.textContent = result.message;
    showToast(result.message, 'error');
    return;
  }
  if (errBox) errBox.textContent = '';

  const get      = (name) => (f.elements[name] ? f.elements[name].value.trim() : '');
  const chk      = (name) => f.elements[name] ? f.elements[name].checked : false;
  const isNinhada = get('tipoCadastro') === 'Filhotes/Ninhada';
  const editing   = state.editingPetId != null;

  const fd = new FormData();
  fd.append('nome_pet',           get('nome'));
  fd.append('especie',            get('especie'));
  fd.append('raca',               get('raca'));
  fd.append('idade_aproximada',   get('idade'));
  fd.append('idade_meses',        get('idadeMeses'));
  fd.append('sexo',               get('sexo'));
  fd.append('cidade',             get('cidade'));
  fd.append('uf',                 get('uf'));
  fd.append('bairro',             get('bairro'));
  fd.append('status',             get('status') || 'Disponível');
  fd.append('descricao',          get('descricao'));
  fd.append('temperamento',       get('temperamento'));
  fd.append('lar_ideal',          get('larIdeal'));
  fd.append('responsavel_nome',   get('responsavelNome'));
  fd.append('responsavel_telefone', aplicarMascaraTelefone(get('responsavelTelefone')));
  fd.append('responsavel_tipo',   get('responsavelTipo'));
  fd.append('tipo_cadastro',      isNinhada ? 'Filhotes/Ninhada' : 'Pet individual');
  fd.append('quantidade',         isNinhada ? get('quantidade') : '1');
  fd.append('leishmaniose',       get('leishmaniose') || 'Não testado');
  fd.append('vermifugo',          chk('vermifugo') ? '1' : '0');
  fd.append('v8_v10',             chk('v8v10')     ? '1' : '0');
  fd.append('antirrabica',        chk('antirrabica')  ? '1' : '0');
  fd.append('gripe_canina',       chk('gripeCanina')  ? '1' : '0');
  fd.append('giardia',            chk('giardia')   ? '1' : '0');
  fd.append('v4_v5',              chk('v4v5')      ? '1' : '0');
  fd.append('felv',               chk('felv')      ? '1' : '0');
  fd.append('castrado',           chk('castrado')  ? '1' : '0');
  fd.append('condicao_especial',  get('condicaoEspecial'));
  fd.append('observacoes_veterinarias', get('observacoes'));

  if (editing) fd.append('id', String(state.editingPetId));

  // Imagem: arquivo novo ou URL existente
  if (state.pendingImageFile) {
    fd.append('imagem', state.pendingImageFile);
  }

  const btn = f.querySelector('button[type="submit"]');
  if (btn) btn.disabled = true;

  const action = editing ? 'atualizar_pet' : 'criar_pet';
  const r = await api(action, fd);

  if (btn) btn.disabled = false;

  if (!r.success) {
    if (errBox) errBox.textContent = r.message;
    showToast(r.message, 'error');
    return;
  }

  // Recarrega lista de pets e dados do usuário (meus pets + interessados)
  await loadPetsFromAPI();
  if (state.user) await loadUserDataFromAPI();

  f.reset();
  state.pendingImage    = '';
  state.pendingImageFile = null;
  const imgPreview = $id('imagePreview');
  if (imgPreview) imgPreview.hidden = true;
  updateBreedOptions('');
  toggleNinhadaFields();
  state.editingPetId = null;

  const nomePet = get('nome') || 'Pet';
  showToast(`${r.data && r.data.nome_pet ? r.data.nome_pet : (editing ? 'Pet' : nomePet)} foi ${editing ? 'atualizado(a)' : 'cadastrado(a)'} com sucesso! ${editing ? '💾' : '🐾'}`, 'success');

  renderCounters(); renderPetLists(); renderCurrentPet();
  const destino = editing ? 'perfil.html' : 'index.html#listagem';
  setTimeout(() => { window.location.href = destino; }, 1000);
}

/* ===========================================================
   15. MODAL DE DETALHES
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
  if (!content) return;

  const temper = (pet.temperamento || []).map(t => `<span class="tag tag--temper">${escapeHtml(t)}</span>`).join('') || '<span class="med-tag med-tag--no">Não informado</span>';
  const lar    = (pet.larIdeal || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') || '<span class="med-tag med-tag--no">Não informado</span>';

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

      <div class="modal-section"><h4>História completa</h4><p>${escapeHtml(pet.descricao)}</p></div>
      <div class="modal-section"><h4>Temperamento</h4><div class="tag-row">${temper}</div></div>
      <div class="modal-section"><h4>Lar ideal</h4><div class="tag-row">${lar}</div></div>
      <div class="modal-section"><h4>Ficha médica completa</h4><div class="modal-med-grid">${med}</div></div>

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

      ${state.user && pet.cadastradoPorUserId === state.user.id
        ? `<div class="modal-actions">
            <button class="btn-ver-interessados btn-full" type="button" data-interessados="${pet.id}">👥 Ver interessados (${state.interessados.filter(r=>r.petId===pet.id).length})</button>
          </div>`
        : pet.status === 'Disponível' ? `
      <div class="modal-note">⚠️ Enviar interesse não garante a adoção. A continuidade do processo depende da avaliação da ONG ou responsável pelo animal.</div>
      <div class="modal-actions">
        <button class="btn-primary btn-full" type="button" id="modalInterestBtn" data-id="${pet.id}">Tenho interesse 💛</button>
      </div>` : ''}
    </div>`;

  const overlay = $id('modalOverlay');
  if (overlay) { overlay.hidden = false; document.body.style.overflow = 'hidden'; }

  const interestBtn = $id('modalInterestBtn');
  if (interestBtn) interestBtn.addEventListener('click', () => registerInterest(Number(interestBtn.dataset.id)));
}

function closePetDetails() {
  const overlay = $id('modalOverlay');
  if (overlay) overlay.hidden = true;
  document.body.style.overflow = '';
}

/* ===========================================================
   16. TOAST
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
const mostrarToast = showToast;

/* ===========================================================
   16b. MODAL DE CONFIRMAÇÃO
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
  $id('confirmOk').addEventListener('click', () => { const fn = confirmOnOk; closeConfirm(); if (fn) fn(); });
  confirmEl.addEventListener('click', e => { if (e.target === confirmEl) closeConfirm(); });
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
   17. PERFIL DO USUÁRIO (perfil.html)
=========================================================== */
function maskCpf(cpf) {
  const d = String(cpf || '').replace(/\D/g, '');
  if (d.length !== 11) return cpf || '—';
  return `${d.slice(0,3)}.***.**${d.slice(9)}`;
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
  const tel  = resp.telefone ? resp.telefone.replace(/\D/g, '') : '';
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

async function removeInterest(petId) {
  await api('remover_interesse', { pet_id: petId });
  state.interesses = state.interesses.filter(id => id !== petId);
  showToast('Interesse removido.', 'info');
  renderProfile();
}

async function updateInterestStatus(interesseId, status) {
  const r = await api('atualizar_status_interesse', { interesse_id: interesseId, status });
  if (!r.success) {
    showToast(r.message || 'Não foi possível atualizar o andamento.', 'error');
    return;
  }
  // Atualiza o estado local para refletir imediatamente
  const item = state.interessados.find(i => i.interesseId === interesseId);
  if (item) item.status = status;
  showToast(r.message || 'Andamento da adoção atualizado.', 'success');
  renderProfile();
  renderCounters();
  renderPetLists();
}

function showInteressados(petId) {
  const pet = getPet(petId);
  if (!pet) return;
  const overlay  = $id('interessadosOverlay');
  const content  = $id('interessadosContent');
  const nameEl   = $id('interessadosNomePet');
  if (!overlay || !content) return;

  if (nameEl) nameEl.textContent = pet.nome;

  const lista      = state.interessados.filter(r => r.petId === petId);
  const petAdotado = pet.status === 'Adotado';

  content.innerHTML = lista.length
    ? lista.map(r => {
        const st = r.status || 'Interesse enviado';
        const opts = INTEREST_STATUSES
          .filter(s => s !== 'Adoção concluída' || st === 'Adoção concluída')
          .map(s => `<option value="${escapeHtml(s)}"${s === st ? ' selected' : ''}>${escapeHtml(s)}</option>`)
          .join('');
        const concluido = st === 'Adoção concluída';
        const confirmBtn = (!petAdotado && st !== 'Recusado')
          ? `<button class="btn-confirm-donation" type="button" data-confirm-donation="${r.interesseId}">🤝 Confirmar doação</button>`
          : (concluido ? '<span class="interest-adopted">🏡 Adotou este pet</span>' : '');
        return `
          <div class="interessado-card${concluido ? ' is-chosen' : ''}">
            <div class="interessado-head">
              <strong class="interessado-nome">${escapeHtml(r.nome || 'Interessado(a)')}</strong>
              <span class="interest-status ${interestStatusClass(st)}">${escapeHtml(st)}</span>
            </div>
            ${r.email    ? `<a class="interest-contact" href="mailto:${escapeHtml(r.email)}">✉️ ${escapeHtml(r.email)}</a>` : ''}
            ${r.telefone ? `<a class="interest-contact" href="tel:${escapeHtml(r.telefone.replace(/\D/g,''))}">📞 ${escapeHtml(r.telefone)}</a>` : ''}
            ${interestInfoHtml(r)}
            ${r.mensagem ? `<p class="interest-msg">💬 ${escapeHtml(r.mensagem)}</p>` : ''}
            <label class="interest-process">
              <span>Andamento da adoção:</span>
              <select class="interest-status-select" data-interesse-id="${r.interesseId}"${petAdotado ? ' disabled' : ''}>${opts}</select>
            </label>
            ${confirmBtn}
          </div>`;
      }).join('')
    : `<p class="interessados-empty">Ninguém demonstrou interesse ainda.</p>`;

  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeInteressados() {
  const overlay = $id('interessadosOverlay');
  if (overlay) overlay.hidden = true;
  document.body.style.overflow = '';
}

function confirmDonation(interesseId) {
  const item = state.interessados.find(i => i.interesseId === interesseId);
  if (!item) return;
  const pet = getPet(item.petId);
  openConfirm({
    icon: '🤝',
    title: 'Confirmar doação',
    message: `Confirmar a doação de <strong>${escapeHtml(pet ? pet.nome : 'este pet')}</strong> para <strong>${escapeHtml(item.nome || 'esta pessoa')}</strong>?<br>O pet será marcado como <strong>Adotado</strong> e os demais interesses serão recusados.`,
    confirmLabel: 'Sim, confirmar doação',
    onConfirm: async () => {
      const r = await api('confirmar_doacao', { interesse_id: interesseId });
      if (!r.success) { showToast(r.message || 'Não foi possível confirmar a doação.', 'error'); return; }
      // Reflete localmente: pet adotado, este interesse concluído, demais recusados
      if (pet) pet.status = 'Adotado';
      state.interessados.forEach(i => {
        if (i.petId === item.petId) i.status = (i.interesseId === interesseId) ? 'Adoção concluída' : 'Recusado';
      });
      showToast(r.message || 'Doação confirmada!', 'success');
      renderProfile();
      renderCounters();
      renderPetLists();
      const _io = $id('interessadosOverlay');
      if (_io && !_io.hidden) showInteressados(item.petId);
    }
  });
}

const INTEREST_STATUSES = ['Interesse enviado', 'Em conversa', 'Aprovado', 'Adoção concluída', 'Recusado'];

function interestStatusClass(status) {
  switch (status) {
    case 'Em conversa':      return 'is-talking';
    case 'Aprovado':         return 'is-approved';
    case 'Adoção concluída': return 'is-done';
    case 'Recusado':         return 'is-refused';
    default:                 return 'is-new';
  }
}

function simNaoLabel(v) {
  const t = String(v || '').toLowerCase();
  if (t === 'sim') return 'Sim';
  if (t === 'nao' || t === 'não') return 'Não';
  return v || '—';
}

function interestInfoHtml(r) {
  const local = [r.cidade, r.uf].filter(Boolean).join('/');
  const itens = [
    r.email ? `<span>✉️ ${escapeHtml(r.email)}</span>` : '',
    local ? `<span>📍 ${escapeHtml(local)}${r.bairro ? ' · ' + escapeHtml(r.bairro) : ''}</span>` : '',
    r.idade != null ? `<span>🎂 ${escapeHtml(String(r.idade))} anos ${r.maior21 ? '(21+)' : '(menor de 21)'}</span>` : '',
    r.tipoMoradia ? `<span>🏠 ${escapeHtml(r.tipoMoradia)}</span>` : '',
    `<span>🐾 Outros animais: ${escapeHtml(simNaoLabel(r.possuiOutrosAnimais))}</span>`,
    `<span>📋 Já adotou antes: ${escapeHtml(simNaoLabel(r.jaAdotouAntes))}</span>`,
    `<span>${r.aceitaTermos ? '✅ Aceitou os termos' : '⚠️ Não aceitou os termos'}</span>`
  ].filter(Boolean).join('');
  return `<div class="interest-info">${itens}</div>`;
}

function ownedCardHtml(pet) {
  const interessados = state.interessados.filter(r => r.petId === pet.id);
  const petAdotado = pet.status === 'Adotado';
  const lista = interessados.length
    ? interessados.map(r => {
        const st = r.status || 'Interesse enviado';
        // "Adoção concluída" não é selecionável manualmente: só aparece quando já
        // foi definida via "Confirmar doação". Mantém-se visível apenas nesse caso.
        const opts = INTEREST_STATUSES
          .filter(s => s !== 'Adoção concluída' || st === 'Adoção concluída')
          .map(s => `<option value="${escapeHtml(s)}"${s === st ? ' selected' : ''}>${escapeHtml(s)}</option>`)
          .join('');
        const concluido = st === 'Adoção concluída';
        // Botão de confirmar doação: disponível enquanto o pet não foi adotado
        const confirmBtn = (!petAdotado && st !== 'Recusado')
          ? `<button class="btn-confirm-donation" type="button" data-confirm-donation="${r.interesseId}">🤝 Confirmar doação para esta pessoa</button>`
          : (concluido ? '<span class="interest-adopted">🏡 Adotou este pet</span>' : '');
        return `
        <li class="interest-item${concluido ? ' is-chosen' : ''}">
          <div class="interest-person">
            <strong>${escapeHtml(r.nome || 'Interessado(a)')}</strong>
            <span class="interest-status ${interestStatusClass(st)}">${escapeHtml(st)}</span>
          </div>
          ${r.email    ? `<a class="interest-contact" href="mailto:${escapeHtml(r.email)}">✉️ ${escapeHtml(r.email)}</a>` : ''}
          ${r.telefone ? `<a class="interest-contact" href="tel:${escapeHtml(r.telefone.replace(/\D/g,''))}">📞 ${escapeHtml(r.telefone)}</a>` : ''}
          ${interestInfoHtml(r)}
          ${r.mensagem ? `<p class="interest-msg">💬 ${escapeHtml(r.mensagem)}</p>` : ''}
          <label class="interest-process">
            <span>Andamento da adoção:</span>
            <select class="interest-status-select" data-interesse-id="${r.interesseId}"${petAdotado ? ' disabled' : ''}>${opts}</select>
          </label>
          ${confirmBtn}
        </li>`;
      }).join('')
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

async function restoreRefusal(petId) {
  await api('remover_recusa', { pet_id: petId });
  state.recusas = state.recusas.filter(id => id !== petId);
  showToast('Pet de volta para a sua lista de exploração. 🐾', 'success');
  renderProfile();
  renderCurrentPet();
}

function accountEditFormHtml(u) {
  const tc  = u.tipoCadastro || 'adotar';
  const sel = v => v === tc ? ' checked' : '';
  const moradiaOpts = ['Casa com quintal','Casa sem quintal','Apartamento com tela de proteção','Apartamento sem tela','Sítio / chácara'];
  const animaisOpts = ['Não','Sim, cães','Sim, gatos','Sim, cães e gatos'];

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
      <div class="form-group"><label for="acc_nome">Nome completo *</label><input type="text" id="acc_nome" name="nome" value="${escapeHtml(u.nome || '')}"></div>
      <div class="form-group"><label for="acc_cpf">CPF</label><input type="text" id="acc_cpf" name="cpf" maxlength="14" placeholder="000.000.000-00" value="${escapeHtml(aplicarMascaraCPF(u.cpf || ''))}" readonly></div>
      <div class="form-group"><label for="acc_email">E-mail</label><input type="email" id="acc_email" name="email" value="${escapeHtml(u.email || '')}" readonly></div>
      <div class="form-group"><label for="acc_telefone">Telefone / WhatsApp *</label><input type="tel" id="acc_telefone" name="telefone" maxlength="15" placeholder="(31) 99999-9999" value="${escapeHtml(u.telefone || '')}"></div>
      <div class="form-group"><label for="acc_cidade">Cidade *</label><input type="text" id="acc_cidade" name="cidade" value="${escapeHtml(u.cidade || '')}"></div>
      <div class="form-group"><label for="acc_uf">UF *</label><select id="acc_uf" name="uf"><option value="">--</option>${optionsHtml(UFS, u.uf)}</select></div>
      <div class="form-group"><label for="acc_bairro">Bairro *</label><input type="text" id="acc_bairro" name="bairro" value="${escapeHtml(u.bairro || '')}"></div>
      <div class="form-group"><label for="acc_moradia">Tipo de moradia *</label><select id="acc_moradia" name="moradia"><option value="">Selecione</option>${optionsHtml(moradiaOpts, u.moradia)}</select></div>
      <div class="form-group"><label for="acc_outros">Possui outros animais? *</label><select id="acc_outros" name="outrosAnimais"><option value="">Selecione</option>${optionsHtml(animaisOpts, u.outrosAnimais)}</select></div>
      <div class="form-group"><label for="acc_jaadotou">Já adotou antes? *</label><select id="acc_jaadotou" name="jaAdotou"><option value="">Selecione</option>${optionsHtml(['Sim','Não'], u.jaAdotou)}</select></div>
    </div>
    <details class="account-password">
      <summary>Alterar senha (opcional)</summary>
      <div class="form-grid">
        <div class="form-group"><label for="acc_senha">Nova senha <small>(mín. 6 caracteres)</small></label><input type="password" id="acc_senha" name="nova_senha" autocomplete="new-password"></div>
        <div class="form-group"><label for="acc_senha2">Confirmar nova senha</label><input type="password" id="acc_senha2" name="confirmaSenha" autocomplete="new-password"></div>
      </div>
    </details>
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
  const btn  = $id('btnEditData');
  if (view) view.hidden = true;
  if (btn)  btn.hidden  = true;
  if (form) form.hidden = false;
  configurarMascaraTelefone(['acc_telefone']);
}

function cancelarEdicaoDados() {
  const view = $id('accountView');
  const form = $id('accountEditForm');
  const btn  = $id('btnEditData');
  if (form) form.hidden = true;
  const err = $id('accountEditError');
  if (err)  err.textContent = '';
  if (view) view.hidden = false;
  if (btn)  btn.hidden  = false;
}

async function salvarEdicaoDados(event) {
  event.preventDefault();
  const f      = event.target;
  const get    = name => f.elements[name] ? f.elements[name].value.trim() : '';
  const errBox = $id('accountEditError');
  const errors = [];

  const nome         = get('nome');
  const telefone     = get('telefone');
  const cidade       = get('cidade');
  const uf           = get('uf');
  const bairro       = get('bairro');
  const moradia      = get('moradia');
  const outrosAnimais= get('outrosAnimais');
  const jaAdotou     = get('jaAdotou');
  const tipoCadastro = get('tipoCadastro');
  const novaSenha    = get('nova_senha');
  const confirmaSenha= get('confirmaSenha');

  const telValido = validarTelefone(telefone);
  if (f.elements['telefone']) f.elements['telefone'].classList.toggle('input-error', !!telefone && !telValido);

  if (!nome)          errors.push('Informe o nome completo.');
  if (!telefone)      errors.push('Informe o telefone / WhatsApp.');
  else if (!telValido) errors.push('Telefone inválido. Use DDD + número, ex.: (31) 99999-9999.');
  if (!cidade)        errors.push('Informe a cidade.');
  if (!uf)            errors.push('Selecione a UF.');
  if (!bairro)        errors.push('Informe o bairro.');
  if (!moradia)       errors.push('Selecione o tipo de moradia.');
  if (!outrosAnimais) errors.push('Informe se possui outros animais.');
  if (!jaAdotou)      errors.push('Informe se já adotou antes.');
  if (novaSenha || confirmaSenha) {
    if (novaSenha.length < 6) errors.push('A nova senha deve ter no mínimo 6 caracteres.');
    if (novaSenha !== confirmaSenha) errors.push('A confirmação da nova senha não confere.');
  }

  if (errors.length) {
    if (errBox) errBox.textContent = errors[0];
    showToast(errors[0], 'error');
    return;
  }
  if (errBox) errBox.textContent = '';

  const payload = {
    nome,
    telefone: aplicarMascaraTelefone(telefone),
    cidade, uf, bairro,
    tipo_moradia: moradia,
    possui_outros_animais: outrosAnimais,
    ja_adotou_antes: jaAdotou
  };
  if (novaSenha) payload.nova_senha = novaSenha;

  const btn = f.querySelector('button[type="submit"]');
  if (btn) btn.disabled = true;

  const r = await api('atualizar_usuario', payload);

  if (btn) btn.disabled = false;

  if (!r.success) {
    if (errBox) errBox.textContent = r.message;
    showToast(r.message, 'error');
    return;
  }

  // Atualiza estado local
  if (r.data) {
    const updated = normalizeUser(r.data);
    state.user = Object.assign({}, state.user, updated);
    if (tipoCadastro) state.user.tipoCadastro = tipoCadastro;
  }

  updateUserStatus();
  cancelarEdicaoDados();
  renderProfile();
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

  const u          = state.user;
  const interesses = state.interesses.map(getPet).filter(Boolean);
  const recusados  = state.recusas.map(getPet).filter(Boolean);
  const meusPets   = state.pets.filter(p => p.cadastradoPorUserId && u.id && p.cadastradoPorUserId === u.id);
  const idade      = calcIdade(u.nascimento);
  const habilitado = u.maior21;

  // Interesses recebidos nos meus pets aguardando andamento (notificação para o responsável/ONG)
  const aguardando = state.interessados.filter(
    r => r.status === 'Interesse enviado' || r.status === 'Em conversa'
  );
  const notifHtml = aguardando.length
    ? `<div class="profile-notification" role="status">
         🔔 <strong>${aguardando.length} interessado(s)</strong> ${aguardando.length === 1 ? 'aguarda' : 'aguardam'} você dar andamento à adoção.
         Veja em <a href="#meusPets">Pets que cadastrei para doação</a> e atualize o andamento de cada um.
       </div>`
    : '';

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

    ${notifHtml}

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

    <section class="profile-block" id="meusPets">
      <div class="profile-section-head">
        <h3 class="profile-block-title">Pets que cadastrei para doação</h3>
        <button class="btn-refresh-pets" type="button" id="btnRefreshMeusPets" title="Atualizar interessados">🔄 Atualizar</button>
      </div>
      <div class="pets-grid">
        ${meusPets.length ? meusPets.map(ownedCardHtml).join('')
          : `<div class="grid-empty">Você ainda não cadastrou pets. <a href="cadastrar-pet.html">Cadastrar um pet</a></div>`}
      </div>
    </section>

    <div class="profile-reminder">
      🐾 Lembre-se da <a href="index.html#requisitos">adoção responsável</a> antes de levar um novo amigo para casa.
    </div>`;

  const btnLogout = $id('btnLogout');
  if (btnLogout) btnLogout.addEventListener('click', logoutUser);
  const btnEdit   = $id('btnEditData');
  if (btnEdit) btnEdit.addEventListener('click', abrirEdicaoDados);
  const btnCancel = $id('btnCancelEdit');
  if (btnCancel) btnCancel.addEventListener('click', cancelarEdicaoDados);
  const editForm  = $id('accountEditForm');
  if (editForm) editForm.addEventListener('submit', salvarEdicaoDados);

  const btnRefresh = $id('btnRefreshMeusPets');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      btnRefresh.disabled = true;
      btnRefresh.textContent = '⏳ Atualizando...';
      await loadUserDataFromAPI();
      renderProfile();
    });
  }
}
const renderizarDadosUsuario = renderProfile;

/* ===========================================================
   18. MAPA INTERATIVO — Leaflet + OpenStreetMap
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
  _map = L.map('petsMap', { scrollWheelZoom: false }).setView([-15.78, -47.93], 4);
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

  const term      = normalizarTexto(state.searchTerm);
  const mapFilter = state.activeFilter === 'perto' ? 'todos' : state.activeFilter;
  const pets      = state.pets.filter(pet => matchesSearch(pet, term) && matchesFilter(pet, mapFilter));
  const bounds    = [];

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

  if (state.activeFilter === 'perto') {
    const origin = userOrigin();
    if (origin) { _map.setView(origin, state.geo ? 11 : 9); addUserMarker(origin, state.geo ? '📍 Você está aqui' : undefined); return; }
  }
  if (bounds.length === 1) _map.setView(bounds[0], 9);
  else if (bounds.length > 1) _map.fitBounds(bounds, { padding: [40,40], maxZoom: 8 });
}

function addUserMarker(latlng, label) {
  if (!_map || !_mapMarkers) return;
  if (_userMarker) _mapMarkers.removeLayer(_userMarker);
  _userMarker = L.circleMarker(latlng, { radius:11, color:'#D9623D', weight:2, fillColor:'#F4845F', fillOpacity:0.55 }).addTo(_mapMarkers);
  _userMarker.bindPopup(label || ('📍 Você está aqui: ' + escapeHtml(state.user ? state.user.cidade : '') + '/' + escapeHtml(state.user ? state.user.uf : '')));
}

function locateMeOnMap() {
  if (!_map) { showToast('O mapa ainda está carregando.', 'info'); return; }
  const fallbackToCity = () => {
    if (!isUserRegistered()) { showToast('Não foi possível obter sua localização. Cadastre sua cidade para centralizar o mapa.', 'warning'); return; }
    const me = cityLatLng(state.user.cidade, state.user.uf);
    if (!me) { showToast('Não encontramos a localização da sua cidade no mapa.', 'warning'); return; }
    _map.setView(me, 10); addUserMarker(me); _userMarker.openPopup();
    showToast(`Mostrando pets perto de ${state.user.cidade}/${state.user.uf}. 📍`, 'success');
  };
  if (!navigator.geolocation) { fallbackToCity(); return; }
  showToast('Obtendo sua localização...', 'info');
  navigator.geolocation.getCurrentPosition(
    pos => {
      state.geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      renderPetLists(); renderCurrentPet();
      _map.setView([state.geo.lat, state.geo.lng], 12);
      addUserMarker([state.geo.lat, state.geo.lng], '📍 Você está aqui');
      _userMarker.openPopup();
      showToast('Centralizado na sua localização atual. 📍', 'success');
    },
    () => fallbackToCity(),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
  );
}

/* ===========================================================
   19. INICIALIZAÇÃO / EVENTOS
=========================================================== */
async function initApp() {
  // 1. Sessão e pets em paralelo
  const [_, petsR] = await Promise.all([
    loadSessionFromAPI(),
    loadPetsFromAPI()
  ]);

  // 2. Se logado, carrega interesses/recusas/meus pets
  if (state.user) {
    await loadUserDataFromAPI();
  }

  updateUserStatus();
  renderCounters();
  renderPetLists();
  renderCurrentPet();
  renderProfile();

  bindEvents();
  initMap();
  await initPetEditMode();

  // Auto-refresh: atualiza pets quando a aba volta ao foco
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      await loadPetsFromAPI();
      renderPetLists();
      renderCurrentPet();
      renderCounters();
    }
  });

  // Auto-refresh periódico (90s) para que novos pets apareçam sem recarregar
  setInterval(async () => {
    if (!document.hidden) {
      await loadPetsFromAPI();
      renderPetLists();
      renderCurrentPet();
      renderCounters();
    }
  }, 90000);

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

  // Página de cadastrar pet exige login.
  if ($id('petForm') && !isUserRegistered()) {
    showToast('Para cadastrar um pet para doação, faça seu cadastro primeiro.', 'info');
  }
}

function bindEvents() {
  /* Menu hambúrguer */
  const toggle = $id('navToggle');
  const menu   = $id('navMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open'); toggle.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* Busca */
  const searchForm  = $id('searchForm');
  const searchInput = $id('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      state.searchTerm = searchInput.value;
      renderPetLists(); renderCurrentPet(); renderMap(false);
    });
  }
  if (searchForm) {
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      state.searchTerm = searchInput ? searchInput.value : '';
      renderPetLists(); renderCurrentPet(); renderMap(true);
    });
  }

  /* Botão "Centralizar perto de mim" */
  const btnLocate = $id('btnLocateMe');
  if (btnLocate) btnLocate.addEventListener('click', locateMeOnMap);

  /* Filtros */
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => setActiveFilter(chip.dataset.filter));
  });

  /* Ações do explorar */
  const btnRefuse  = $id('btnRefuse');
  const btnDetails = $id('btnDetails');
  const btnInterest= $id('btnInterest');
  if (btnRefuse)   btnRefuse.addEventListener('click', () => registerRefusal(state.currentExploreId));
  if (btnDetails)  btnDetails.addEventListener('click', () => { if (state.currentExploreId) showPetDetails(state.currentExploreId); });
  if (btnInterest) btnInterest.addEventListener('click', () => registerInterest(state.currentExploreId));

  /* Formulário de usuário */
  const userForm = $id('userForm');
  if (userForm) userForm.addEventListener('submit', handleUserSubmit);
  configurarMascaraCPF(['u_cpf']);
  configurarMascaraTelefone(['u_telefone', 'p_telefone']);
  configurarMascaraData(['u_nascimento']);
  configurarBuscaCep('u_cep', { cidade: 'u_cidade', uf: 'u_uf', bairro: 'u_bairro' });

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

  const idadeAnos  = $id('p_idadeAnos');
  const idadeMesesSpin = $id('p_idadeMesesSpinner');
  if (idadeAnos)      idadeAnos.addEventListener('input', atualizarIdadeSpinner);
  if (idadeMesesSpin) idadeMesesSpin.addEventListener('input', atualizarIdadeSpinner);
  atualizarIdadeSpinner();

  /* Delegação: cards da listagem */
  const listSection = $id('listagem');
  if (listSection) {
    listSection.addEventListener('click', e => {
      const det = e.target.closest('.btn-detail');
      if (det) { showPetDetails(Number(det.dataset.id)); return; }
      const interest = e.target.closest('[data-interest]');
      if (interest) { registerInterest(Number(interest.dataset.interest)); return; }
      const remPet = e.target.closest('[data-remove-pet]');
      if (remPet) { handleRemovePet(Number(remPet.dataset.removePet)); return; }
    });
  }

  /* Delegação: perfil */
  const perfilSection = $id('perfil');
  if (perfilSection) {
    perfilSection.addEventListener('click', e => {
      const det = e.target.closest('.btn-detail');
      if (det) { showPetDetails(Number(det.dataset.id)); return; }
      const rem = e.target.closest('[data-remove-interest]');
      if (rem) { removeInterest(Number(rem.dataset.removeInterest)); return; }
      const res = e.target.closest('[data-restore-refusal]');
      if (res) { restoreRefusal(Number(res.dataset.restoreRefusal)); return; }
      const conf = e.target.closest('[data-confirm-donation]');
      if (conf) { confirmDonation(Number(conf.dataset.confirmDonation)); return; }
      const remPet = e.target.closest('[data-remove-pet]');
      if (remPet) { handleRemovePet(Number(remPet.dataset.removePet)); return; }
    });
    perfilSection.addEventListener('change', e => {
      const sel = e.target.closest('.interest-status-select');
      if (sel) updateInterestStatus(Number(sel.dataset.interesseId), sel.value);
    });
  }

  /* Menu da conta (dropdown) */
  const chipBtn  = $id('userChipBtn');
  const dropdown = $id('userDropdown');
  if (chipBtn && dropdown) {
    chipBtn.addEventListener('click', e => {
      e.stopPropagation();
      const willOpen = dropdown.hidden;
      dropdown.hidden = !willOpen;
      chipBtn.setAttribute('aria-expanded', String(willOpen));
    });
    document.addEventListener('click', e => {
      if (!dropdown.hidden && !e.target.closest('#userMenu')) {
        dropdown.hidden = true; chipBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
  const btnLogoutMenu = $id('btnLogoutMenu');
  if (btnLogoutMenu) btnLogoutMenu.addEventListener('click', logoutUser);

  /* Modal */
  const modalClose = $id('modalClose');
  const overlay    = $id('modalOverlay');
  if (modalClose) modalClose.addEventListener('click', closePetDetails);
  if (overlay)    overlay.addEventListener('click', e => { if (e.target === overlay) closePetDetails(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeConfirm(); closePetDetails(); closeInteressados(); } });

  const intOverlay = $id('interessadosOverlay');
  if (intOverlay) {
    const intClose = $id('interessadosClose');
    if (intClose) intClose.addEventListener('click', closeInteressados);
    intOverlay.addEventListener('click', e => {
      if (e.target === intOverlay) { closeInteressados(); return; }
      const conf = e.target.closest('[data-confirm-donation]');
      if (conf) confirmDonation(Number(conf.dataset.confirmDonation));
    });
    intOverlay.addEventListener('change', e => {
      const sel = e.target.closest('.interest-status-select');
      if (sel) updateInterestStatus(Number(sel.dataset.interesseId), sel.value);
    });
  }
  document.addEventListener('click', e => {
    const intBtn = e.target.closest('[data-interessados]');
    if (intBtn) showInteressados(Number(intBtn.dataset.interessados));
  });
}

document.addEventListener('DOMContentLoaded', initApp);
