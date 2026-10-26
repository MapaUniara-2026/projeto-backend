# Relatório da revisão do contrato da API

| | |
|---|---|
| Data | 26/10/2026, 20:25:01 |
| Ambiente | Local (`http://localhost:3000/api`) |
| Requests | 15 de 22 sem divergências |
| Verificações | 61 de 69 aprovadas |

## Resumo

| | Pasta | Request | Status | Verificações |
|---|---|---|---|---|
| ✅ | 0. Health | Health | 200 | 3/3 |
| ✅ | 1. Salas | Listar salas | 200 | 7/7 |
| ✅ | 1. Salas | Filtrar salas por andar | 200 | 3/3 |
| ✅ | 1. Salas | Filtrar salas por tipo | 200 | 3/3 |
| ✅ | 1. Salas | Buscar salas | 200 | 3/3 |
| ✅ | 1. Salas | Detalhe da sala (com fotos) | 200 | 6/6 |
| ✅ | 1. Salas | Detalhe de sala sem fotos | 200 | 3/3 |
| ✅ | 1. Salas | Sala inexistente | 404 | 2/2 |
| ✅ | 2. Aulas | Listar aulas | 200 | 5/5 |
| ✅ | 2. Aulas | Aulas com filtros combinados | 200 | 3/3 |
| ✅ | 2. Aulas | Aulas de uma sala | 200 | 3/3 |
| ❌ | 2. Aulas | Dia fora do padrão (SABADO) | 400 | 1/2 |
| ❌ | 2. Aulas | Período inválido | 400 | 1/2 |
| ✅ | 3. Ocupação | Ocupação em dia e hora | 200 | 5/5 |
| ✅ | 3. Ocupação | Ocupação agora (fuso) | 200 | 2/2 |
| ❌ | 3. Ocupação | Hora inválida | 400 | 1/2 |
| ❌ | 3. Ocupação | Dia inválido | 400 | 1/2 |
| ✅ | 4. Cursos | Listar cursos | 200 | 5/5 |
| ❌ | 4. Cursos | Curso com ID inválido | 500 | 0/2 |
| ✅ | 4. Cursos | Curso inexistente | 404 | 2/2 |
| ❌ | 5. Erros gerais | Rota inexistente | 404 | 1/2 |
| ❌ | 5. Erros gerais | JSON malformado | 400 | 1/2 |

## 0. Health

### ✅ Health

`GET http://localhost:3000/api/health` → **200** em 173 ms

**O que o contrato espera:** Esperado: 200 com `status: ok` e `banco: ok`. Se der 503, o banco está fora e os outros testes vão falhar.

- ✅ status 200
- ✅ resposta em JSON
- ✅ banco ok

<details><summary>Resposta recebida</summary>

```json
{
  "status": "ok",
  "ambiente": "LOCAL",
  "banco": "ok"
}
```

</details>

## 1. Salas

### ✅ Listar salas

`GET http://localhost:3000/api/salas` → **200** em 47 ms

**O que o contrato espera:** **2.3** Lista para o mapa e a busca, **sem fotografias** (RNF04). **2.5** Campos em camelCase; dado ausente vem `null`, não omitido.

- ✅ status 200
- ✅ resposta em JSON
- ✅ retorna lista
- ✅ toda sala tem codigo
- ✅ lista não traz fotos (RNF04)
- ✅ andar e tipo presentes (null se ausente)
- ✅ campos em camelCase

<details><summary>Resposta recebida</summary>

```json
[
  {
    "codigo": "BL4-101",
    "nome": "Sala 101",
    "bloco": "BL4",
    "andar": 1,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-101"
  },
  {
    "codigo": "BL4-104",
    "nome": "Laboratório de Informática 1",
    "bloco": "BL4",
    "andar": 1,
    "tipo": "LABORATORIO",
    "localizacaoMapa": "sala-bl4-104"
  },
  {
    "codigo": "BL4-201",
    "nome": "Sala 201",
    "bloco": "BL4",
    "andar": 2,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-201"
  },
  {
    "codigo": "BL4-202",
    "nome": "Auditório",
    "bloco": "BL4",
    "andar": 2,
    "tipo": "AUDITORIO",
    "localizacaoMapa": "sala-bl4-202"
  }
]
```

</details>

### ✅ Filtrar salas por andar

`GET http://localhost:3000/api/salas?andar=1` → **200** em 12 ms

**O que o contrato espera:** **2.3** Filtro `andar` na URL. Todas as salas devolvidas devem ser do andar 1.

- ✅ status 200
- ✅ resposta em JSON
- ✅ todas do andar 1

<details><summary>Resposta recebida</summary>

