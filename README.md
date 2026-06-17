# 🐾 meu4patas — Adoção e doação responsável de pets

> Trabalho acadêmico desenvolvido para a **Faculdade Estácio de Sá** pelo **Grupo 6**.

O **meu4patas** é uma plataforma web para **adoção e doação responsável de pets**, voltada para
pessoas físicas, ONGs e lares temporários. O projeto conecta animais que precisam de um lar a
pessoas dispostas a adotar com responsabilidade.

O desenvolvimento está dividido em fases. **A Fase 01 (atual)** é um protótipo navegável e
interativo construído **apenas com HTML5, CSS3 e JavaScript puro**, sem backend e sem banco de
dados real — a persistência é simulada com **localStorage** no navegador.

---

## ✅ Fase 01 — Front-end funcional (entregue)

### Regras principais do sistema

- O meu4patas **não realiza a adoção pelo site**. O sistema apenas permite **demonstrar interesse**
  em um pet; a adoção final depende da análise e do contato da ONG, protetor, lar temporário ou
  responsável pelo animal.
- Demonstrar interesse **não altera o status do pet** nem o remove da lista — apenas registra o
  interesse e avisa que o responsável poderá entrar em contato.
- Para **demonstrar interesse** é obrigatório: estar **cadastrado**, ter **21 anos ou mais** e ter
  **aceitado os termos** de adoção responsável.
- Para **cadastrar um pet para doação** também é obrigatório estar **cadastrado**.
- Visitantes (sem cadastro) podem **visualizar, buscar, filtrar e abrir os detalhes** dos pets.

### Como executar

Por usar apenas HTML, CSS e JS, **não há build nem dependências**. Basta:

1. Abrir o arquivo [index.html](index.html) diretamente no navegador, **ou**
2. Servir a pasta com um servidor estático (recomendado, para o `localStorage` e os assets
   funcionarem de forma consistente):
   ```bash
   # Python 3
   python3 -m http.server 8000
   # depois acesse http://localhost:8000
   ```

### Funcionalidades

- **Top bar** com a logo **meu4patas** e menu responsivo (vira menu hambúrguer no mobile).
- **Hero** institucional com indicadores simulados (atualizados a partir dos dados reais do app).
- **Explorar pets — estilo Tinder:** um pet por vez em card grande, com botões
  *Não tenho interesse*, *Ver detalhes* e *Tenho interesse*.
- **Busca funcional** em tempo real por nome, espécie, raça, cidade, UF, bairro, status,
  temperamento, descrição e tipo de doação.
- **Filtros funcionais:** Todos, Cães, Gatos, Filhotes, Adultos, Disponíveis, Indisponíveis,
  Adotados e **Perto de você** (usa cidade/UF do cadastro do usuário).
- **Cadastro prévio do usuário** com validação (CPF, e-mail, senha, data de nascimento, termos etc.).
  Demonstrar interesse em um pet exige cadastro, **21 anos ou mais** e aceite dos termos.
- **Cadastro de pet para doação**, incluindo **filhotes/ninhada**, com **imagem obrigatória e
  preview**, lista de raças que muda conforme a espécie e **ficha médica**.
- **Página "Minha conta" (`perfil.html`)**: mostra os dados do usuário, os pets em que ele
  demonstrou interesse (com o **contato do responsável**), os **pets que ele recusou** (com a opção
  *"Voltar a considerar"*, que os traz de volta ao Explorar), e os pets que ele cadastrou para doação
  **com a lista de quem demonstrou interesse** (nome + telefone). Permite remover interesses e sair
  da conta.
- **Área de conta na top bar (UI/UX)**: o menu mostra apenas seções do site; a área de conta à
  direita é adaptativa — **deslogado** exibe um único botão **"Criar conta"**; **logado** exibe um
  **chip do usuário com dropdown** (👤 Nome → "Minha conta" e "Sair"). Isso elimina links
  duplicados de conta. A top bar vira **menu hambúrguer** a partir de 1024px.
- **Modal de detalhes** com ficha médica completa, história, lar ideal e dados do responsável.
- **Listagem de pets** em cards menores, separada por Disponíveis, Indisponíveis e Adotados.
- **Seção de requisitos** para adoção responsável.
- **Persistência simulada** em `localStorage` e **mensagens (toasts)** de sucesso/erro.
- **Layout responsivo** para mobile.

### Estrutura de arquivos (Fase 01)

```
/
├── index.html            (landing: hero, explorar, busca/filtros, listagem, requisitos)
├── cadastro.html         (página do cadastro de usuário)
├── cadastrar-pet.html    (página do cadastro de pet/ninhada)
├── perfil.html           (página "Minha conta": interesses, pets cadastrados e dados)
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   ├── logo-meu4patas.png   (logo oficial, fundo removido/transparente)
│   ├── luna-hero.png
│   ├── pet-thor.jpg
│   ├── pet-rex.jpg
│   ├── pet-mel.jpg
│   ├── pet-nina.jpg
│   └── pet-ninhada.jpg
└── README.md
```

> A **logo oficial** (`logo-meu4patas.png`) teve o fundo removido e é exibida diretamente
> na top bar e no rodapé, sem chip ou caixa branca.
> As imagens dos pets são fotos reais em JPG/PNG.

> Os formulários de **cadastro de usuário** e **cadastro de pet** ficam em **páginas próprias**
> (`cadastro.html` e `cadastrar-pet.html`), e não na landing page. Os três HTML compartilham o
> mesmo `css/style.css` e `js/script.js`. Após um cadastro bem-sucedido, o usuário é redirecionado
> de volta para o `index.html`.

> Observação: a logo (`assets/logo-meu4patas.png`) é um PNG com fundo transparente e as fotos dos
> pets são imagens reais em JPG/PNG.

### Chaves de `localStorage`

| Chave                  | Conteúdo                                   |
| :--------------------- | :----------------------------------------- |
| `meu4patas_usuario`    | Dados do usuário cadastrado                 |
| `meu4patas_pets`       | Lista de pets (iniciais + cadastrados)      |
| `meu4patas_interesses` | IDs dos pets em que o usuário tem interesse |
| `meu4patas_recusas`    | IDs dos pets recusados no explorar          |
| `meu4patas_interessados` | Quem demonstrou interesse em cada pet (para o responsável) |

> Para **reiniciar** o protótipo (voltar aos pets iniciais), limpe o `localStorage` do site
> pelo DevTools do navegador (Application → Local Storage) ou rode `localStorage.clear()` no console.

---

## 🚧 Fase 02 — Back-end real (próxima fase)

A próxima fase substituirá o `localStorage` por um back-end real, mantendo a mesma interface:

| Camada            | Tecnologia                  |
| :---------------- | :-------------------------- |
| Apresentação      | HTML5 & CSS3                |
| Interação         | JavaScript (DOM & Fetch)    |
| Negócio (servidor)| PHP 8                       |
| Persistência      | SQLite via PDO              |

Inclui: API JSON, Fetch API real, CRUD completo, relacionamento entre adotante e pet, status real
de adoção e banco com registros de teste. Os diretórios [api/](api/), [database/](database/) e
[src/](src/) contêm o esboço inicial dessa fase.

---

## 👥 Integrantes (Grupo 6)

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Anbuyyy9">
        <img src="https://github.com/Anbuyyy9.png" width="100px;" alt="Foto do Gabriel Anthony"/><br />
        <sub><b>Gabriel Anthony</b></sub>
      </a><br />
      <a href="https://www.linkedin.com/in/gabriel-anthony-ab92211b5/" target="_blank">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Badge"/>
      </a>
    </td>
  </tr>
</table>
