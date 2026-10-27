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

| Rota | Retorno | Status |
|---|---|---|
| [`GET /api/health`](#get-apihealth) | Saúde da API e do banco | ✅ |
| [`GET /api/cursos`](#get-apicursos) | Opções do filtro de curso | ✅ |
| [`GET /api/salas`](#get-apisalas) | Lista de salas para o mapa e a busca, sem fotografias | ⏳ |
| [`GET /api/salas/ocupacao`](#get-apisalasocupacao) | Ocupação e disponibilidade das salas | ⏳ |
| [`GET /api/salas/:codigo`](#get-apisalascodigo) | Detalhe da sala, com fotografias | ⏳ |
| [`GET /api/aulas`](#get-apiaulas) | Aulas com filtros combinados | ⏳ |

✅ implementada na `dev` · ⏳ em desenvolvimento (atualizar esta tabela no PR que implementar)

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

Lista de cursos para popular o **filtro de curso**. O `codigo` retornado é o valor usado no parâmetro `curso` de [`GET /api/aulas`](#get-apiaulas).

**Parâmetros:** nenhum.

**200** — ordenado por `nome`

```json
[
  { "codigo": "ES", "nome": "Engenharia de Software" },
  { "codigo": "SI", "nome": "Sistemas de Informação" }
]
```

Sem cursos cadastrados → `[]`.

**Cache:** `Cache-Control: public, max-age=300`. A lista muda raramente, então o navegador reaproveita a resposta por 5 minutos.

**Erros:** `500`, `503`.

**Uso no front-end:**

```js
const cursos = await api('/api/cursos')
```

---

### `GET /api/salas`

Lista de salas para desenhar o mapa e para a busca. **Não inclui fotografias** — elas vêm só no detalhe, para o mapa carregar mais rápido (RNF04).

| Parâmetro | Tipo | Exemplo | Descrição |
|---|---|---|---|
| `andar` | inteiro | `1` | Filtra pelo andar. |
| `tipo` | texto | `LABORATORIO` | Filtra pelo tipo de sala. |
| `busca` | texto | `104` | Busca pelo código/nome da sala. |

Todos opcionais e combináveis. **Erros:** `400` (`andar` não inteiro), `500`, `503`.

> ⏳ Formato da resposta: documentar no PR que implementar a rota.

---

### `GET /api/salas/ocupacao`

Ocupação e disponibilidade das salas em um dia e horário.

| Parâmetro | Tipo | Exemplo |
|---|---|---|
| `dia` | `SEGUNDA`…`SEXTA` | `QUARTA` |
| `hora` | `HH:MM` | `19:30` |

Horário no fuso `America/Sao_Paulo`. **Erros:** `400` (`dia` ou `hora` fora do padrão), `500`, `503`.

> ⚠️ Esta rota precisa ser declarada **antes** de `/api/salas/:codigo`.
>
> ⏳ Formato da resposta: documentar no PR que implementar a rota.

---

### `GET /api/salas/:codigo`

Detalhe de uma sala, **com fotografias**.

| Parâmetro de rota | Exemplo |
|---|---|
| `codigo` | `BL4-104` |

**Fotografias** (contrato, seção 2.4):

```json
"fotos": [
  { "url": "https://.../bl4-104-1.jpg", "descricao": "Vista da porta de entrada da sala BL4-104" }
]
```

- `fotos` é sempre uma **lista** (uma ou várias fotos por local).
- Sala sem foto → `"fotos": []` (dado ausente, RF17), **não** erro.
- `descricao` é o texto alternativo da imagem, para acessibilidade (RNF10).

**Erros:** `404` (sala não existe), `500`, `503`.

> ⏳ Demais campos da resposta: documentar no PR que implementar a rota.

---

### `GET /api/aulas`

Aulas com filtros combinados. Cada aula traz **sala, disciplina, curso, professor e turma** (entidades do DER).

| Parâmetro | Tipo | Exemplo |
|---|---|---|
| `curso` | código do curso (de [`GET /api/cursos`](#get-apicursos)) | `SI` |
| `dia` | `SEGUNDA`…`SEXTA` | `SEGUNDA` |
| `periodo` | `MATUTINO` \| `VESPERTINO` \| `NOTURNO` | `NOTURNO` |
| `sala` | código da sala | `BL4-104` |

Exemplo: `GET /api/aulas?curso=SI&dia=SEGUNDA&periodo=NOTURNO`

Nenhuma aula para o filtro → `[]`. **Erros:** `400`, `500`, `503`.

> ⏳ Formato da resposta: documentar no PR que implementar a rota.

---

## Estrutura das rotas no código

```
src/app.js              → app.use('/api', rotas)
src/routes/index.js     → monta cada entidade: /health, /cursos, /salas ...
src/routes/<entidade>.routes.js
```

### Como adicionar uma rota

1. Crie ou edite `src/routes/<entidade>.routes.js` (somente `GET`).
2. Monte a entidade em `src/routes/index.js` — **não** em `app.js`.
3. Dentro do router, declare rotas fixas antes das com parâmetro (`/ocupacao` antes de `/:codigo`).
4. Documente a rota aqui, no mesmo PR, e atualize o status no [Sumário](#sumário).

## Compatibilidade entre front e back

São dois repositórios, então:

1. O back-end é publicado **antes** do front-end.
2. O back-end **adiciona** campos e rotas; não renomeia nem remove de uma vez.
3. CORS e URL da API são configurados por ambiente (`CORS_ORIGIN` no back, URL base no front).
