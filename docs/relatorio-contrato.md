# Relatório da revisão do contrato da API

| | |
|---|---|
| Data | 18/11/2026, 16:19:10 |
| Ambiente | Local (`http://localhost:3000/api`) |
| Requests | 22 de 22 sem divergências |
| Verificações | 69 de 69 aprovadas |

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
| ✅ | 2. Aulas | Dia fora do padrão (SABADO) | 400 | 2/2 |
| ✅ | 2. Aulas | Período inválido | 400 | 2/2 |
| ✅ | 3. Ocupação | Ocupação em dia e hora | 200 | 5/5 |
| ✅ | 3. Ocupação | Ocupação agora (fuso) | 200 | 2/2 |
| ✅ | 3. Ocupação | Hora inválida | 400 | 2/2 |
| ✅ | 3. Ocupação | Dia inválido | 400 | 2/2 |
| ✅ | 4. Cursos | Listar cursos | 200 | 5/5 |
| ✅ | 4. Cursos | Curso com ID inválido | 400 | 2/2 |
| ✅ | 4. Cursos | Curso inexistente | 404 | 2/2 |
| ✅ | 5. Erros gerais | Rota inexistente | 404 | 2/2 |
| ✅ | 5. Erros gerais | Escrita bloqueada (RNF08) | 404 | 2/2 |

## 0. Health

### ✅ Health

`GET http://localhost:3000/api/health` → **200** em 47 ms

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

`GET http://localhost:3000/api/salas` → **200** em 32 ms

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
    "andar": 0,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-101"
  },
  {
    "codigo": "BL4-102",
    "nome": "Auditório",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "AUDITORIO",
    "localizacaoMapa": "sala-bl4-102"
  },
  {
    "codigo": "BL4-103",
    "nome": "Laboratório de Informática 7",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "LABORATORIO",
    "localizacaoMapa": "sala-bl4-103"
  },
  {
    "codigo": "BL4-104",
    "nome": "Sala 104",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-104"
  },
  {
    "codigo": "BL4-105",
    "nome": "Laboratório de Informática 2",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "LABORATORIO",
    "localizacaoMapa": "sala-bl4-105"
  },
  {
    "codigo": "BL4-106",
    "nome": "Biblioteca",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "SERVICO",
    "localizacaoMapa": "sala-bl4-106"
  },
  {
    "codigo": "BL4-107",
    "nome": "Cantina",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "SERVICO",
    "localizacaoMapa": "sala-bl4-107"
  },
  {
    "codigo": "BL4-108",
    "nome": "Secretaria",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "SERVICO",
    "localizacaoMapa": "sala-bl4-108"
  },
  {
    "codigo": "BL4-109",
    "nome": "Sala 109",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-109"
  },
  {
    "codigo": "BL4-110",
    "
… (cortado)
```

</details>

### ✅ Filtrar salas por andar

`GET http://localhost:3000/api/salas?andar=1` → **200** em 5 ms

**O que o contrato espera:** **2.3** Filtro `andar` na URL. Todas as salas devolvidas devem ser do andar 1.

- ✅ status 200
- ✅ resposta em JSON
- ✅ todas do andar 1

<details><summary>Resposta recebida</summary>

```json
[]
```

</details>

### ✅ Filtrar salas por tipo

`GET http://localhost:3000/api/salas?tipo=LABORATORIO` → **200** em 2 ms

**O que o contrato espera:** **2.3** Filtro `tipo`. Ajuste o valor para um tipo que exista no DER.

- ✅ status 200
- ✅ resposta em JSON
- ✅ todas do tipo pedido

<details><summary>Resposta recebida</summary>

```json
[
  {
    "codigo": "BL4-103",
    "nome": "Laboratório de Informática 7",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "LABORATORIO",
    "localizacaoMapa": "sala-bl4-103"
  },
  {
    "codigo": "BL4-105",
    "nome": "Laboratório de Informática 2",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "LABORATORIO",
    "localizacaoMapa": "sala-bl4-105"
  }
]
```

</details>

### ✅ Buscar salas

`GET http://localhost:3000/api/salas?busca=104` → **200** em 7 ms

**O que o contrato espera:** **2.3** Filtro `busca` (texto livre). Confira manualmente se os resultados fazem sentido.

- ✅ status 200
- ✅ resposta em JSON
- ✅ retorna lista

<details><summary>Resposta recebida</summary>

```json
[
  {
    "codigo": "BL4-104",
    "nome": "Sala 104",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-104"
  }
]
```

</details>

### ✅ Detalhe da sala (com fotos)

`GET http://localhost:3000/api/salas/BL4-104` → **200** em 8 ms

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
  "nome": "Sala 104",
  "bloco": "BL4",
  "andar": 0,
  "tipo": "SALA_DE_AULA",
  "localizacaoMapa": "sala-bl4-104",
  "fotos": [
    {
      "url": "https://placehold.co/800x600?text=BL4-104+frente",
      "descricao": "Sala 104 vista da porta, com carteiras enfileiradas voltadas para a lousa"
    },
    {
      "url": "https://placehold.co/800x600?text=BL4-104+fundo",
      "descricao": "Fundo da Sala 104, com o projetor no teto e a porta à direita"
    }
  ]
}
```

</details>

### ✅ Detalhe de sala sem fotos

`GET http://localhost:3000/api/salas/BL4-110` → **200** em 2 ms

