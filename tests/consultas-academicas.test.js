import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SELECT_AULA,
  consultarAulaPorId,
  consultarAulas,
  formatarAula,
  montarConsultaAcademica,
  normalizarFiltros,
} from '../src/services/consultas-academicas.js'

const hora = (hhmm) => new Date(`1970-01-01T${hhmm}:00Z`)

// Como o Prisma devolve uma linha de aulas com o SELECT_AULA.
const exemplo = {
  id: 7,
  diaSemana: 'SEGUNDA',
  periodo: 'NOTURNO',
  horaInicio: hora('19:00'),
  horaTermino: hora('22:30'),
  sala: { codigo: 'BL4-104', nome: 'Laboratório de Informática 1', andar: 1 },
  curso: { sigla: 'SI', nome: 'Sistemas de Informação' },
  disciplina: { nome: 'Banco de Dados' },
  professor: { nome: 'Ana Souza' },
  turma: { nome: 'SI-3A', semestre: 3 },
}

test('busca sem filtros recupera todas as aulas com o select do contrato', () => {
  const { where, select } = montarConsultaAcademica()
  assert.deepEqual(where, {})
  assert.equal(select, SELECT_AULA)
})

test('combina dia, período, sala, bloco, curso, turma, professor, semestre e horários', () => {
  const { where } = montarConsultaAcademica({
    dia: 'segunda', periodo: 'noturno', sala: 'bl4-104', bloco: 'BL4', curso: 'si',
    turma: 'SI-3A', professor: 'Ana', semestre: '3', inicio: '19:00', fim: '23:00',
  })
  assert.equal(where.diaSemana, 'SEGUNDA')
  assert.equal(where.periodo, 'NOTURNO')
  assert.equal(where.sala.is.codigo.equals, 'bl4-104')
  assert.equal(where.sala.is.bloco.equals, 'BL4')
  assert.equal(where.curso.is.sigla.equals, 'si')
  assert.equal(where.turma.is.nome.equals, 'SI-3A')
  assert.equal(where.turma.is.semestre, 3)
  assert.equal(where.professor.is.nome.contains, 'Ana')
  assert.deepEqual(where.AND, [
    { horaInicio: { gte: hora('19:00') } },
    { horaTermino: { lte: hora('23:00') } },
  ])
})

test('normaliza valores de dia e período', () => {
  const filtros = normalizarFiltros({ dia: 'terça', periodo: 'matutino' })
  assert.equal(filtros.dia, 'TERCA')
  assert.equal(filtros.periodo, 'MATUTINO')
})

test('recusa parâmetros inválidos com erro HTTP 400', () => {
  for (const filtro of [
    { dia: 'SABADO' }, { dia: 'DOMINGO' }, { periodo: 'MADRUGADA' }, { inicio: '25:00' },
    { inicio: '20:00', fim: '19:00' }, { curso: ['ES', 'ADM'] }, { injeção: 'abc' },
    { sala: ' '.repeat(3) }, { semestre: 'terceiro' },
  ]) {
    assert.throws(() => montarConsultaAcademica(filtro), (erro) => erro.status === 400, JSON.stringify(filtro))
  }
})

test('formata as horas como HH:MM e mantém as relações do contrato', () => {
  assert.deepEqual(formatarAula(exemplo), { ...exemplo, horaInicio: '19:00', horaTermino: '22:30' })
})

test('consulta aulas com Prisma simulado e devolve JSON pronto ao front-end', async () => {
  let consultaRecebida
  const db = { aula: { findMany: async (consulta) => {
    consultaRecebida = consulta
    return [exemplo]
  } } }
  const aulas = await consultarAulas(db, { sala: 'BL4-104', dia: 'SEGUNDA' })
  assert.equal(aulas.length, 1)
  assert.equal(aulas[0].curso.sigla, 'SI')
  assert.equal(aulas[0].horaTermino, '22:30')
  assert.equal(consultaRecebida.where.sala.is.codigo.equals, 'BL4-104')
})

test('detalhe consulta ID numérico válido e valida os inválidos', async () => {
  let idPesquisado
  const db = { aula: { findUnique: async ({ where }) => {
    idPesquisado = where.id
    return exemplo
  } } }
  assert.equal((await consultarAulaPorId(db, '7')).sala.codigo, 'BL4-104')
  assert.equal(idPesquisado, 7)
  for (const id of ['0', 'abc', '-1', '1.5', '999999999999999999999']) {
    await assert.rejects(() => consultarAulaPorId(db, id), (erro) => erro.status === 400)
  }
})

test('aula inexistente responde 404', async () => {
  const db = { aula: { findUnique: async () => null } }
  await assert.rejects(() => consultarAulaPorId(db, '99'), (erro) => erro.status === 404)
})

test('busca sem resultados retorna lista vazia, não erro 404', async () => {
  const db = { aula: { findMany: async () => [] } }
  assert.deepEqual(await consultarAulas(db, { dia: 'QUARTA' }), [])
})
