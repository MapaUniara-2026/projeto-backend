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
    const [status, corpo] = await api.pedir('/api/cursos', json('{"codigo": "SI",'))
    assert.equal(status, 400)
    assert.equal(corpo.codigo, 'PARAMETRO_INVALIDO')
  })

  it('corpo ausente ou campos inválidos respondem 400 antes de chegar no banco', async () => {
    const [semCorpo] = await api.pedir('/api/cursos', { method: 'POST' })
    assert.equal(semCorpo, 400)
    const [status, corpo] = await api.pedir('/api/salas', json('{"codigo": "sala 1", "capacidade": 10}'))
    assert.equal(status, 400)
    assert.match(corpo.erro, /BL4-104/)
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

  it('horário com turma ou sala inexistente responde 404 sem gravar nada', async () => {
    const horario = (turmaId, salaId) =>
      JSON.stringify({ turmaId, salaId, diaSemana: 'QUARTA', horaInicio: '19:00', horaFim: '20:00' })
    const [statusTurma, turma] = await api.pedir('/api/horarios', json(horario(2147483647, 1)))
    assert.deepEqual([statusTurma, turma], [404, { erro: 'Turma não encontrada.', codigo: 'NAO_ENCONTRADO' }])
    // Sem seed (ex.: no CI) a turma 1 também pode não existir, então só o código é garantido.
    const [statusSala, sala] = await api.pedir('/api/horarios', json(horario(1, 2147483647)))
    assert.deepEqual([statusSala, sala.codigo], [404, 'NAO_ENCONTRADO'])
  })

  it('listas não vazam colunas internas', async () => {
    const [, cursos] = await api.pedir('/api/cursos')
    const [, salas] = await api.pedir('/api/salas')
    for (const item of [...cursos, ...salas]) {
      assert.equal('criadoEm' in item, false)
      assert.equal('atualizadoEm' in item, false)
    }
    for (const sala of salas) assert.deepEqual(Array.isArray(sala.fotos), true)
  })
})