```json
[
  {
    "codigo": "BL4-101",
    "nome": "Sala 101",
    "bloco": "BL4",
    "andar": 1,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-101"
  },
  {
    "codigo": "BL4-104",
    "nome": "Laboratório de Informática 1",
    "bloco": "BL4",
    "andar": 1,
    "tipo": "LABORATORIO",
    "localizacaoMapa": "sala-bl4-104"
  }
]
```

</details>

### ✅ Filtrar salas por tipo

`GET http://localhost:3000/api/salas?tipo=LABORATORIO` → **200** em 6 ms

**O que o contrato espera:** **2.3** Filtro `tipo`. Ajuste o valor para um tipo que exista no DER.

- ✅ status 200
- ✅ resposta em JSON
- ✅ todas do tipo pedido

<details><summary>Resposta recebida</summary>

```json
[
  {
    "codigo": "BL4-104",
    "nome": "Laboratório de Informática 1",
    "bloco": "BL4",
    "andar": 1,
    "tipo": "LABORATORIO",
    "localizacaoMapa": "sala-bl4-104"
  }
]
```

</details>

### ✅ Buscar salas

`GET http://localhost:3000/api/salas?busca=104` → **200** em 14 ms

**O que o contrato espera:** **2.3** Filtro `busca` (texto livre). Confira manualmente se os resultados fazem sentido.

- ✅ status 200
- ✅ resposta em JSON
- ✅ retorna lista

<details><summary>Resposta recebida</summary>

```json
[
  {
    "codigo": "BL4-104",
    "nome": "Laboratório de Informática 1",
    "bloco": "BL4",
    "andar": 1,
    "tipo": "LABORATORIO",
    "localizacaoMapa": "sala-bl4-104"
  }
]
```

</details>

### ✅ Detalhe da sala (com fotos)

`GET http://localhost:3000/api/salas/BL4-104` → **200** em 17 ms

**O que o contrato espera:** **2.2** Sala pelo **código**, não pelo ID. **2.4** `fotos: [{ url, descricao }]`; sala sem foto retorna `fotos: []`. `descricao` é o texto alternativo (RNF10). `url` pronta para uso.

- ✅ status 200
- ✅ resposta em JSON
- ✅ mesmo código pedido
- ✅ fotos é lista
- ✅ cada foto tem url e descricao
- ✅ campos em camelCase

<details><summary>Resposta recebida</summary>

```json
{
  "codigo": "BL4-104",
  "nome": "Laboratório de Informática 1",
  "bloco": "BL4",
  "andar": 1,
  "tipo": "LABORATORIO",
  "localizacaoMapa": "sala-bl4-104",
  "fotos": [
    {
      "url": "https://placehold.co/800x600?text=BL4-104+frente",
      "descricao": "Laboratório 1 visto da porta, com bancadas de computadores"
    },
    {
      "url": "https://placehold.co/800x600?text=BL4-104+fundo",
      "descricao": "Fundo do Laboratório 1, com projetor e lousa"
    }
  ]
}
```

</details>

### ✅ Detalhe de sala sem fotos

`GET http://localhost:3000/api/salas/BL4-202` → **200** em 9 ms

**O que o contrato espera:** **2.4** A BL4-202 (Auditório) não tem fotos no seed: `fotos` deve vir como `[]`, nunca ausente.

- ✅ status 200
- ✅ resposta em JSON
- ✅ fotos é lista (pode ser vazia)

<details><summary>Resposta recebida</summary>

```json
{
  "codigo": "BL4-202",
  "nome": "Auditório",
  "bloco": "BL4",
  "andar": 2,
  "tipo": "AUDITORIO",
  "localizacaoMapa": "sala-bl4-202",
  "fotos": []
}
```

</details>

### ✅ Sala inexistente

`GET http://localhost:3000/api/salas/XX-999` → **404** em 10 ms

**O que o contrato espera:** **2.6** Registro não encontrado → 404 no formato padrão.

- ✅ status 404
- ✅ erro no formato { erro, codigo }

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "Registro não encontrado.",
  "codigo": "P2025"
}
```

</details>

## 2. Aulas

### ✅ Listar aulas

`GET http://localhost:3000/api/aulas` → **200** em 56 ms

**O que o contrato espera:** **2.1** Cada aula traz `sala`, `disciplina`, `curso`, `professor`, `turma` (alinhado ao DER). **2.5** Dia SEGUNDA–SEXTA, período MATUTINO/VESPERTINO/NOTURNO, horário "HH:MM".

- ✅ status 200
- ✅ resposta em JSON
- ✅ retorna lista
- ✅ aulas seguem o contrato
- ✅ campos em camelCase

