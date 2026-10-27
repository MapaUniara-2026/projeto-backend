# Consultas acadêmicas e filtros combinados

Rotas de consulta do Mapa Interativo: aulas, turmas e professores, com filtros que podem ser combinados. Tudo `GET`, porque o sistema é de consulta. Para testar pelo navegador, rode a API e abra **http://localhost:3000/api/docs** (Swagger).

## Rotas

Todo filtro é opcional. Os que forem informados se somam: a resposta traz só o que atende a todos (RF11).

| Rota | Filtros | Exemplo |
| --- | --- | --- |
| `GET /api/aulas` | `dia`, `periodo`, `curso`, `sala`, `turma`, `semestre`, `professor` | `/api/aulas?curso=SI&dia=SEGUNDA&periodo=NOTURNO` |
| `GET /api/turmas` | `curso`, `semestre`, `professor` | `/api/turmas?curso=SI` |
| `GET /api/professores` | — | `/api/professores` |
| `GET /api/docs` | — | documentação Swagger |

Exemplo de uma aula na resposta:

```json
{
  "id": 1,
  "dia": "SEGUNDA",
  "inicio": "19:00",
  "fim": "20:40",
  "periodo": "NOTURNO",
  "sala": { "codigo": "BL4-104", "bloco": "BL4" },
  "turma": { "codigo": "SI6-01", "semestre": "2026.2" },
  "curso": { "codigo": "SI", "nome": "Sistemas de Informação" },
  "professor": { "id": 1, "nome": "Carlos Almeida" }
}
```

## Regras

| Regra | Como ficou |
| --- | --- |
| RN03 — período | Pela hora de início: antes de 12:00 é MATUTINO, de 12:00 a 17:59 é VESPERTINO, a partir de 18:00 é NOTURNO |
| RN04 — segunda a sexta | `dia` só aceita SEGUNDA a SEXTA; sem filtro, a API também só devolve aulas de segunda a sexta |
| RF07 — aulas da sala | `sala=BL4-104` junto com os outros filtros |
| RF15 — sem resultado | Lista vazia com status 200, pro front mostrar o aviso |

Filtro com valor errado responde **400** com o campo `erro` explicando: dia ou período fora da lista, `professor` que não é número, código com caractere estranho ou mais de 20 caracteres, ou o mesmo filtro repetido na URL (`?sala=A&sala=B`). Códigos não diferenciam maiúscula de minúscula. O e-mail do professor não vai nas respostas.

## Onde está no código

| Arquivo | O que faz |
| --- | --- |
| `src/lib/filtros.js` | Dias, períodos e validação dos filtros |
| `src/routes/aulas.routes.js` | `GET /api/aulas` |
| `src/routes/turmas.routes.js` | `GET /api/turmas` |
| `src/routes/professores.routes.js` | `GET /api/professores` |
| `src/docs/openapi.js` e `src/routes/docs.routes.js` | Swagger em `/api/docs` |
| `tests/consultas.test.js` | Testes dos filtros (`npm test`) |

O seed (`npm run db:seed`) usa os mesmos dados de exemplo do front: salas BL4-101 a BL4-114, cursos SI, EC e IA e as 14 aulas.

## Ainda falta

- **Disciplina:** o requisito pede a disciplina da aula, mas ela ainda não existe no banco. Precisa entrar no DER/schema primeiro.
- **Fotos dos pontos de orientação (v1.2):** dependem de tabelas novas no banco.
- **Salas:** filtro por bloco e detalhe da sala (`/api/salas/:codigo`), depois que a branch de validação do Felipe entrar.
- **RNF08:** proteger as rotas de cadastro com uma chave, também depois da branch de validação.
- **Unificar a validação:** passar os filtros para o `validacao.js` do Felipe quando ele entrar na `dev`.
