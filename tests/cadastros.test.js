import assert from 'node:assert/strict'
import test from 'node:test'
import { openapi } from '../src/docs/openapi.js'
import { montarConsultaProfessores, montarConsultaTurmas } from '../src/services/cadastros.js'

test('turmas sem filtros: todas, ordenadas por semestre e nome, sem colunas internas', () => {
  const { where, select, orderBy } = montarConsultaTurmas()
  assert.deepEqual(where, {})
  assert.deepEqual(select, { id: true, nome: true, semestre: true })
  assert.deepEqual(orderBy, [{ semestre: 'asc' }, { nome: 'asc' }])
})

test('turmas por curso (via aulas) e semestre', () => {
  const { where } = montarConsultaTurmas({ curso: 'si', semestre: '6' })
  assert.deepEqual(where, { aulas: { some: { curso: { is: { sigla: 'SI' } } } }, semestre: 6 })
})

test('professores por curso, só id e nome', () => {
  const { where, select } = montarConsultaProfessores({ curso: 'EC' })
  assert.deepEqual(where, { aulas: { some: { curso: { is: { sigla: 'EC' } } } } })
  assert.deepEqual(select, { id: true, nome: true })
})

test('filtros inválidos ou desconhecidos respondem 400', () => {
  for (const [montar, query] of [
    [montarConsultaTurmas, { semestre: '0' }],
    [montarConsultaTurmas, { semestre: 'abc' }],
    [montarConsultaTurmas, { curso: 'S' }],
    [montarConsultaTurmas, { curso: ['SI', 'EC'] }],
    [montarConsultaTurmas, { professor: '1' }],
    [montarConsultaProfessores, { semestre: '6' }],
  ]) {
    assert.throws(() => montar(query), (err) => err.status === 400, JSON.stringify(query))
  }
})

test('swagger documenta todas as rotas montadas em src/routes/index.js', () => {
  for (const rota of [
    '/api/health', '/api/salas', '/api/salas/ocupacao', '/api/salas/{codigo}', '/api/aulas', '/api/aulas/{id}',
    '/api/cursos', '/api/cursos/{id}', '/api/turmas', '/api/professores', '/api/horarios', '/api/horarios/{id}',
  ]) {
    assert.ok(openapi.paths[rota]?.get, rota)
  }
  // Somente leitura (RNF08): nenhum POST/PUT/PATCH/DELETE documentado.
  for (const [rota, metodos] of Object.entries(openapi.paths)) assert.deepEqual(Object.keys(metodos), ['get'], rota)
})