<details><summary>Resposta recebida</summary>

```json
[
  {
    "id": 1,
    "diaSemana": "SEGUNDA",
    "periodo": "NOTURNO",
    "horaInicio": "19:00",
    "horaTermino": "22:30",
    "sala": {
      "codigo": "BL4-104",
      "nome": "Laboratório de Informática 1",
      "andar": 1
    },
    "curso": {
      "sigla": "ES",
      "nome": "Engenharia de Software"
    },
    "disciplina": {
      "nome": "Engenharia de Software II"
    },
    "professor": {
      "nome": "Ana Souza"
    },
    "turma": {
      "nome": "ES-3A",
      "semestre": 3
    }
  },
  {
    "id": 2,
    "diaSemana": "SEGUNDA",
    "periodo": "NOTURNO",
    "horaInicio": "19:00",
    "horaTermino": "20:40",
    "sala": {
      "codigo": "BL4-101",
      "nome": "Sala 101",
      "andar": 1
    },
    "curso": {
      "sigla": "SI",
      "nome": "Sistemas de Informação"
    },
    "disciplina": {
      "nome": "Sistemas Operacionais"
    },
    "professor": {
      "nome": "Bruno Lima"
    },
    "turma": {
      "nome": "SI-3A",
      "semestre": 3
    }
  },
  {
    "id": 3,
    "diaSemana": "TERCA",
    "periodo": "NOTURNO",
    "horaInicio": "19:00",
    "horaTermino": "22:30",
    "sala": {
      "codigo": "BL4-104",
      "nome": "Laboratório de Informática 1",
      "andar": 1
    },
    "curso": {
      "sigla": "SI",
      "nome": "Sistemas de Informação"
    },
    "disciplina": {
      "nome": "Banco de Dados"
    },
    "professor": {
      "nome": "Carla Mendes"
    },
    "turma": {
      "nome": "SI-3A",
      "semestre": 3
    }
  },
  {

… (cortado)
```

</details>

### ✅ Aulas com filtros combinados

`GET http://localhost:3000/api/aulas?curso=ES&dia=SEGUNDA&periodo=NOTURNO` → **200** em 12 ms

**O que o contrato espera:** **2.3** Filtros combinados. Todos os resultados devem atender aos três filtros ao mesmo tempo.

- ✅ status 200
- ✅ resposta em JSON
- ✅ todas atendem aos filtros

<details><summary>Resposta recebida</summary>

```json
[
  {
    "id": 1,
    "diaSemana": "SEGUNDA",
    "periodo": "NOTURNO",
    "horaInicio": "19:00",
    "horaTermino": "22:30",
    "sala": {
      "codigo": "BL4-104",
      "nome": "Laboratório de Informática 1",
      "andar": 1
    },
    "curso": {
      "sigla": "ES",
      "nome": "Engenharia de Software"
    },
    "disciplina": {
      "nome": "Engenharia de Software II"
    },
    "professor": {
      "nome": "Ana Souza"
    },
    "turma": {
      "nome": "ES-3A",
      "semestre": 3
    }
  }
]
```

</details>

### ✅ Aulas de uma sala

`GET http://localhost:3000/api/aulas?sala=BL4-104` → **200** em 8 ms

**O que o contrato espera:** **2.2** Filtro de sala pelo **código**.

- ✅ status 200
- ✅ resposta em JSON
- ✅ todas na sala pedida

<details><summary>Resposta recebida</summary>

```json
[
  {
    "id": 1,
    "diaSemana": "SEGUNDA",
    "periodo": "NOTURNO",
    "horaInicio": "19:00",
    "horaTermino": "22:30",
    "sala": {
      "codigo": "BL4-104",
      "nome": "Laboratório de Informática 1",
      "andar": 1
    },
    "curso": {
      "sigla": "ES",
      "nome": "Engenharia de Software"
    },
    "disciplina": {
      "nome": "Engenharia de Software II"
    },
    "professor": {
      "nome": "Ana Souza"
    },
    "turma": {
      "nome": "ES-3A",
      "semestre": 3
    }
  },
  {
    "id": 3,
    "diaSemana": "TERCA",
    "periodo": "NOTURNO",
    "horaInicio": "19:00",
    "horaTermino": "22:30",
    "sala": {
      "codigo": "BL4-104",
      "nome": "Laboratório de Informática 1",
      "andar": 1
    },
    "curso": {
      "sigla": "SI",
      "nome": "Sistemas de Informação"
    },
    "disciplina": {
      "nome": "Banco de Dados"
    },
    "professor": {
      "nome": "Carla Mendes"
    },
    "turma": {
      "nome": "SI-3A",
      "semestre": 3
    }
  }
]
```

