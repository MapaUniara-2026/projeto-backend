# Contrato da API — Mapa Interativo 2D, Unidade 4

Fonte: "Revisão dos Contratos das APIs e Padrões de Integração" (Grupo 2 — Arquitetura, 22/10/2026).

> **Regra:** este arquivo é a fonte única do contrato. Atualize-o **no mesmo PR** que alterar qualquer rota.

## 1. Rotas

O front-end consome apenas rotas de leitura. A sala é identificada pelo **código** (ex.: `BL4-104`), nunca pelo ID numérico.

| Rota | Retorno | Situação |
|---|---|---|
| `GET /api/health` | Estado da API e do banco (exceção: formato próprio, ver 4) | ✅ implementada |
| `GET /api/salas?andar=&tipo=&busca=` | Lista de salas para o mapa e a busca, sem fotografias | ⏳ parcial (só lista, sem filtros) |
| `GET /api/salas/ocupacao?dia=&hora=` | Ocupação e disponibilidade das salas | ⏳ pendente |
| `GET /api/salas/:codigo` | Detalhe da sala, com fotografias | ⏳ pendente |
| `GET /api/aulas?curso=&dia=&periodo=&sala=` | Aulas com filtros combinados | ⏳ pendente |
| `GET /api/cursos` | Opções do filtro de curso | ✅ implementada |

- `/api/salas/ocupacao` deve ser declarada **antes** de `/api/salas/:codigo`; senão `ocupacao` é lido como código de sala.
- Filtros ficam na URL (permitem compartilhar o link e usar cache do navegador).
- Fotografias aparecem apenas no detalhe da sala (o mapa carrega mais rápido, RNF04).
- Resultado vazio não é erro: retorna `200` com `[]` (o front mostra a mensagem do RF15).
- As rotas de escrita atuais (`POST/PUT/DELETE /api/cursos`, `POST /api/salas`) não fazem parte do contrato do front e ainda não têm autenticação (RNF08). Decisão pendente com o time.

## 2. Fotografias na resposta

```json
"fotos": [{ "url": "...", "descricao": "..." }]
```

Sala sem fotografia retorna `"fotos": []`. A `descricao` é o texto alternativo (acessibilidade, RNF10).

## 3. Padrão de valores

| Campo | Padrão | Observação |
|---|---|---|
| dia | `SEGUNDA`, `TERCA`, `QUARTA`, `QUINTA`, `SEXTA` | RN04. `SABADO` e `DOMINGO` são recusados com 400 |
| período | `MATUTINO`, `VESPERTINO`, `NOTURNO` | RN03. Classificado pelo horário de início: antes de 12:00, antes de 18:00, depois |
| horário | `"HH:MM"` (24h) | `"19:00"` vale; `"9:00"`, `"24:00"`, `"19:60"` retornam 400 |
| fuso horário | `America/Sao_Paulo` | O servidor opera em UTC; a ocupação usa `src/lib/tempo.js` |
| nomes dos campos | camelCase em português | |
| dado ausente | `null`, sem omitir o campo | RF17 |
| identificador numérico | inteiro positivo | `abc`, `0`, `-1`, `1.5` retornam 400 |

Implementação: `src/lib/validacao.js` e `src/lib/tempo.js`.

## 4. Formato de erro

Todo erro segue:

```json
{ "erro": "mensagem", "codigo": "..." }
```

| Status | Situação | `codigo` |
|---|---|---|
| 400 | Parâmetro inválido (inclui ID não numérico, JSON malformado, corpo ausente) | `PARAMETRO_INVALIDO` |
| 404 | Registro ou rota não encontrada | `NAO_ENCONTRADO` |
| 409 | Conflito (valor duplicado, vínculo em uso) | `CONFLITO` |
| 409 | Horário sobreposto na sala | `CONFLITO_HORARIO_SALA` |
| 409 | Horário sobreposto na turma | `CONFLITO_HORARIO_TURMA` |
| 500 | Erro inesperado (sem detalhes internos) | `ERRO_INTERNO` |
| 503 | Banco de dados indisponível | `BANCO_INDISPONIVEL` |

Por que: o RF16 exige mensagem de erro com nova tentativa, e o front só consegue tratar de forma consistente se todos os erros tiverem a mesma estrutura.

Exceção: `GET /api/health` devolve `{ status, ambiente, banco }` (também com 503 quando o banco cai), porque é usado pelo workflow que mantém o Supabase ativo.

Implementação: `src/middlewares/erros.js`. Nas rotas, lance `ErroValidacao`, `naoEncontrado()` ou `conflito()`; o Express 5 encaminha o erro para o tratador automaticamente, inclusive em funções `async`.

## 5. Sobreposição de horários

O `@@unique` do schema só impede dois horários com o **mesmo início**. Para barrar também `19:00–20:40` junto de `20:00–21:40`, chame `verificarConflitoHorario(prisma, dados)` (`src/lib/horarios.js`) antes de criar ou editar um `Horario`. Ela confere a **sala** e a **turma** e usa intervalos abertos no fim: `19:00–20:40` e `20:40–22:20` não conflitam.

## 6. Padrões de integração

- Cliente HTTP único no front-end; URL da API e CORS definidos por ambiente.
- Fluxo de branches: feature → dev → qa → main.
- O back-end é publicado **antes** do front-end e mantém compatibilidade: adiciona campos e rotas, sem renomear ou remover de uma só vez (são dois repositórios; um não pode quebrar o outro durante a atualização).
- O front-end cancela a requisição anterior quando o filtro muda (RNF12: nunca mostrar resultado antigo como se fosse do filtro atual).
- Este contrato vive no repositório do back-end e é atualizado no mesmo PR que alterar uma rota.

## 7. Testes

`npm test` roda `tests/padroes-api.test.js` (formato de erro, valores, fuso e sobreposição), sem precisar de banco.