**O que o contrato espera:** **2.4** A BL4-110 não tem fotos no seed: `fotos` deve vir como `[]`, nunca ausente.

- ✅ status 200
- ✅ resposta em JSON
- ✅ fotos é lista (pode ser vazia)

<details><summary>Resposta recebida</summary>

```json
{
  "codigo": "BL4-110",
  "nome": "Sala 110",
  "bloco": "BL4",
  "andar": 0,
  "tipo": "SALA_DE_AULA",
  "localizacaoMapa": "sala-bl4-110",
  "fotos": []
}
```

</details>

### ✅ Sala inexistente

`GET http://localhost:3000/api/salas/XX-999` → **404** em 3 ms

**O que o contrato espera:** **2.6** Registro não encontrado → 404 no formato padrão.

- ✅ status 404
- ✅ erro no formato { erro, codigo }

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "Registro não encontrado.",
  "codigo": "NAO_ENCONTRADO"
}
```

</details>

## 2. Aulas

### ✅ Listar aulas

`GET http://localhost:3000/api/aulas` → **200** em 70 ms

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
    "id": 2,
    "diaSemana": "SEGUNDA",
    "periodo": "MATUTINO",
    "horaInicio": "08:00",
    "horaTermino": "09:40",
    "sala": {
      "codigo": "BL4-101",
      "nome": "Sala 101",
      "andar": 0
    },
    "curso": {
      "sigla": "SI",
      "nome": "Sistemas de Informação"
    },
    "disciplina": {
      "nome": "Banco de Dados"
    },
    "professor": {
      "nome": "Marina Duarte"
    },
    "turma": {
      "nome": "SI-4A",
      "semestre": 4
    }
  },
  {
    "id": 14,
    "diaSemana": "SEGUNDA",
    "periodo": "VESPERTINO",
    "horaInicio": "14:00",
    "horaTermino": "15:40",
    "sala": {
      "codigo": "BL4-114",
      "nome": "Sala 114",
      "andar": 0
    },
    "curso": {
      "sigla": "EC",
      "nome": "Engenharia de Computação"
    },
    "disciplina": {
      "nome": "Algoritmos"
    },
    "professor": {
      "nome": "Paulo Mendes"
    },
    "turma": {
      "nome": "EC-1A",
      "semestre": 1
    }
  },
  {
    "id": 3,
    "diaSemana": "SEGUNDA",
    "periodo": "NOTURNO",
    "horaInicio": "19:00",
    "horaTermino": "20:40",
    "sala": {
      "codigo": "BL4-102",
      "nome": "Auditório",
      "andar": 0
    },
    "curso": {
      "sigla": "SI",
      "nome": "Sistemas de Informação"
    },
    "disciplina": {
      "nome": "Palestra de Abertura"
    },
    "professor": {
      "nome": "Carlos Almeida"
    },
    "turma": {
      "nome": "SI-1A",
      "semestre": 1
    }
  },
  {
    "id": 4,
    "diaSemana": "SEGUNDA
… (cortado)
```

</details>

### ✅ Aulas com filtros combinados

`GET http://localhost:3000/api/aulas?curso=SI&dia=SEGUNDA&periodo=NOTURNO` → **200** em 13 ms

**O que o contrato espera:** **2.3** Filtros combinados. Todos os resultados devem atender aos três filtros ao mesmo tempo.

- ✅ status 200
- ✅ resposta em JSON
- ✅ todas atendem aos filtros

<details><summary>Resposta recebida</summary>

```json
[
  {
    "id": 3,
    "diaSemana": "SEGUNDA",
    "periodo": "NOTURNO",
    "horaInicio": "19:00",
    "horaTermino": "20:40",
    "sala": {
      "codigo": "BL4-102",
      "nome": "Auditório",
      "andar": 0
    },
    "curso": {
      "sigla": "SI",
      "nome": "Sistemas de Informação"
    },
    "disciplina": {
      "nome": "Palestra de Abertura"
    },
    "professor": {
      "nome": "Carlos Almeida"
    },
    "turma": {
      "nome": "SI-1A",
      "semestre": 1
    }
  },
  {
    "id": 4,
    "diaSemana": "SEGUNDA",
    "periodo": "NOTURNO",
    "horaInicio": "19:00",
    "horaTermino": "22:40",
    "sala": {
      "codigo": "BL4-103",
      "nome": "Laboratório de Informática 7",
      "andar": 0
    },
    "curso": {
      "sigla": "SI",
      "nome": "Sistemas de Informação"
    },
    "disciplina": {
      "nome": "Programação Web"
    },
    "professor": {
      "nome": "Marina Duarte"
    },
    "turma": {
      "nome": "SI-4A",
      "semestre": 4
    }
  },
  {
    "id": 1,
    "diaSemana": "SEGUNDA",
    "periodo": "NOTURNO",
    "horaInicio": "19:00",
    "horaTermino": "20:40",
    "sala": {
      "codigo": "BL4-104",
      "nome": "Sala 104",
      "andar": 0
    },
    "curso": {
      "sigla": "SI",
      "nome": "Sistemas de Informação"
    },
    "disciplina": {
      "nome": "Engenharia de Software II"
    },
    "professor": {
      "nome": "Carlos Almeida"
    },
    "turma": {
      "nome": "SI-6A",
      "semestre": 6
    }
  }
]
```

</details>

### ✅ Aulas de uma sala

`GET http://localhost:3000/api/aulas?sala=BL4-104` → **200** em 10 ms

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
    "horaTermino": "20:40",
    "sala": {
      "codigo": "BL4-104",
      "nome": "Sala 104",
      "andar": 0
    },
    "curso": {
      "sigla": "SI",
      "nome": "Sistemas de Informação"
    },
    "disciplina": {
      "nome": "Engenharia de Software II"
    },
    "professor": {
      "nome": "Carlos Almeida"
    },
    "turma": {
      "nome": "SI-6A",
      "semestre": 6
    }
  }
]
```

</details>

### ✅ Dia fora do padrão (SABADO)

`GET http://localhost:3000/api/aulas?dia=SABADO` → **400** em 1 ms

