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

  it('rotas de escrita não existem: nenhuma requisição altera dados (RNF08)', async () => {
    const [, antes] = await api.pedir('/api/cursos')
    const corpo = json('{"sigla": "ES", "nome": "Engenharia de Software"}')
    for (const [metodo, caminho] of [
      ['POST', '/api/cursos'],
      ['PUT', '/api/cursos/1'],
      ['PATCH', '/api/cursos/1'],
      ['DELETE', '/api/cursos/1'],
      ['POST', '/api/salas'],
      ['DELETE', '/api/salas/BL4-104'],
      ['POST', '/api/aulas'],
      ['POST', '/api/horarios'],
      ['DELETE', '/api/horarios/1'],
    ]) {
      const [status, resposta] = await api.pedir(caminho, { ...corpo, method: metodo })
      assert.deepEqual([status, resposta.codigo], [404, 'ROTA_NAO_ENCONTRADA'], `${metodo} ${caminho}`)
    }
    const [, depois] = await api.pedir('/api/cursos')
    assert.deepEqual(depois, antes)
  })

  it('JSON malformado também não chega a lugar nenhum', async () => {
    const [status, corpo] = await api.pedir('/api/cursos', json('{"sigla": "SI",'))
    assert.deepEqual([status, corpo.codigo], [404, 'ROTA_NAO_ENCONTRADA'])
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

  it('turmas e professores trazem só os campos das opções de filtro', async () => {
    const [statusTurmas, turmas] = await api.pedir('/api/turmas?curso=SI')
    const [statusProfessores, professores] = await api.pedir('/api/professores?curso=SI')
    assert.deepEqual([statusTurmas, statusProfessores], [200, 200])
    for (const turma of turmas) assert.deepEqual(Object.keys(turma).sort(), ['id', 'nome', 'semestre'])
    for (const professor of professores) assert.deepEqual(Object.keys(professor).sort(), ['id', 'nome'])

    const [status, corpo] = await api.pedir('/api/turmas?semestre=0')
    assert.deepEqual([status, corpo.codigo], [400, 'PARAMETRO_INVALIDO'])
  })

  it('/api/docs serve o Swagger e o openapi.json', async () => {
    const [status, spec] = await api.pedir('/api/docs/openapi.json')
    assert.equal(status, 200)
    assert.equal(spec.openapi, '3.0.3')
  })
})
