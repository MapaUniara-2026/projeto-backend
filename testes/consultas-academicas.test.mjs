import assert from 'node:assert/strict'
import test from 'node:test'
import {
  consultarAulaPorId,
  consultarAulas,
  formatarAula,
  montarConsultaAcademica,
  normalizarFiltros,
} from '../src/services/consultas-academicas.js'

const exemplo = {
  id: 7,
  diaSemana: 'SEGUNDA',
  horaInicio: '19:00',
  horaFim: '22:30',
  sala: { id: 10, codigo: 'B-101', bloco: 'B', capacidade: 40 },
  turma: {
    id: 5,
    codigo: 'ES-3A',
    semestre: '2026.2',
    curso: { id: 2, codigo: 'ES', nome: 'Engenharia de Software' },
    professor: { id: 3, nome: 'Ana Souza' },
  },
}

test('busca sem filtros recupera todas as aulas', () => {
  const { where, include } = montarConsultaAcademica()
  assert.deepEqual(where, {})
  assert.ok(include.sala)
  assert.ok(include.turma.select.curso)
  assert.ok(include.turma.select.professor)
})

test('combina dia, período, sala, bloco, curso, turma, professor, semestre e horários', () => {
  const { where } = montarConsultaAcademica({
    dia: 'segunda', periodo: 'noturno', sala: 'b-101', bloco: 'B', curso: 'ES',
    turma: 'ES-3A', professor: 'Ana', semestre: '2026.2', inicio: '19:00', fim: '23:00',
  })
  assert.equal(where.diaSemana, 'SEGUNDA')
  assert.equal(where.sala.is.codigo.equals, 'b-101')
  assert.equal(where.sala.is.bloco.equals, 'B')
  assert.equal(where.turma.is.codigo.equals, 'ES-3A')
  assert.equal(where.turma.is.semestre, '2026.2')
  assert.equal(where.turma.is.curso.is.OR[0].codigo.equals, 'ES')
  assert.equal(where.turma.is.professor.is.nome.contains, 'Ana')
  assert.deepEqual(where.AND, [
    { horaInicio: { gte: '18:00' } },
    { horaInicio: { lt: '24:00' } },
    { horaInicio: { gte: '19:00' } },
    { horaFim: { lte: '23:00' } },
  ])
})

test('normaliza valores de dia e turno, inclusive sábado', () => {
  assert.equal(normalizarFiltros({ dia: 'sabado', periodo: 'matutino' }).dia, 'SABADO')
  assert.equal(normalizarFiltros({ dia: 'sabado', periodo: 'matutino' }).periodo, 'MATUTINO')
})

test('recusa parâmetros inválidos com erro HTTP 400', () => {
  for (const filtro of [
    { dia: 'DOMINGO' }, { periodo: 'MADRUGADA' }, { inicio: '25:00' },
    { inicio: '20:00', fim: '19:00' }, { curso: ['ES', 'ADM'] }, { injeção: 'abc' },
    { sala: ' '.repeat(3) },
  ]) {
    assert.throws(() => montarConsultaAcademica(filtro), (erro) => erro.status === 400)
  }
})

test('formata a saída com sala, turma, curso e professor conforme os relacionamentos', () => {
  assert.deepEqual(formatarAula(exemplo), {
    id: 7, diaSemana: 'SEGUNDA', horaInicio: '19:00', horaFim: '22:30',
    sala: exemplo.sala,
    turma: { id: 5, codigo: 'ES-3A', semestre: '2026.2' },
    curso: exemplo.turma.curso,
    professor: exemplo.turma.professor,
  })
})

test('consulta aulas com Prisma simulado e devolve JSON pronto ao front-end', async () => {
  let consultaRecebida
  const db = { horario: { findMany: async (consulta) => {
    consultaRecebida = consulta
    return [exemplo]
  } } }
  const aulas = await consultarAulas(db, { sala: 'B-101', dia: 'SEGUNDA' })
  assert.equal(aulas.length, 1)
  assert.equal(aulas[0].curso.codigo, 'ES')
  assert.equal(consultaRecebida.where.sala.is.codigo.equals, 'B-101')
})

test('detalhe consulta ID numérico válido e valida os inválidos', async () => {
  let idPesquisado
  const db = { horario: { findUniqueOrThrow: async ({ where }) => {
    idPesquisado = where.id
    return exemplo
  } } }
  assert.equal((await consultarAulaPorId(db, '7')).sala.codigo, 'B-101')
  assert.equal(idPesquisado, 7)
  for (const id of ['0', 'abc', '-1', '1.5', '999999999999999999999']) {
    await assert.rejects(() => consultarAulaPorId(db, id), (erro) => erro.status === 400)
  }
})

test('busca sem resultados retorna lista vazia, não erro 404', async () => {
  const db = { horario: { findMany: async () => [] } }
  assert.deepEqual(await consultarAulas(db, { dia: 'QUARTA' }), [])
})