**O que o contrato espera:** **RN04** Só SEGUNDA a SEXTA. Hoje o enum do banco ainda aceita SABADO. **2.6** Parâmetro inválido → 400.

- ✅ status 400
- ✅ erro no formato { erro, codigo }

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "\"dia\" deve ser um destes valores: SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA.",
  "codigo": "PARAMETRO_INVALIDO"
}
```

</details>

### ✅ Período inválido

`GET http://localhost:3000/api/aulas?periodo=MADRUGADA` → **400** em 1 ms

**O que o contrato espera:** **RN03** Períodos válidos: MATUTINO, VESPERTINO, NOTURNO → 400.

- ✅ status 400
- ✅ erro no formato { erro, codigo }

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "\"periodo\" deve ser um destes valores: MATUTINO, VESPERTINO, NOTURNO.",
  "codigo": "PARAMETRO_INVALIDO"
}
```

</details>

## 3. Ocupação

### ✅ Ocupação em dia e hora

`GET http://localhost:3000/api/salas/ocupacao?dia=SEGUNDA&hora=19:30` → **200** em 7 ms

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
    "andar": 0,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-101",
    "ocupada": false,
    "aula": null
  },
  {
    "codigo": "BL4-102",
    "nome": "Auditório",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "AUDITORIO",
    "localizacaoMapa": "sala-bl4-102",
    "ocupada": true,
    "aula": {
      "id": 3,
      "diaSemana": "SEGUNDA",
      "periodo": "NOTURNO",
      "horaInicio": "19:00",
      "horaTermino": "20:40",
      "sala": {
        "codigo": "BL4-102",
        "nome": "Auditório",
        "andar": 0
      },
      "curso": {
        "sigla": "SI",
        "nome": "Sistemas de Informação"
      },
      "disciplina": {
        "nome": "Palestra de Abertura"
      },
      "professor": {
        "nome": "Carlos Almeida"
      },
      "turma": {
        "nome": "SI-1A",
        "semestre": 1
      }
    }
  },
  {
    "codigo": "BL4-103",
    "nome": "Laboratório de Informática 7",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "LABORATORIO",
    "localizacaoMapa": "sala-bl4-103",
    "ocupada": true,
    "aula": {
      "id": 4,
      "diaSemana": "SEGUNDA",
      "periodo": "NOTURNO",
      "horaInicio": "19:00",
      "horaTermino": "22:40",
      "sala": {
        "codigo": "BL4-103",
        "nome": "Laboratório de Informática 7",
        "andar": 0
      },
      "curso": {
        "sigla": "SI",
        "nome": "Sistemas de Informação"
      },
      "disciplin
… (cortado)
```

</details>

### ✅ Ocupação agora (fuso)

`GET http://localhost:3000/api/salas/ocupacao` → **200** em 8 ms

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
    "andar": 0,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-101",
    "ocupada": false,
    "aula": null
  },
  {
    "codigo": "BL4-102",
    "nome": "Auditório",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "AUDITORIO",
    "localizacaoMapa": "sala-bl4-102",
    "ocupada": false,
    "aula": null
  },
  {
    "codigo": "BL4-103",
    "nome": "Laboratório de Informática 7",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "LABORATORIO",
    "localizacaoMapa": "sala-bl4-103",
    "ocupada": false,
    "aula": null
  },
  {
    "codigo": "BL4-104",
    "nome": "Sala 104",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-104",
    "ocupada": false,
    "aula": null
  },
  {
    "codigo": "BL4-105",
    "nome": "Laboratório de Informática 2",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "LABORATORIO",
    "localizacaoMapa": "sala-bl4-105",
    "ocupada": false,
    "aula": null
  },
  {
    "codigo": "BL4-109",
    "nome": "Sala 109",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-109",
    "ocupada": false,
    "aula": null
  },
  {
    "codigo": "BL4-110",
    "nome": "Sala 110",
    "bloco": "BL4",
    "andar": 0,
    "tipo": "SALA_DE_AULA",
    "localizacaoMapa": "sala-bl4-110",
    "ocupada": false,
    "aula": null
  },
  {
    "codigo": "BL4-111",
    "nome": "Sala 111",
    "bloc
… (cortado)
```

</details>

### ✅ Hora inválida

`GET http://localhost:3000/api/salas/ocupacao?dia=SEGUNDA&hora=25:99` → **400** em 1 ms

**O que o contrato espera:** **2.5** Horário deve ser "HH:MM" válido → 400.

- ✅ status 400
- ✅ erro no formato { erro, codigo }

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "O filtro \"hora\" deve estar no formato \"HH:MM\" (ex.: 19:30).",
  "codigo": "PARAMETRO_INVALIDO"
}
```

</details>

### ✅ Dia inválido

`GET http://localhost:3000/api/salas/ocupacao?dia=SABADO&hora=10:00` → **400** em 1 ms

**O que o contrato espera:** **RN04** → 400.

- ✅ status 400
- ✅ erro no formato { erro, codigo }

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "O filtro \"dia\" aceita: SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA.",
  "codigo": "PARAMETRO_INVALIDO"
}
```

</details>

## 4. Cursos

### ✅ Listar cursos

`GET http://localhost:3000/api/cursos` → **200** em 1 ms

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
    "sigla": "EC",
    "nome": "Engenharia de Computação"
  },
  {
    "id": 3,
    "sigla": "IA",
    "nome": "Inteligência Artificial"
  },
  {
    "id": 1,
    "sigla": "SI",
    "nome": "Sistemas de Informação"
  }
]
```

</details>

### ✅ Curso com ID inválido

`GET http://localhost:3000/api/cursos/abc` → **400** em 1 ms

