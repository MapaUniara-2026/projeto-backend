# Contrato da API — Mapa Interativo 2D (Unidade 4)

Documentação dos endpoints consumidos pelo front-end (React) e servidos pelo back-end (Express).
Base: *Revisão dos Contratos das APIs e Padrões de Integração* (Sprint 1, 22/10/2026).

> **Regra:** todo PR que criar ou alterar uma rota atualiza este arquivo **no mesmo PR**.

| Ambiente | URL base |
|---|---|
| Local | `http://localhost:3000` |
| DEV | `https://projeto-api-dev.vercel.app` |
| QA | `https://projeto-api-qa.vercel.app` |
| PRD | URL de produção da Vercel |

No front-end, a URL base vem da variável de ambiente e todas as chamadas passam pelo cliente HTTP único (`src/services/api.js`).

---

## Sumário

| Rota | Retorno |
|---|---|
| [`GET /api/health`](#get-apihealth) | Saúde da API e do banco |
| [`GET /api/cursos`](#get-apicursos) | Opções do filtro de curso |
| [`GET /api/cursos/:id`](#get-apicursosid) | Um curso |
| [`GET /api/salas`](#get-apisalas) | Lista de salas para o mapa e a busca, sem fotografias |
| [`GET /api/salas/ocupacao`](#get-apisalasocupacao) | Ocupação e disponibilidade das salas |
| [`GET /api/salas/:codigo`](#get-apisalascodigo) | Detalhe da sala, com fotografias |
| [`GET /api/aulas`](#get-apiaulas) | Aulas com filtros combinados |
| [`GET /api/aulas/:id`](#get-apiaulasid) | Uma aula |
| [`GET /api/horarios`](#get-apihorarios) | Registros de horário com os ids das relações |

Ao criar uma rota, acrescente uma linha aqui e a seção dela em [Rotas](#rotas).

O contrato com o front-end é **somente leitura** (RNF08): só rotas `GET`.

---

## Padrões gerais

### Identificação da sala

A sala é identificada pelo **código** (ex.: `BL4-104`), nunca pelo ID numérico. O código é o mesmo no mapa, no banco e nas fotografias, e não muda entre DEV, QA e PRD.

### Filtros

Filtros vão na **query string** (`?dia=SEGUNDA&periodo=NOTURNO`), para o link poder ser compartilhado e o navegador guardar a resposta em cache. Resultado vazio não é erro: retorna `200` com `[]`.

### Padrão de valores

| Campo | Padrão | Observação |
|---|---|---|
| Dia | `SEGUNDA`, `TERCA`, `QUARTA`, `QUINTA`, `SEXTA` | RN04 |
| Período | `MATUTINO`, `VESPERTINO`, `NOTURNO` | RN03 |
| Horário | `"HH:MM"` (24h) | Ex.: `"19:30"` |
| Fuso horário | `America/Sao_Paulo` | O servidor roda em UTC. |
| Nomes dos campos | camelCase em português | Ex.: `horaInicio` |
| Dado ausente | `null`, sem omitir o campo | RF17 |

### Formato de erro

Todo erro segue o formato do contrato (seção 2.6):

```json
{ "erro": "Mensagem legível para o usuário.", "codigo": "PARAMETRO_INVALIDO" }
```

| Status | Situação |
|---|---|
| 400 | Parâmetro inválido |
| 404 | Registro não encontrado |
| 409 | Conflito |
| 500 | Erro inesperado |
| 503 | Banco de dados indisponível |

O front-end mostra a mensagem com opção de **tentar novamente** (RF16). A lista de valores de `codigo` é definida na padronização de erros (`src/middlewares/erros.js`).

### Requisições concorrentes

Quando o filtro muda, o front cancela a requisição anterior antes de disparar a nova, para nunca exibir um resultado antigo como se fosse do filtro atual (RNF12).

---

## Rotas

### `GET /api/health`

Saúde da API e conexão com o banco. Usado pelo front (indicador de status) e pelo workflow que mantém o Supabase ativo. Tem formato próprio.

**200**

```json
{ "status": "ok", "ambiente": "DEV", "banco": "ok" }
```

**503** — banco fora do ar

```json
{ "status": "degradado", "ambiente": "DEV", "banco": "indisponível" }
```

---

### `GET /api/cursos`

Lista de cursos para popular o **filtro de curso**. A `sigla` é o valor usado no parâmetro `curso` de [`GET /api/aulas`](#get-apiaulas).

**Parâmetros:** nenhum.

**200** — ordenado por `nome`

```json
[
  { "id": 2, "sigla": "EC", "nome": "Engenharia de Computação" },
  { "id": 1, "sigla": "SI", "nome": "Sistemas de Informação" }
]
```

Sem cursos cadastrados → `[]`. **Erros:** `500`, `503`.

**Uso no front-end:**

```js
const cursos = await api('/api/cursos')
```

### `GET /api/cursos/:id`

Mesmo formato de um item da lista. **Erros:** `400` (id não inteiro), `404`, `500`, `503`.

---

### `GET /api/salas`

Lista de salas para desenhar o mapa e para a busca. **Não inclui fotografias** — elas vêm só no detalhe, para o mapa carregar mais rápido (RNF04).

| Parâmetro | Tipo | Exemplo | Descrição |
|---|---|---|---|
| `andar` | inteiro | `0` | Filtra pelo andar (0 = térreo). |
| `tipo` | texto | `LABORATORIO` | Filtra pelo tipo de sala. |
| `busca` | texto | `104` | Busca no código ou no nome, sem diferenciar maiúsculas. |

Todos opcionais e combináveis.

**200** — ordenado por `codigo`

```json
[
  {
    "codigo": "BL4-104",
    "nome": "Sala 104",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "..."
  }
]
```

**Erros:** `400` (`andar` não inteiro), `500`, `503`.

---

### `GET /api/salas/ocupacao`

Ocupação das salas em um dia e horário. Sem parâmetros, usa o momento atual no fuso `America/Sao_Paulo`. Áreas sem aula (`CIRCULACAO`, `SERVICO`) ficam de fora.

| Parâmetro | Tipo | Exemplo |
|---|---|---|
| `dia` | `SEGUNDA`…`SEXTA` | `QUARTA` |
| `hora` | `HH:MM` | `19:30` |

`dia` e `hora` vão juntos ou nenhum dos dois.

**200** — cada sala com `ocupada` e a `aula` em andamento (mesmo formato de [`GET /api/aulas`](#get-apiaulas)) ou `null`

```json
[
  { "codigo": "BL4-101", "nome": "Sala 101", "bloco": "BL4", "andar": 0, "tipo": "SALA_DE_AULA", "localizacaoMapa": "...", "ocupada": false, "aula": null }
]
```

**Erros:** `400` (`dia` ou `hora` fora do padrão, ou só um dos dois), `500`, `503`.

> ⚠️ Esta rota precisa ser declarada **antes** de `/api/salas/:codigo`.

---

### `GET /api/salas/:codigo`

Detalhe de uma sala, **com fotografias**. O código não diferencia maiúsculas (`bl4-104` = `BL4-104`).

**200** — os campos da lista, mais `fotos`

```json
{
  "codigo": "BL4-104",
  "nome": "Sala 104",
  "bloco": "BL4",
  "andar": 0,
  "tipo": "SALA_DE_AULA",
  "localizacaoMapa": "...",
  "fotos": [
    { "url": "https://.../bl4-104-1.jpg", "descricao": "Vista da porta de entrada da sala BL4-104" }
  ]
}
```

- `fotos` é sempre uma **lista** (uma ou várias fotos por local).
- Sala sem foto → `"fotos": []` (dado ausente, RF17), **não** erro.
- `descricao` é o texto alternativo da imagem, para acessibilidade (RNF10).

**Erros:** `404` (sala não existe), `500`, `503`.

---

### `GET /api/aulas`

Aulas com filtros combinados (E). Cada aula traz **sala, disciplina, curso, professor e turma** (entidades do DER).

| Parâmetro | Tipo | Exemplo |
|---|---|---|
| `curso` | sigla do curso (de [`GET /api/cursos`](#get-apicursos)) | `SI` |
| `dia` | `SEGUNDA`…`SEXTA` | `SEGUNDA` |
| `periodo` | `MATUTINO` \| `VESPERTINO` \| `NOTURNO` | `NOTURNO` |
| `sala` | código da sala | `BL4-104` |
| `bloco` | bloco da sala | `BL4` |
| `turma` | nome da turma | `SI-6A` |
| `professor` | parte do nome | `Almeida` |
| `semestre` | inteiro de 1 a 20 | `6` |
| `inicio` / `fim` | `HH:MM` | `19:00` / `22:40` |

Exemplo: `GET /api/aulas?curso=SI&dia=SEGUNDA&periodo=NOTURNO`

Parâmetro desconhecido → `400`. Nenhuma aula para o filtro → `[]`.

**200** — ordenado por dia, hora de início e sala

```json
[
  {
    "id": 12,
    "diaSemana": "SEGUNDA",
    "periodo": "NOTURNO",
    "horaInicio": "19:00",
    "horaTermino": "20:40",
    "sala": { "codigo": "BL4-104", "nome": "Sala 104", "andar": 0 },
    "curso": { "sigla": "SI", "nome": "Sistemas de Informação" },
    "disciplina": { "nome": "Engenharia de Software II" },
    "professor": { "nome": "Prof. Carlos Almeida" },
    "turma": { "nome": "SI-6A", "semestre": 6 }
  }
]
```

**Erros:** `400`, `500`, `503`.

### `GET /api/aulas/:id`

Mesmo formato de um item da lista. **Erros:** `400` (id não inteiro), `404`, `500`, `503`.

---

### `GET /api/horarios`

Registros de horário (linhas da tabela `aulas`) com os **ids** das relações. Para a tela, use [`GET /api/aulas`](#get-apiaulas).

| Parâmetro | Tipo | Exemplo |
|---|---|---|
| `dia` | `SEGUNDA`…`SEXTA` | `TERCA` |
| `salaId` | inteiro | `3` |
| `turmaId` | inteiro | `7` |

**200**

```json
[
  { "id": 12, "salaId": 3, "cursoId": 1, "disciplinaId": 5, "professorId": 2, "turmaId": 7, "diaSemana": "SEGUNDA", "periodo": "NOTURNO", "horaInicio": "19:00", "horaTermino": "20:40" }
]
```

`GET /api/horarios/:id` devolve um registro. **Erros:** `400`, `404`, `500`, `503`.

---

## Estrutura das rotas no código

```
src/app.js              → app.use('/api', rotas)
src/routes/index.js     → monta cada entidade: /health, /cursos, /salas, /aulas, /horarios
src/routes/<entidade>.routes.js
```

### Como adicionar uma rota

1. Crie ou edite `src/routes/<entidade>.routes.js` (somente `GET`).
2. Monte a entidade em `src/routes/index.js` — **não** em `app.js`.
3. Dentro do router, declare rotas fixas antes das com parâmetro (`/ocupacao` antes de `/:codigo`).
4. Documente a rota aqui, no mesmo PR, e acrescente a linha dela no [Sumário](#sumário).

## Compatibilidade entre front e back

São dois repositórios, então:

1. O back-end é publicado **antes** do front-end.
2. O back-end **adiciona** campos e rotas; não renomeia nem remove de uma vez.
3. CORS e URL da API são configurados por ambiente (`CORS_ORIGIN` no back, URL base no front).
