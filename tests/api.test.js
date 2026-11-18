// Testes de ponta a ponta. Precisam do banco com as migrações aplicadas
// (npm run db:up && npm run db:deploy). Só fazem leituras: não alteram dados.
import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { subirApi } from './servidor.js'

let api
before(async () => {
  api = await subirApi()
})
after(async () => {
  await api.fechar()
  const { prisma } = await import('../src/lib/prisma.js')
  await prisma.$disconnect()
})

const json = (corpo) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo })

describe('API', () => {
  it('rota inexistente responde 404 ROTA_NAO_ENCONTRADA', async () => {
    const [status, corpo] = await api.pedir('/api/nao-existe')
    assert.equal(status, 404)
    assert.equal(corpo.codigo, 'ROTA_NAO_ENCONTRADA')
  })

  it('JSON malformado responde 400 PARAMETRO_INVALIDO', async () => {
    const [status, corpo] = await api.pedir('/api/cursos', json('{"sigla": "SI",'))
    assert.equal(status, 400)
    assert.equal(corpo.codigo, 'PARAMETRO_INVALIDO')
  })

  it('corpo ausente ou campos inválidos respondem 400 antes de chegar no banco', async () => {
    const [semCorpo] = await api.pedir('/api/cursos', { method: 'POST' })
    assert.equal(semCorpo, 400)
    const [status, corpo] = await api.pedir('/api/cursos', json('{"sigla": "Sistemas de Informação", "nome": "SI"}'))
    assert.equal(status, 400)
    assert.match(corpo.erro, /sigla/)
  })

  it('id inválido responde 400', async () => {
    const [status, corpo] = await api.pedir('/api/cursos/abc')
    assert.equal(status, 400)
    assert.equal(corpo.codigo, 'PARAMETRO_INVALIDO')
  })

  it('curso inexistente responde 404 NAO_ENCONTRADO', async () => {
    const [status, corpo] = await api.pedir('/api/cursos/2147483647')
    assert.deepEqual([status, corpo], [404, { erro: 'Curso não encontrado.', codigo: 'NAO_ENCONTRADO' }])
  })

  it('horário com relação inexistente responde 404 sem gravar nada', async () => {
    const inexistente = 2147483647
    const horario = JSON.stringify({
      salaId: inexistente, cursoId: inexistente, disciplinaId: inexistente, professorId: inexistente,
      turmaId: inexistente, diaSemana: 'QUARTA', horaInicio: '19:00', horaTermino: '20:00',
    })
    const [status, corpo] = await api.pedir('/api/horarios', json(horario))
    assert.deepEqual([status, corpo], [404, { erro: 'Sala não encontrada.', codigo: 'NAO_ENCONTRADO' }])
  })

  it('filtros inválidos de aulas e ocupação respondem 400 no formato padrão', async () => {
    for (const caminho of [
      '/api/aulas?dia=SABADO',
      '/api/aulas?periodo=MADRUGADA',
      '/api/salas/ocupacao?dia=SEGUNDA&hora=25:99',
      '/api/salas/ocupacao?dia=SABADO&hora=10:00',
    ]) {
      const [status, corpo] = await api.pedir(caminho)
      assert.deepEqual([status, corpo.codigo], [400, 'PARAMETRO_INVALIDO'], caminho)
    }
  })

  it('listas não vazam colunas internas', async () => {
    const [, cursos] = await api.pedir('/api/cursos')
    const [, salas] = await api.pedir('/api/salas')
    for (const item of [...cursos, ...salas]) {
      assert.equal('criadoEm' in item, false)
      assert.equal('atualizadoEm' in item, false)
    }
    // A lista de salas não traz fotos (RNF04); elas só vêm no detalhe.
    for (const sala of salas) assert.equal('fotos' in sala, false)
  })
})
