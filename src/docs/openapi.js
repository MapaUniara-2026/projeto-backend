// Documentação OpenAPI (Swagger) da API. Ao criar ou mudar uma rota, atualize aqui também.
// Visualização: http://localhost:3000/api/docs
// Por enquanto só as consultas (GET); as rotas de cadastro entram quando a validação delas fechar.
import pkg from '../../package.json' with { type: 'json' }

const texto = (description, example) => ({ type: 'string', description, example })
const filtro = (name, description, example, schema = { type: 'string' }) => ({
  name,
  in: 'query',
  required: false,
  description,
  schema: { ...schema, example },
})

const lista = (ref) => ({
  description: 'OK',
  content: { 'application/json': { schema: { type: 'array', items: { $ref: `#/components/schemas/${ref}` } } } },
})
const objeto = (ref, description = 'OK') => ({
  description,
  content: { 'application/json': { schema: { $ref: `#/components/schemas/${ref}` } } },
})

const ERRO_400 = { $ref: '#/components/responses/RequisicaoInvalida' }

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'API do Mapa Interativo — Uniara',
    version: pkg.version,
    description:
      'Consultas de dados acadêmicos (aulas, turmas, salas, cursos e professores).\n\n' +
      'Todos os filtros são **opcionais** e podem ser **combinados**: a API devolve só o que atende a todos eles. ' +
      'Códigos (curso, sala, turma, dia, período) não diferenciam maiúsculas de minúsculas.\n\n' +
      'Erros vêm com o campo `erro` explicando o problema.',
  },
  tags: [
    { name: 'Aulas', description: 'Horários das turmas, com filtros combinados' },
    { name: 'Turmas' },
    { name: 'Salas' },
    { name: 'Cursos' },
    { name: 'Professores' },
    { name: 'Saúde' },
  ],
  paths: {
    '/api/aulas': {
      get: {
        tags: ['Aulas'],
        summary: 'Lista aulas com filtros combinados',
        description:
          'O período é calculado pela hora de início: antes de 12:00 é MATUTINO, de 12:00 a 17:59 é VESPERTINO ' +
          'e a partir de 18:00 é NOTURNO. Só são consultados dias de segunda a sexta. ' +
          'Resultado ordenado por dia e hora de início; lista vazia quando nenhuma aula atende aos filtros.',
        parameters: [
          filtro('dia', 'Dia da semana (segunda a sexta)', 'SEGUNDA', { type: 'string', enum: ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'] }),
          filtro('periodo', 'Período do dia', 'NOTURNO', { type: 'string', enum: ['MATUTINO', 'VESPERTINO', 'NOTURNO'] }),
          filtro('curso', 'Código do curso', 'SI'),
          filtro('sala', 'Código da sala', 'BL4-104'),
          filtro('turma', 'Código da turma', 'SI6-01'),
          filtro('semestre', 'Semestre letivo', '2026.2'),
          filtro('professor', 'Id do professor', 1, { type: 'integer' }),
        ],
        responses: { 200: lista('Aula'), 400: ERRO_400 },
      },
    },
    '/api/turmas': {
      get: {
        tags: ['Turmas'],
        summary: 'Lista turmas com filtros combinados',
        parameters: [
          filtro('curso', 'Código do curso', 'SI'),
          filtro('semestre', 'Semestre letivo', '2026.2'),
          filtro('professor', 'Id do professor', 1, { type: 'integer' }),
        ],
        responses: { 200: lista('Turma'), 400: ERRO_400 },
      },
    },
    '/api/salas': {
      get: { tags: ['Salas'], summary: 'Lista salas', responses: { 200: lista('Sala') } },
    },
    '/api/cursos': {
      get: { tags: ['Cursos'], summary: 'Lista cursos', responses: { 200: lista('Curso') } },
    },
    '/api/professores': {
      get: { tags: ['Professores'], summary: 'Lista professores', responses: { 200: lista('Professor') } },
    },
    '/api/health': {
      get: {
        tags: ['Saúde'],
        summary: 'Verifica se a API e o banco estão no ar',
        responses: { 200: objeto('Saude'), 503: objeto('Saude', 'Banco indisponível') },
      },
    },
  },
  components: {
    schemas: {
      Aula: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          dia: texto('Dia da semana (segunda a sexta)', 'SEGUNDA'),
          inicio: texto('Hora de início (HH:MM)', '19:00'),
          fim: texto('Hora de término (HH:MM)', '20:40'),
          periodo: texto('MATUTINO, VESPERTINO ou NOTURNO', 'NOTURNO'),
          sala: {
            type: 'object',
            properties: { codigo: texto('', 'BL4-104'), bloco: { type: 'string', nullable: true, example: 'BL4' } },
          },
          turma: { type: 'object', properties: { codigo: texto('', 'SI6-01'), semestre: texto('', '2026.2') } },
          curso: { $ref: '#/components/schemas/CursoResumo' },
          professor: { $ref: '#/components/schemas/Professor' },
        },
      },
      Turma: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          codigo: texto('', 'SI6-01'),
          semestre: texto('', '2026.2'),
          curso: { $ref: '#/components/schemas/CursoResumo' },
          professor: { $ref: '#/components/schemas/Professor' },
        },
      },
      Sala: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          codigo: texto('', 'BL4-104'),
          bloco: { type: 'string', nullable: true, example: 'BL4' },
          capacidade: { type: 'integer', example: 40 },
        },
      },
      CursoResumo: {
        type: 'object',
        properties: { codigo: texto('', 'SI'), nome: texto('', 'Sistemas de Informação') },
      },
      Curso: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          codigo: texto('', 'SI'),
          nome: texto('', 'Sistemas de Informação'),
        },
      },
      Professor: {
        type: 'object',
        properties: { id: { type: 'integer', example: 1 }, nome: texto('', 'Carlos Almeida') },
      },
      Saude: {
        type: 'object',
        properties: { status: texto('', 'ok'), ambiente: texto('', 'LOCAL'), banco: texto('', 'ok') },
      },
      Erro: {
        type: 'object',
        properties: { erro: texto('Mensagem do erro', 'Dia inválido. Use de SEGUNDA a SEXTA.') },
      },
    },
    responses: {
      RequisicaoInvalida: objeto('Erro', 'Parâmetro inválido'),
    },
  },
}