</details>

### ❌ Dia fora do padrão (SABADO)

`GET http://localhost:3000/api/aulas?dia=SABADO` → **400** em 2 ms

**O que o contrato espera:** **RN04** Só SEGUNDA a SEXTA. Hoje o enum do banco ainda aceita SABADO. **2.6** Parâmetro inválido → 400.

- ✅ status 400
- ❌ erro no formato { erro, codigo } — `codigo: expected undefined to be a string`

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "O filtro \"dia\" aceita: SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA."
}
```

</details>

### ❌ Período inválido

`GET http://localhost:3000/api/aulas?periodo=MADRUGADA` → **400** em 1 ms

**O que o contrato espera:** **RN03** Períodos válidos: MATUTINO, VESPERTINO, NOTURNO → 400.

- ✅ status 400
- ❌ erro no formato { erro, codigo } — `codigo: expected undefined to be a string`

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "O filtro \"periodo\" aceita: MATUTINO, VESPERTINO, NOTURNO."
}
```

</details>

## 3. Ocupação

### ✅ Ocupação em dia e hora

`GET http://localhost:3000/api/salas/ocupacao?dia=SEGUNDA&hora=19:30` → **200** em 13 ms

**O que o contrato espera:** **2.3** Ocupação e disponibilidade das salas. Se voltar 404 "sala não encontrada", a rota `/ocupacao` está declarada **depois** de `/:codigo` no router.

- ✅ status 200
- ✅ resposta em JSON
- ✅ retorna lista
- ✅ toda sala tem codigo
- ✅ campos em camelCase

<details><summary>Resposta recebida</summary>

```json
[
  {
    "codigo": "BL4-101",
    "nome": "Sala 101",
    "bloco": "BL4",
    "andar": 1,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-101",
    "ocupada": true,
    "aula": {
      "id": 2,
      "diaSemana": "SEGUNDA",
      "periodo": "NOTURNO",
      "horaInicio": "19:00",
      "horaTermino": "20:40",
      "sala": {
        "codigo": "BL4-101",
        "nome": "Sala 101",
        "andar": 1
      },
      "curso": {
        "sigla": "SI",
        "nome": "Sistemas de Informação"
      },
      "disciplina": {
        "nome": "Sistemas Operacionais"
      },
      "professor": {
        "nome": "Bruno Lima"
      },
      "turma": {
        "nome": "SI-3A",
        "semestre": 3
      }
    }
  },
  {
    "codigo": "BL4-104",
    "nome": "Laboratório de Informática 1",
    "bloco": "BL4",
    "andar": 1,
    "tipo": "LABORATORIO",
    "localizacaoMapa": "sala-bl4-104",
    "ocupada": true,
    "aula": {
      "id": 1,
      "diaSemana": "SEGUNDA",
      "periodo": "NOTURNO",
      "horaInicio": "19:00",
      "horaTermino": "22:30",
      "sala": {
        "codigo": "BL4-104",
        "nome": "Laboratório de Informática 1",
        "andar": 1
      },
      "curso": {
        "sigla": "ES",
        "nome": "Engenharia de Software"
      },
      "disciplina": {
        "nome": "Engenharia de Software II"
      },
      "professor": {
        "nome": "Ana Souza"
      },
      "turma": {
        "nome": "ES-3A",
        "semestre": 3
      }
    }
  },
  
… (cortado)
```

</details>

### ✅ Ocupação agora (fuso)

`GET http://localhost:3000/api/salas/ocupacao` → **200** em 34 ms

**O que o contrato espera:** **2.5** Sem `dia`/`hora`, a API usa o momento atual **em America/Sao_Paulo**. O servidor roda em UTC: compare manualmente com o relógio — se a ocupação estiver 3h adiantada, o fuso não foi tratado.

- ✅ status 200
- ✅ resposta em JSON

<details><summary>Resposta recebida</summary>

