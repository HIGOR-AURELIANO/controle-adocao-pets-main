# 🐾 meu4patas

> **Transformando vidas de animais resgatados através da tecnologia**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PHP](https://img.shields.io/badge/PHP-8+-blue.svg)](https://www.php.net/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![SQLite](https://img.shields.io/badge/Database-SQLite-green.svg)](https://www.sqlite.org/)
[![Open Source](https://img.shields.io/badge/Open-Source-brightgreen.svg)](https://github.com/HIGOR-AURELIANO/controle-adocao-pets-main)

---

## 🎯 Nossa Missão

**meu4patas** é mais que uma plataforma — é um movimento para conectar animais resgatados e abandondados a famílias amorosas. Nascemos como projeto acadêmico e evoluímos para uma solução real e impactante que está **mudando a forma como animais encontram seus lares**.

Cada clique, cada cadastro, cada demonstração de interesse é um passo em direção a **zero abandono animal** no Brasil e no mundo.

---

## 💚 O que Representamos

### 🐕 Para os Animais
- **Segunda chance**: Animais resgatados ganham visibilidade e oportunidade de encontrar um lar
- **Segurança**: Processo de adoção responsável que garante o bem-estar do animal
- **Histórias que importam**: Cada pet tem sua ficha completa, histórico e necessidades registradas

### 👥 Para as Pessoas
- **Facilidade**: Encontrar seu próximo melhor amigo em segundos
- **Responsabilidade**: Termos claros e validações para garantir adoção consciente
- **Conexão**: Histórias reais de animais precisando de ajuda

### 🏠 Para ONGs, Protetores e Lares Temporários
- **Alcance**: Atingir potenciais adotantes sem custos
- **Organização**: Gerenciar cadastros e interesses em um único lugar
- **Impacto**: Participar ativamente de um movimento maior por bem-animal

### 🌍 Para o Mundo
- **Tecnologia acessível**: Código open-source que qualquer organização pode usar
- **Sustentável**: Sem dependências externas, rápido e seguro
- **Replicável**: Modelo pronto para expansão global

---

## ✨ Funcionalidades Principais

### 🔍 Explorar com Propósito

**Para todos (visitantes ou cadastrados):**
- 🎴 **Exploração estilo Tinder** — um pet por vez, imersivo e intuitivo
- 🔎 **Busca em tempo real** — nome, espécie, raça, cidade, bairro, temperamento
- 📊 **Filtros inteligentes** — Cães, Gatos, Filhotes, Adultos, Disponíveis, Indisponíveis, Adotados
- 📍 **"Perto de você"** — descubra animais na sua região
- 📱 **100% responsivo** — experimente perfeitamente em qualquer dispositivo

### ❤️ Demonstrar Interesse com Responsabilidade

**Para adotantes cadastrados:**
- 💫 Demonstrar interesse **sem alterar o status do pet** (ONG ou protetor decide a adoção)
- 📋 **Dashboard pessoal** — histórico de interesses e contato com responsáveis
- 🔄 **Reconsiderar pets** — mude de ideia e volte a explorar
- 🔐 **Validações robustas** — CPF, e-mail, 21+ anos, termos aceitos
- 🎂 Garantir que apenas adultos responsáveis acessem a plataforma

### 🐾 Cadastrar & Gerenciar

**Para doadores, protetores e lares temporários:**
- 📸 **Upload de imagens** — obrigatório com preview antes de salvar
- 🩺 **Ficha médica completa** — vacinação, doenças, medicamentos, cuidados especiais
- 👶 **Suporte a filhotes/ninhadas** — cadastre múltiplos animais relacionados
- 📝 **Descrição detalhada** — história, temperamento, lar ideal
- 🏆 **Raças dinâmicas** — lista muda conforme a espécie selecionada
- 📊 **Dashboard de interesses** — veja quem quer adotar seus pets (nome + telefone)
- ✏️ **Gerenciamento total** — edite, atualize ou remova seus cadastros

### 🛡️ Segurança & Confiança

- ✅ **Validação em múltiplos níveis** — CPF, e-mail, data de nascimento, termos
- 🔐 **Senhas com hash** — proteção máxima de dados pessoais
- 🛡️ **Prepared statements** — defesa contra SQL injection
- 📋 **Termos de adoção** — ambas as partes entendem suas responsabilidades
- 👤 **Profiles verificados** — acesso a contato do responsável após interesse

---

## 📊 Impacto em Números

Cada sessão do meu4patas:
- 🎯 Conecta **até 26 animais** com potenciais famílias
- 💬 Facilita **conversas responsáveis** entre doadores e adotantes
- ⏰ Economiza horas de cadastro manual em ONGs
- 🌐 Aumenta o alcance de protetores além de redes sociais

---

## 🚀 Começando

### Requisitos
- **PHP 8+** com extensão PDO SQLite habilitada
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)
- **Git** (opcional, para contribuir)

### Instalação Local

1. **Clone o repositório**
   ```bash
   git clone https://github.com/HIGOR-AURELIANO/controle-adocao-pets-main.git
   cd controle-adocao-pets-main
   ```

2. **Inicie o servidor PHP**
   ```bash
   php -S 0.0.0.0:5000 router.php
   ```

3. **Acesse no navegador**
   ```
   http://localhost:5000
   ```

O banco de dados (`banco.db`) será criado automaticamente na primeira execução, já incluindo 26 pets de demonstração.

### Deploy no Replit

O projeto inclui `.replit` pré-configurado. Use o botão **Run** e o servidor estará disponível na porta 5000.

> ⚠️ **Importante**: Use deploy com servidor PHP (`cloudrun`), não estático. Deploy estático não executa `api.php` nem persiste SQLite.

### Health Check da API

Verifique se tudo está funcionando:

```bash
curl http://localhost:5000/api.php?action=health
```

Resposta esperada: `status: ok` e `pets: 26`

---

## 🧪 Contas de Teste

Todas usam a senha `123456`:

| Perfil | E-mail | Função |
|--------|--------|--------|
| 👨‍💼 Administrador | `admin@meu4patas.local` | Acesso completo ao sistema |
| 👤 Adotante | `ana@meu4patas.local` | Demonstrar interesse, gerenciar perfil |
| 🏠 Doador/Protetor | `doador@meu4patas.local` | Cadastrar pets, acompanhar interesses |

**Teste o fluxo completo**: explore pets com visitante → crie conta → demonstre interesse → veja dashboard pessoal.

---

## 📁 Estrutura do Projeto

```
controle-adocao-pets-main/
├── 📄 index.php               # Bootstrap e roteador principal
├── 🔗 router.php              # Servidor PHP embutido
├── 🔌 api.php                 # API REST & inicialização do banco
├── 💾 banco.db                # Banco SQLite (versionado)
├── 📄 index.html              # Landing page (hero, explorar, filtros)
├── 📝 cadastro.html           # Formulário de cadastro de usuário
├── 🐾 cadastrar-pet.html      # Formulário de cadastro de pet
├── 👤 perfil.html             # Dashboard pessoal (Minha Conta)
├── 🎨 css/
│   └── style.css              # Estilos responsivos (mobile-first)
├── ⚙️ js/
│   └── script.js              # Lógica frontend, chamadas à API
├── 🖼️ assets/
│   ├── logo-meu4patas.png     # Logo oficial (PNG transparente)
│   └── pet-*.jpg              # Imagens dos pets de demonstração
├── 📤 uploads/                # Armazena imagens dos pets cadastrados
├── 📖 README.md               # Este arquivo
└── 📋 .replit                 # Configuração para Replit

```

---

## 🏗️ Arquitetura

### Frontend — Simplificado e Responsivo
- **HTML5** — semântico, acessível e otimizado para SEO
- **CSS3** — responsivo (mobile-first) com Grid e Flexbox, sem frameworks
- **JavaScript puro** — zero dependências externas, desempenho máximo
- **Busca e filtros em tempo real** — sem recarregar página

### Backend — Robusto e Seguro
- **PHP 8** — API REST em `api.php`, moderno e seguro
- **SQLite** — banco de dados leve, portável e confiável
- **PDO** — acesso seguro com prepared statements
- **Bootstrap automático** — banco e dados de teste criados na primeira execução

### Data Flow
```
Frontend (JS)
     ↓
  api.php (PHP 8)
     ↓
SQLite (banco.db)
     ↓
Respostas JSON
```

---

## 🔌 API REST

A API está em `api.php` e responde em JSON estruturado.

### Endpoints Principais

```bash
# Health check
GET /api.php?action=health

# Listar todos os pets
GET /api.php?action=getPets

# Buscar pet por ID
GET /api.php?action=getPetById&id=1

# Demonstrar interesse
POST /api.php (action=registerInterest)

# Cadastrar novo pet
POST /api.php (action=registerPet)

# Login de usuário
POST /api.php (action=login)

# Cadastro de usuário
POST /api.php (action=register)
```

Todas as respostas incluem `status` e `data` estruturados.

---

## 🎨 Experiência de Usuário (UX/UI)

### Design Centrado no Propósito
- **Top Bar Adaptativa** — menu hamburguês em mobile, menu completo em desktop
- **Hero Institucional** — indicadores em tempo real (pets, adoções, histórias de sucesso)
- **Cards Responsivos** — imagens otimizadas, tipografia clara
- **Modal de Detalhes** — ficha médica, história completa e contato do responsável
- **Toasts (Notificações)** — feedback visual imediato de sucesso/erro
- **Formulários Intuitivos** — validação em tempo real, hints úteis, UX fluida

### Acessibilidade
- ✅ Semântica HTML correta
- ✅ Contraste adequado de cores
- ✅ Navegação por teclado
- ✅ Labels descritivos em formulários

---

## 🤝 Como Contribuir

Adoraríamos sua ajuda em transformar vidas de animais! Se você quer melhorar o **meu4patas**:

1. **Fork** o repositório
2. Crie uma **branch** para sua feature (`git checkout -b feature/minha-feature`)
3. **Commit** suas mudanças (`git commit -m "feat: descrição clara da mudança"`)
4. **Push** para a branch (`git push origin feature/minha-feature`)
5. Abra um **Pull Request** com descrição do impacto

### 🌟 Ideias para Contribuições

**Funcionalidades**
- 🌍 Suporte a múltiplos idiomas (i18n) — português, espanhol, inglês
- 📧 Sistema de notificações por e-mail
- 🗺️ Integração com geolocalização (GPS)
- 📱 App mobile (React Native, Flutter)
- 📊 Dashboard avançado para ONGs e estatísticas
- 🎨 Temas dark/light

**Melhorias de Performance**
- 🚀 Cache de imagens
- ⚡ Lazy loading de pets
- 📊 Otimização de queries SQL

**Comunidade**
- 🐛 Report de bugs com detalhes
- 💡 Sugestões de features
- 📚 Melhorias na documentação
- 🌐 Tradução do conteúdo

---

## 📝 Licença

Este projeto está licenciado sob a **MIT License** — veja o arquivo [LICENSE](LICENSE) para detalhes.

Você é **livre para usar, modificar e distribuir** este código, desde que cite a origem. Estamos aqui para democratizar a tecnologia de adoção.

---

## 📈 Histórico & Evolução

### De Acadêmico a Impactante

**2024 — Origem**: Nasceu como projeto acadêmico desenvolvido para a **Faculdade Estácio de Sá**, onde um grupo de estudantes foi desafiado a resolver um problema real.

**2025 — Transformação**: Evoluiu para uma plataforma real e pronta para produção. Deixou de ser apenas uma nota na faculdade para se tornar um **instrumento de mudança social**.

**Hoje — Movimento**: É um projeto **open-source** que qualquer ONG, protetor, lar temporário ou desenvolvedor pode usar, adaptar e contribuir.

### Próximos Passos
- 🌎 Expansão internacional
- 🤖 Integração com IA para recomendações personalizadas
- 📱 App mobile nativa
- 🏆 Parcerias com grandes ONGs

---

## 📬 Contato & Comunidade

**Quer fazer parte dessa missão?**

- 🐾 [Visite o site](https://controle-adocao-pets-main.netlify.app)
- 🐛 [Reporte um bug](https://github.com/HIGOR-AURELIANO/controle-adocao-pets-main/issues)
- 💬 [Sugira uma feature](https://github.com/HIGOR-AURELIANO/controle-adocao-pets-main/issues/new)
- 👥 [Contribua com código](https://github.com/HIGOR-AURELIANO/controle-adocao-pets-main/pulls)
- 💌 [Fale conosco](mailto:contato@meu4patas.local)

---

## 💝 Agradecimentos

- 🎓 À **Faculdade Estácio de Sá** por acreditar na ideia
- 🐾 A cada protetor, ONG e lar temporário que faz a diferença
- 👥 À comunidade de desenvolvedores que contribuem
- 💚 A todos os animais que encontraram um lar através dessa plataforma

---

<div align="center">

### Cada pet merece um lar. Cada pessoa merece um melhor amigo.

**Faça parte da revolução. Contribua. Compartilhe. Salve vidas. 🐾❤️**

---

*Desenvolvido com propósito para transformar o mundo, um animal por vez.*

</div>
