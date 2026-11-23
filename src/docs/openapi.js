// Documentação OpenAPI (Swagger) da API. Ao criar ou mudar uma rota, atualize aqui e em docs/API.md.
// Visualização: http://localhost:3000/api/docs
import pkg from '../../package.json' with { type: 'json' }

const DIAS = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA']
const PERIODOS = ['MATUTINO', 'VESPERTINO', 'NOTURNO']

const texto = (example, description) => ({ type: 'string', example, ...(description ? { description } : {}) })
const inteiro = (example) => ({ type: 'integer', example })
const ref = (nome) => ({ $ref: `#/components/schemas/${nome}` })
const filtro = (name, description, schema, required = false) => ({ name, in: 'query', required, description, schema })
const caminho = (name, description, schema) => ({ name, in: 'path', required: true, description, schema })

const json = (schema, description = 'OK') => ({ description, content: { 'application/json': { schema } } })
const lista = (nome) => json({ type: 'array', items: ref(nome) })
const ERROS = {
  400: { $ref: '#/components/responses/ParametroInvalido' },
  500: { $ref: '#/components/responses/ErroInterno' },
  503: { $ref: '#/components/responses/BancoIndisponivel' },
}
const ERRO_404 = { $ref: '#/components/responses/NaoEncontrado' }