```json
[
  {
    "codigo": "BL4-101",
    "nome": "Sala 101",
    "bloco": "BL4",
    "andar": 1,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-101",
    "ocupada": true,
    "aula": {
      "id": 2,
      "diaSemana": "SEGUNDA",
      "periodo": "NOTURNO",
      "horaInicio": "19:00",
      "horaTermino": "20:40",
      "sala": {
        "codigo": "BL4-101",
        "nome": "Sala 101",
        "andar": 1
      },
      "curso": {
        "sigla": "SI",
        "nome": "Sistemas de Informação"
      },
      "disciplina": {
        "nome": "Sistemas Operacionais"
      },
      "professor": {
        "nome": "Bruno Lima"
      },
      "turma": {
        "nome": "SI-3A",
        "semestre": 3
      }
    }
  },
  {
    "codigo": "BL4-104",
    "nome": "Laboratório de Informática 1",
    "bloco": "BL4",
    "andar": 1,
    "tipo": "LABORATORIO",
    "localizacaoMapa": "sala-bl4-104",
    "ocupada": true,
    "aula": {
      "id": 1,
      "diaSemana": "SEGUNDA",
      "periodo": "NOTURNO",
      "horaInicio": "19:00",
      "horaTermino": "22:30",
      "sala": {
        "codigo": "BL4-104",
        "nome": "Laboratório de Informática 1",
        "andar": 1
      },
      "curso": {
        "sigla": "ES",
        "nome": "Engenharia de Software"
      },
      "disciplina": {
        "nome": "Engenharia de Software II"
      },
      "professor": {
        "nome": "Ana Souza"
      },
      "turma": {
        "nome": "ES-3A",
        "semestre": 3
      }
    }
  },
  
… (cortado)
```

</details>

### ❌ Hora inválida

`GET http://localhost:3000/api/salas/ocupacao?dia=SEGUNDA&hora=25:99` → **400** em 1 ms

**O que o contrato espera:** **2.5** Horário deve ser "HH:MM" válido → 400.

- ✅ status 400
- ❌ erro no formato { erro, codigo } — `codigo: expected undefined to be a string`

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "O filtro \"hora\" deve estar no formato \"HH:MM\" (ex.: 19:30)."
}
```

</details>

### ❌ Dia inválido

`GET http://localhost:3000/api/salas/ocupacao?dia=SABADO&hora=10:00` → **400** em 1 ms

**O que o contrato espera:** **RN04** → 400.

- ✅ status 400
- ❌ erro no formato { erro, codigo } — `codigo: expected undefined to be a string`

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "O filtro \"dia\" aceita: SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA."
}
```

</details>

## 4. Cursos

### ✅ Listar cursos

`GET http://localhost:3000/api/cursos` → **200** em 4 ms

**O que o contrato espera:** **2.3** Opções do filtro de curso: cada item precisa de `sigla` e `nome` (DER).

- ✅ status 200
- ✅ resposta em JSON
- ✅ retorna lista
- ✅ cada curso tem sigla e nome
- ✅ campos em camelCase

<details><summary>Resposta recebida</summary>

```json
[
  {
    "id": 2,
    "nome": "Engenharia de Software",
    "sigla": "ES",
    "criadoEm": "2026-10-26T23:16:03.886Z",
    "atualizadoEm": "2026-10-26T23:16:03.886Z"
  },
  {
    "id": 1,
    "nome": "Sistemas de Informação",
    "sigla": "SI",
    "criadoEm": "2026-10-26T23:16:03.882Z",
    "atualizadoEm": "2026-10-26T23:16:03.882Z"
  }
]
```

</details>

### ❌ Curso com ID inválido

`GET http://localhost:3000/api/cursos/abc` → **500** em 8 ms

**O que o contrato espera:** **2.6** Parâmetro inválido → 400. Hoje `Number('abc')` vira NaN e a API responde 500.

- ❌ status 400 — `expected 500 to deeply equal 400`
- ❌ erro no formato { erro, codigo } — `codigo: expected undefined to be a string`

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "Erro interno do servidor"
}
```

</details>

### ✅ Curso inexistente

`GET http://localhost:3000/api/cursos/999999` → **404** em 4 ms

**O que o contrato espera:** **2.6** Registro não encontrado → 404.

- ✅ status 404
- ✅ erro no formato { erro, codigo }

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "Registro não encontrado.",
  "codigo": "P2025"
}
```

</details>

## 5. Erros gerais

### ❌ Rota inexistente

`GET http://localhost:3000/api/rota-que-nao-existe` → **404** em 1 ms

**O que o contrato espera:** **2.6** 404 no formato padrão. Hoje vem só `{ erro }`, sem `codigo`.

- ✅ status 404
- ❌ erro no formato { erro, codigo } — `codigo: expected undefined to be a string`

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "Rota não encontrada"
}
```

</details>

### ❌ JSON malformado

`POST http://localhost:3000/api/cursos` → **400** em 18 ms

**O que o contrato espera:** **2.6** Corpo inválido → 400 no formato padrão. ⚠ Só faz sentido enquanto as rotas de escrita existirem (ver decisão sobre RNF08).

- ✅ status 400
- ❌ erro no formato { erro, codigo } — `codigo: expected undefined to be a string`

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "Expected double-quoted property name in JSON at position 18 (line 1 column 19)"
}
```

</details>