**O que o contrato espera:** **2.6** Parâmetro inválido → 400. Hoje `Number('abc')` vira NaN e a API responde 500.

- ✅ status 400
- ✅ erro no formato { erro, codigo }

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "\"id\" deve ser um número inteiro maior ou igual a 1.",
  "codigo": "PARAMETRO_INVALIDO"
}
```

</details>

### ✅ Curso inexistente

`GET http://localhost:3000/api/cursos/999999` → **404** em 2 ms

**O que o contrato espera:** **2.6** Registro não encontrado → 404.

- ✅ status 404
- ✅ erro no formato { erro, codigo }

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "Curso não encontrado.",
  "codigo": "NAO_ENCONTRADO"
}
```

</details>

## 5. Erros gerais

### ✅ Rota inexistente

`GET http://localhost:3000/api/rota-que-nao-existe` → **404** em 0 ms

**O que o contrato espera:** **2.6** 404 no formato padrão. Hoje vem só `{ erro }`, sem `codigo`.

- ✅ status 404
- ✅ erro no formato { erro, codigo }

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "Rota não encontrada: GET /api/rota-que-nao-existe",
  "codigo": "ROTA_NAO_ENCONTRADA"
}
```

</details>

### ✅ Escrita bloqueada (RNF08)

`POST http://localhost:3000/api/cursos` → **404** em 2 ms

**O que o contrato espera:** **RNF08** A API é só de consulta: os dados entram pelo seed. Nenhuma requisição consegue criar, alterar ou apagar dados. **2.6** Rota de escrita inexistente → 404 no formato padrão.

- ✅ status 404
- ✅ erro no formato { erro, codigo }

<details><summary>Resposta recebida</summary>

```json
{
  "erro": "Rota não encontrada: POST /api/cursos",
  "codigo": "ROTA_NAO_ENCONTRADA"
}
```

</details>
