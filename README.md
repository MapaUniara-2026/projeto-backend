# Projeto da Faculdade — Back-end

API do sistema de alocação acadêmica (salas, cursos, turmas, professores e horários).

| | |
|---|---|
| Linguagem | Node.js (JavaScript) + Express |
| Banco | PostgreSQL + Prisma (ORM) |
| Hospedagem | Vercel (API) + Supabase (banco, plano gratuito) |

> 🔗 Front-end: [MapaUniara-2026/projeto-frontend](https://github.com/MapaUniara-2026/projeto-frontend)
> 📁 Modelagem (UML, DER, requisitos): **[link da pasta do Drive]**
> 📘 **Documentação dos endpoints: [docs/API.md](docs/API.md)**

---

## 1. Fluxo de branches e ambientes

```
feature/minha-tarefa ──PR──▶ dev ──PR──▶ qa ──PR──▶ main
                             (DEV)      (QA)       (PRD)
```

| Branch | Ambiente | Aceita PR de | Ao mergear |
|---|---|---|---|
| `dev` | DEV | `feature/*`, `fix/*`, `hotfix/*`, `chore/*`, `docs/*`, `refactor/*`, `test/*` | Vercel migra o banco DEV e publica |
| `qa` | QA | somente `dev` | Vercel migra o banco QA e publica + tag `vX.Y.Z-rc.N` |
| `main` | PRD | somente `qa` | Vercel migra o banco PRD e publica + tag `vX.Y.Z` + Release |

- Push direto em `dev`, `qa` ou `main` é bloqueado (inclusive para administradores).
- Todo PR precisa passar nos checks **Validar branch de origem** e **Back-end** (e **Validar versão** quando for para `main`).
- Branches `feature/*` ganham um preview na Vercel ligado ao banco DEV, mas **não** aplicam migrações.

---

## 2. Rodando na sua máquina

Requisitos: Node.js 22+, Git e Docker (ou a connection string do Supabase DEV).

```bash
git clone https://github.com/MapaUniara-2026/projeto-backend.git
cd projeto-backend
npm install
cp .env.example .env
npm run db:up          # PostgreSQL local no Docker
npm run db:deploy      # cria as tabelas
npm run db:seed        # (opcional) dados de exemplo
npm run dev            # http://localhost:3000/api/health
```

---

## 3. Dia a dia

```bash
git checkout dev && git pull
git checkout -b feature/cadastro-salas
# ... código ...
git add . && git commit -m "feat: cadastro de salas"
git push -u origin feature/cadastro-salas
gh pr create --base dev
```

Depois de validado em DEV, abra o PR `dev → qa`. Aprovado em QA, abra `qa → main`.

Padrão de commits: [Conventional Commits](https://www.conventionalcommits.org/pt-br/) — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.

### Mexendo no banco (Prisma)

1. Edite `prisma/schema.prisma`.
2. Gere a migração: `npm run db:migrate -- --name descricao_curta`
3. Commite **o schema e a pasta `prisma/migrations`** juntos no mesmo PR.

O CI aplica todas as migrações num banco limpo e falha se o `schema.prisma` tiver mudanças sem migração. Nunca edite uma migração já mergeada; crie uma nova.

Úteis: `npm run db:studio` (interface para ver os dados), `npm run db:reset` (zera o banco local).

### Estrutura

```
prisma/
├── schema.prisma        # modelo do banco (alinhar com o DER)
├── migrations/          # histórico de mudanças do banco
└── seed.js              # dados de exemplo
src/
├── app.js               # configura o Express (usado pela Vercel)
├── local.js             # sobe o servidor localmente
├── lib/prisma.js        # conexão com o banco
├── middlewares/erros.js # converte erros do banco em respostas HTTP
└── routes/
    ├── index.js         # monta todas as rotas sob /api (adicione novas entidades aqui)
    └── *.routes.js      # uma rota por entidade
docs/API.md              # documentação dos endpoints (atualizar no mesmo PR que alterar uma rota)
scripts/vercel-build.js  # build na Vercel (gera o client + migra nas branches de ambiente)
```

As regras de integridade (RNF11) ficam no banco: chaves estrangeiras, `onDelete: Restrict` e `@@unique`. A API transforma violações em respostas claras: **409** para duplicidade ou registro em uso, **404** para não encontrado.

---

## 4. Versionamento (SemVer)

| Mudança | Comando | Exemplo |
|---|---|---|
| Correção | `npm run release:patch` | 1.0.0 → 1.0.1 |
| Funcionalidade nova | `npm run release:minor` | 1.0.0 → 1.1.0 |
| Quebra de compatibilidade | `npm run release:major` | 1.0.0 → 2.0.0 |

Rode o comando numa branch (ex.: `chore/release-1.1.0`) e mande pelo fluxo normal. O PR para `main` falha se a versão já tiver sido publicada.

---

## 5. Configuração inicial (uma vez)

### 5.1 GitHub

Com o [GitHub CLI](https://cli.github.com/) logado (`gh auth login`):

**Windows (PowerShell):**

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-github.ps1 MapaUniara-2026/projeto-backend 0
```

**Linux / Mac / Git Bash:**

```bash
./scripts/setup-github.sh MapaUniara-2026/projeto-backend 0
```

Use `0` aprovações enquanto estiver sozinho na organização (o GitHub não deixa aprovar o próprio PR). Depois que o time entrar, mude para 1 em **Settings → Branches**.

Cria o repositório público, as branches `dev` e `qa`, define `dev` como padrão e aplica as proteções.

### 5.2 Supabase

O plano gratuito permite 2 projetos:

| Projeto Supabase | Ambientes | Schema |
|---|---|---|
| `projeto-nao-prd` | DEV e QA | `dev` e `qa` |
| `projeto-prd` | PRD | `prd` |

Cada ambiente usa seu próprio schema (definido pelo `?schema=` na connection string), então os dados nunca se misturam. Os schemas são criados na primeira migração.

Em cada projeto, **Project Settings → Database → Connection string**:
- **Transaction pooler** (porta 6543) → `DATABASE_URL`
- **Session pooler** (porta 5432) → `DIRECT_URL`

e acrescente `?schema=dev`, `?schema=qa` ou `?schema=prd` no final.

### 5.3 Vercel

1. **Add New → Project**, importe este repositório. Production Branch: `main`.
2. **Settings → Domains**: adicione `projeto-api-dev.vercel.app` (Git Branch `dev`) e `projeto-api-qa.vercel.app` (Git Branch `qa`).
3. **Settings → Environment Variables**:

| Variável | Production (PRD) | Preview — branch `qa` | Preview — demais branches (DEV) |
|---|---|---|---|
| `APP_ENV` | `PRD` | `QA` | `DEV` |
| `DATABASE_URL` | projeto-prd, 6543, `?schema=prd` | projeto-nao-prd, 6543, `?schema=qa` | projeto-nao-prd, 6543, `?schema=dev` |
| `DIRECT_URL` | projeto-prd, 5432, `?schema=prd` | projeto-nao-prd, 5432, `?schema=qa` | projeto-nao-prd, 5432, `?schema=dev` |
| `CORS_ORIGIN` | URL do front PRD | URL do front QA | URL do front DEV, `https://projeto-front-*-<conta>.vercel.app` |

As migrações rodam no build (`scripts/vercel-build.js`), **antes** da nova versão entrar no ar, e só em `dev`, `qa` e `main`. Se a migração falhar, o deploy falha e a versão anterior continua no ar.

### 5.4 Evitar que o Supabase pause

Projetos gratuitos pausam após 1 semana sem uso. O workflow `manter-supabase-ativo.yml` chama a API a cada 3 dias. Ative criando a variável `HEALTH_URLS` em **Settings → Secrets and variables → Actions → Variables**, com as URLs de `/api/health` dos 3 ambientes separadas por espaço.

---

## 6. Ordem de deploy com o front-end

Como são repositórios separados, uma mudança que mexe nos dois sobe em dois PRs. Suba **primeiro o back-end** e mantenha a API compatível com a versão anterior do front (adicione campos e rotas novas em vez de renomear ou remover de uma vez).