const get = (tag, summary, { description, parameters = [], responses }) => ({
  get: { tags: [tag], summary, description, parameters, responses: { ...responses, ...ERROS } },
})

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'API do Mapa Interativo — Uniara',
    version: pkg.version,
    description:
      'Consulta de salas, aulas, cursos, turmas e professores da Unidade 4. A API é **somente leitura** (RNF08).\n\n' +
      'Filtros são opcionais e combinados (E). Busca sem resultado devolve `[]`, não erro. ' +
      'Erros seguem o formato `{ "erro": "...", "codigo": "..." }`. Documentação completa: `docs/API.md`.',
  },
  tags: [
    { name: 'Salas' }, { name: 'Aulas' }, { name: 'Cursos' }, { name: 'Turmas' },
    { name: 'Professores' }, { name: 'Horários' }, { name: 'Saúde' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Saúde'],
        summary: 'Verifica se a API e o banco estão no ar',
        responses: { 200: json(ref('Saude')), 503: json(ref('Saude'), 'Banco indisponível') },
      },
    },
    '/api/salas': get('Salas', 'Lista salas para o mapa e a busca (sem fotos)', {
      parameters: [
        filtro('andar', 'Andar (0 = térreo)', inteiro(0)),
        filtro('tipo', 'Tipo da sala', texto('LABORATORIO')),
        filtro('busca', 'Parte do código ou do nome', texto('104')),
      ],
      responses: { 200: lista('Sala') },
    }),
    '/api/salas/ocupacao': get('Salas', 'Ocupação das salas em um dia e horário', {
      description: 'Sem parâmetros, usa o momento atual em America/Sao_Paulo. `dia` e `hora` vão juntos.',
      parameters: [
        filtro('dia', 'Dia da semana', { type: 'string', enum: DIAS, example: 'SEGUNDA' }),
        filtro('hora', 'Hora (HH:MM)', texto('19:30')),
      ],
      responses: { 200: lista('Ocupacao') },
    }),
    '/api/salas/{codigo}': get('Salas', 'Detalhe da sala, com fotos', {
      parameters: [caminho('codigo', 'Código da sala', texto('BL4-104'))],
      responses: { 200: json(ref('SalaDetalhe')), 404: ERRO_404 },
    }),
    '/api/aulas': get('Aulas', 'Lista aulas com filtros combinados', {
      description: 'Ordenado por dia, hora de início e sala. Parâmetro desconhecido responde 400.',
      parameters: [
        filtro('curso', 'Sigla do curso (um por consulta)', texto('SI')),
        filtro('dia', 'Dia da semana', { type: 'string', enum: DIAS, example: 'SEGUNDA' }),
        filtro('periodo', 'Período', { type: 'string', enum: PERIODOS, example: 'NOTURNO' }),
        filtro('sala', 'Código da sala', texto('BL4-104')),
        filtro('bloco', 'Bloco da sala', texto('BL4')),
        filtro('turma', 'Nome da turma', texto('SI-6A')),
        filtro('professor', 'Parte do nome do professor', texto('Almeida')),
        filtro('semestre', 'Semestre da turma (1 a 20)', inteiro(6)),
        filtro('inicio', 'Começa a partir de (HH:MM)', texto('19:00')),
        filtro('fim', 'Termina até (HH:MM)', texto('22:40')),
      ],
      responses: { 200: lista('Aula') },
    }),
    '/api/aulas/{id}': get('Aulas', 'Uma aula', {
      parameters: [caminho('id', 'Id da aula', inteiro(12))],
      responses: { 200: json(ref('Aula')), 404: ERRO_404 },
    }),
    '/api/cursos': get('Cursos', 'Lista cursos (opções do filtro de curso)', { responses: { 200: lista('Curso') } }),
    '/api/cursos/{id}': get('Cursos', 'Um curso', {
      parameters: [caminho('id', 'Id do curso', inteiro(1))],
      responses: { 200: json(ref('Curso')), 404: ERRO_404 },
    }),
    '/api/turmas': get('Turmas', 'Lista turmas (opções do filtro de turma)', {
      description: 'Com `curso`, só as turmas que têm aula daquele curso.',
      parameters: [filtro('curso', 'Sigla do curso', texto('SI')), filtro('semestre', 'Semestre (1 a 20)', inteiro(6))],
      responses: { 200: lista('Turma') },
    }),
    '/api/professores': get('Professores', 'Lista professores (opções do filtro de professor)', {
      description: 'Com `curso`, só os professores que dão aula naquele curso.',
      parameters: [filtro('curso', 'Sigla do curso', texto('SI'))],
      responses: { 200: lista('Professor') },
    }),
    '/api/horarios': get('Horários', 'Registros de horário com os ids das relações', {
      parameters: [
        filtro('dia', 'Dia da semana', { type: 'string', enum: DIAS, example: 'TERCA' }),
        filtro('salaId', 'Id da sala', inteiro(3)),
        filtro('turmaId', 'Id da turma', inteiro(7)),
      ],
      responses: { 200: lista('Horario') },
    }),
    '/api/horarios/{id}': get('Horários', 'Um registro de horário', {
      parameters: [caminho('id', 'Id do registro', inteiro(12))],
      responses: { 200: json(ref('Horario')), 404: ERRO_404 },
    }),
  },
  components: {
    schemas: {
      Saude: {
        type: 'object',
        properties: { status: texto('ok'), ambiente: texto('DEV'), banco: texto('ok') },
      },
      Sala: {
        type: 'object',
        properties: {
          codigo: texto('BL4-104'), nome: texto('Sala 104'), bloco: texto('BL4'), andar: inteiro(0),
          tipo: texto('SALA_DE_AULA'), localizacaoMapa: texto('...'),
        },
      },
      SalaDetalhe: {
        allOf: [
          ref('Sala'),
          {
            type: 'object',
            properties: {
              fotos: {
                type: 'array',
                items: { type: 'object', properties: { url: texto('https://.../bl4-104-1.jpg'), descricao: texto('Vista da porta') } },
              },
            },
          },
        ],
      },
      Ocupacao: {
        allOf: [
          ref('Sala'),
          {
            type: 'object',
            properties: { ocupada: { type: 'boolean', example: true }, aula: { ...ref('Aula'), nullable: true } },
          },
        ],
      },
      Aula: {
        type: 'object',
        properties: {
          id: inteiro(12),
          diaSemana: { type: 'string', enum: DIAS, example: 'SEGUNDA' },
          periodo: { type: 'string', enum: PERIODOS, example: 'NOTURNO' },
          horaInicio: texto('19:00'),
          horaTermino: texto('20:40'),
          sala: { type: 'object', properties: { codigo: texto('BL4-104'), nome: texto('Sala 104'), andar: inteiro(0) } },
          curso: { type: 'object', properties: { sigla: texto('SI'), nome: texto('Sistemas de Informação') } },
          disciplina: { type: 'object', properties: { nome: texto('Engenharia de Software II') } },
          professor: { type: 'object', properties: { nome: texto('Prof. Carlos Almeida') } },
          turma: { type: 'object', properties: { nome: texto('SI-6A'), semestre: inteiro(6) } },
        },
      },
      Curso: {
        type: 'object',
        properties: { id: inteiro(1), sigla: texto('SI'), nome: texto('Sistemas de Informação') },
      },
      Turma: {
        type: 'object',
        properties: { id: inteiro(7), nome: texto('SI-6A'), semestre: inteiro(6) },
      },
      Professor: {
        type: 'object',
        properties: { id: inteiro(2), nome: texto('Prof. Carlos Almeida') },
      },
      Horario: {
        type: 'object',
        properties: {
          id: inteiro(12), salaId: inteiro(3), cursoId: inteiro(1), disciplinaId: inteiro(5), professorId: inteiro(2),
          turmaId: inteiro(7), diaSemana: texto('SEGUNDA'), periodo: texto('NOTURNO'),
          horaInicio: texto('19:00'), horaTermino: texto('20:40'),
        },
      },
      Erro: {
        type: 'object',
        properties: { erro: texto('Mensagem legível para o usuário.'), codigo: texto('PARAMETRO_INVALIDO') },
      },
    },
    responses: {
      ParametroInvalido: json(ref('Erro'), 'Parâmetro inválido (PARAMETRO_INVALIDO)'),
      NaoEncontrado: json(ref('Erro'), 'Registro não encontrado (NAO_ENCONTRADO)'),
      ErroInterno: json(ref('Erro'), 'Erro inesperado (ERRO_INTERNO)'),
      BancoIndisponivel: json(ref('Erro'), 'Banco indisponível (BANCO_INDISPONIVEL)'),
    },
  },
}
